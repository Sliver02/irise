/**
 * Irise newsletter: mailing list, double opt-in, unsubscribe and sending.
 *
 * Google Apps Script bound to a Google Sheet owned by smup.yoga@gmail.com.
 * The sheet is the mailing list. Every email goes out from that Gmail account.
 * The site calls it through NEXT_PUBLIC_NEWSLETTER_URL (the web app URL).
 *
 * Setup (once):
 * 1. Signed in as smup.yoga@gmail.com, create a Google Sheet called "Irise newsletter".
 * 2. Extensions > Apps Script. Replace the content of Code.gs with this file. Save.
 * 3. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone.
 *    Authorize when asked (Google says the app is unverified: Advanced > Go to project).
 * 4. Copy the web app URL (ends in /exec) into NEXT_PUBLIC_NEWSLETTER_URL in .env.local,
 *    .env.production and the Vercel project settings.
 * After you edit this file: Deploy > Manage deployments > Edit > Version: New version.
 * The URL stays the same.
 *
 * Send a newsletter:
 * 1. In Gmail, write a draft whose subject starts with "[Newsletter] ". The prefix is removed.
 * 2. Open the sheet and click Newsletter > Invia bozza. Each confirmed subscriber gets their
 *    own copy, with an unsubscribe link in their language.
 * Give every newsletter a new subject: the "lastSent" column skips people who already got it.
 * Insert images by URL. Images pasted into the draft and attachments are not sent.
 *
 * ponytail: Gmail sends at most 100 emails a day (confirmations included). Big sends continue
 * the next day. Move to Brevo or MailerLite when the list grows past that.
 * ponytail: sign-ups never confirmed stay in the sheet as "pending". Delete those older than
 * 30 days by hand, or add a daily trigger when there are too many to do by hand.
 */

const OWNER = "smup.yoga@gmail.com";
const SITE_URL = "https://spazioirise.com"; // same value as SITE_URL in src/common/seoContent.ts
const SENDER_NAME = "Irise";
const DRAFT_PREFIX = "[Newsletter] ";
const SHEET_NAME = "Iscritti";
const HOUR = 60 * 60 * 1000;
const HEADERS = [
	"email",
	"locale",
	"status", // pending | confirmed | unsubscribed
	"token",
	"consent", // the consent text the subscriber saw on the form
	"subscribedAt",
	"confirmedAt",
	"unsubscribedAt",
	"lastSent",
];
const COL = Object.fromEntries(HEADERS.map((h, i) => [h, i]));

const TEXT = {
	it: {
		confirmSubject: "Conferma l'iscrizione alla newsletter di Irise",
		confirmHtml: (link) =>
			"<p>Ciao!</p>" +
			"<p>Per ricevere la newsletter di Irise, conferma l'iscrizione:</p>" +
			`<p><a href="${link}">Conferma l'iscrizione</a></p>` +
			"<p>Se non hai chiesto tu l'iscrizione, ignora questa email: senza conferma non ti scriveremo.</p>" +
			"<p>A presto,<br>Irise</p>",
		footerHtml: (link) =>
			"Ricevi questa email perché hai confermato l'iscrizione alla newsletter di Irise. " +
			`<a href="${link}">Annulla l'iscrizione</a>`,
	},
	en: {
		confirmSubject: "Confirm your Irise newsletter subscription",
		confirmHtml: (link) =>
			"<p>Hi!</p>" +
			"<p>To get the Irise newsletter, please confirm your subscription:</p>" +
			`<p><a href="${link}">Confirm subscription</a></p>` +
			"<p>If you didn't ask to subscribe, ignore this email: without confirmation we won't write to you.</p>" +
			"<p>See you soon,<br>Irise</p>",
		footerHtml: (link) =>
			"You get this email because you subscribed to the Irise newsletter. " +
			`<a href="${link}">Unsubscribe</a>`,
	},
};

function onOpen() {
	SpreadsheetApp.getUi()
		.createMenu("Newsletter")
		.addItem("Invia bozza [Newsletter]", "sendNewsletter")
		.addToUi();
}

/** Site endpoint. Body: { action: "subscribe", email, locale, consent } | { action: "confirm" | "unsubscribe", token }. */
function doPost(e) {
	const lock = LockService.getScriptLock();
	let ok = false;
	try {
		lock.waitLock(10000);
		const req = JSON.parse(e.postData.contents);
		const token = String(req.token || "");
		if (req.action === "subscribe") {
			ok = subscribe(String(req.email || ""), String(req.locale || ""), String(req.consent || ""));
		}
		if (req.action === "confirm") ok = setStatus(token, "confirmed");
		if (req.action === "unsubscribe") ok = setStatus(token, "unsubscribed");
	} catch (err) {
		console.error(err);
	} finally {
		lock.releaseLock();
	}
	return ContentService.createTextOutput(JSON.stringify({ ok })).setMimeType(
		ContentService.MimeType.JSON
	);
}

function subscribe(email, locale, consent) {
	email = email.trim().toLowerCase();
	// The first character must be a letter or a digit: Sheets reads a leading = + - @ as a formula.
	if (email.length > 254 || !/^[a-z0-9][a-z0-9._%+-]*@([a-z0-9-]+\.)+[a-z0-9-]{2,}$/.test(email)) {
		return false;
	}
	locale = TEXT[locale] ? locale : "it";

	const sh = getSheet();
	const data = sh.getDataRange().getValues();
	const i = data.findIndex((r, n) => n > 0 && r[COL.email] === email);
	const old = i > 0 ? data[i] : null;
	const now = new Date();

	// Already subscribed, or a confirmation went out less than an hour ago: send nothing.
	// The answer is "ok" in every case, so the form never reveals who is on the list.
	if (
		old &&
		(old[COL.status] === "confirmed" ||
			(old[COL.status] === "pending" && now - old[COL.subscribedAt] < HOUR))
	) {
		return true;
	}

	const token = old && old[COL.token] ? old[COL.token] : Utilities.getUuid();
	const t = TEXT[locale];
	const html = t.confirmHtml(link(locale, "confirm", token));
	// Send before writing: if Gmail fails, the next attempt is not blocked by the one-hour rule.
	MailApp.sendEmail({ to: email, subject: t.confirmSubject, htmlBody: html, body: toText(html), name: SENDER_NAME });

	// The leading apostrophe keeps the consent text from being read as a formula.
	const row = [email, locale, "pending", token, "'" + consent.slice(0, 500), now, "", "", old ? old[COL.lastSent] : ""];
	if (old) sh.getRange(i + 1, 1, 1, HEADERS.length).setValues([row]);
	else sh.appendRow(row);
	return true;
}

function setStatus(token, status) {
	if (!token) return false;
	const sh = getSheet();
	const data = sh.getDataRange().getValues();
	const i = data.findIndex((r, n) => n > 0 && r[COL.token] === token);
	if (i < 1) return false;

	const r = data[i];
	if (r[COL.status] === status) return true; // link opened twice
	// An old confirmation link must not subscribe again someone who unsubscribed.
	if (status === "confirmed" && r[COL.status] !== "pending") return false;

	sh.getRange(i + 1, COL.status + 1).setValue(status);
	sh.getRange(i + 1, (status === "confirmed" ? COL.confirmedAt : COL.unsubscribedAt) + 1).setValue(new Date());

	if (status === "confirmed") {
		try {
			MailApp.sendEmail({
				to: OWNER,
				subject: `Nuova iscrizione alla newsletter: ${r[COL.email]}`,
				body:
					`${r[COL.email]} ha confermato l'iscrizione alla newsletter (lingua: ${r[COL.locale]}).\n\n` +
					`Lista completa: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`,
			});
		} catch (err) {
			console.error(err); // the subscription is saved: a failed notification must not undo it
		}
	}
	return true;
}

/** Menu Newsletter > Invia bozza: sends the "[Newsletter] …" Gmail draft to every confirmed subscriber. */
function sendNewsletter() {
	const ui = SpreadsheetApp.getUi();
	const draft = GmailApp.getDrafts().find((d) => d.getMessage().getSubject().startsWith(DRAFT_PREFIX));
	if (!draft) {
		ui.alert(`Nessuna bozza in Gmail con l'oggetto che inizia per "${DRAFT_PREFIX}".`);
		return;
	}
	const message = draft.getMessage();
	const subject = message.getSubject().slice(DRAFT_PREFIX.length).trim();
	const body = message.getBody();

	const sh = getSheet();
	const data = sh.getDataRange().getValues();
	const todo = [];
	data.forEach((r, n) => {
		if (n > 0 && r[COL.status] === "confirmed" && r[COL.lastSent] !== subject) todo.push(n);
	});
	if (!todo.length) {
		ui.alert(`"${subject}" è già stata inviata a tutti gli iscritti.`);
		return;
	}
	if (ui.alert(`Inviare "${subject}" a ${todo.length} iscritti?`, ui.ButtonSet.YES_NO) !== ui.Button.YES) {
		return;
	}

	let sent = 0;
	for (const n of todo) {
		if (MailApp.getRemainingDailyQuota() < 1) break;
		const r = data[n];
		const t = TEXT[r[COL.locale]] || TEXT.it;
		const html =
			`${body}<hr><p style="font-size:12px;color:#666">` +
			`${t.footerHtml(link(r[COL.locale], "unsubscribe", r[COL.token]))}</p>`;
		MailApp.sendEmail({ to: r[COL.email], subject, htmlBody: html, body: toText(html), name: SENDER_NAME, replyTo: OWNER });
		sh.getRange(n + 1, COL.lastSent + 1).setValue(subject);
		sent++;
	}
	ui.alert(
		sent === todo.length
			? `Inviata a ${sent} iscritti.`
			: `Inviata a ${sent} iscritti su ${todo.length}: la quota giornaliera di Gmail è finita. ` +
					"Rilancia domani: riparte da chi non l'ha ancora ricevuta."
	);
}

function getSheet() {
	const ss = SpreadsheetApp.getActiveSpreadsheet();
	const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
	if (sh.getLastRow() === 0) sh.appendRow(HEADERS).setFrozenRows(1);
	return sh;
}

function link(locale, action, token) {
	return `${SITE_URL}/${TEXT[locale] ? locale : "it"}/newsletter?action=${action}&token=${token}`;
}

/** Plain-text part of each email. Emails with an HTML part only score worse with spam filters. */
function toText(html) {
	return html
		.replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
		.replace(/<br\s*\/?>|<\/p>|<\/div>|<hr\s*\/?>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}
