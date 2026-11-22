// Mock test for newsletter.gs (fake Sheet, Gmail, lock). Run: node apps-script/newsletter.test.mjs
import assert from "node:assert";
import fs from "node:fs";
import vm from "node:vm";
const src = fs.readFileSync(new URL("newsletter.gs", import.meta.url), "utf8");

const rows = []; const mails = []; let quota = 100; let uuid = 0; let alerts = []; let drafts = [];
const strip = (v) => (typeof v === "string" && v.startsWith("'") ? v.slice(1) : v);
const sheet = {
  getLastRow: () => rows.length,
  appendRow(r) { rows.push(r.map(strip)); return sheet; },
  setFrozenRows() { return sheet; },
  getDataRange: () => ({ getValues: () => rows.map((r) => [...r]) }),
  getRange: (row, col) => ({
    setValue(v) { rows[row - 1][col - 1] = v; },
    setValues([vals]) { vals.forEach((v, k) => (rows[row - 1][col - 1 + k] = strip(v))); },
  }),
};
const ctx = {
  console: { error() {} },
  SpreadsheetApp: {
    getActiveSpreadsheet: () => ({ getSheetByName: () => sheet, getUrl: () => "https://sheet" }),
    getUi: () => ({ alert: (m) => { alerts.push(m); return "YES"; }, ButtonSet: { YES_NO: 1 }, Button: { YES: "YES" } }),
  },
  MailApp: { sendEmail: (m) => { if (quota < 1) throw new Error("quota"); quota--; mails.push(m); }, getRemainingDailyQuota: () => quota },
  GmailApp: { getDrafts: () => drafts },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { createTextOutput: (s) => ({ setMimeType: () => JSON.parse(s) }), MimeType: { JSON: 1 } },
  Utilities: { getUuid: () => `tok-${++uuid}` },
};
vm.createContext(ctx); vm.runInContext(src, ctx);
const post = (b) => ctx.doPost({ postData: { contents: JSON.stringify(b) } }).ok;
const C = vm.runInContext("COL", ctx);
const row = (email) => rows.find((r) => r[C.email] === email);

// bad input
assert.equal(post({ action: "subscribe", email: "=HYPERLINK(1)@x.it", locale: "it" }), false);
assert.equal(post({ action: "subscribe", email: "nope", locale: "it" }), false);
assert.equal(post("garbage"), false);
assert.equal(mails.length, 0);

// subscribe -> pending + confirmation in locale
assert.equal(post({ action: "subscribe", email: " Anna@Example.COM ", locale: "en", consent: "=evil" }), true);
assert.equal(row("anna@example.com")[C.status], "pending");
assert.equal(row("anna@example.com")[C.consent], "=evil".replace(/^/, "") ); // apostrophe stripped by sheet = stored as text
assert.equal(mails.length, 1);
assert.match(mails[0].subject, /Confirm/);
assert.match(mails[0].htmlBody, /https:\/\/spazioirise\.com\/en\/newsletter\?action=confirm&token=tok-1/);
assert.match(mails[0].body, /Confirm subscription \(https:\/\/spazioirise\.com\/en/);

// resubmit within an hour: no new email
assert.equal(post({ action: "subscribe", email: "anna@example.com", locale: "en" }), true);
assert.equal(mails.length, 1);

// confirm -> confirmed + welcome to subscriber (in their locale) + owner notified; second click ok, no extra mail
assert.equal(post({ action: "confirm", token: "tok-1" }), true);
assert.equal(row("anna@example.com")[C.status], "confirmed");
assert.equal(mails[1].to, "anna@example.com");
assert.match(mails[1].subject, /Welcome/);
assert.match(mails[1].htmlBody, /\/en\/newsletter\?action=unsubscribe&token=tok-1">Unsubscribe/);
assert.equal(mails[2].to, "smup.yoga@gmail.com");
assert.equal(post({ action: "confirm", token: "tok-1" }), true);
assert.equal(mails.length, 3);
assert.equal(post({ action: "confirm", token: "wrong" }), false);
assert.equal(post({ action: "confirm" }), false);

// subscribe while confirmed: silent ok
assert.equal(post({ action: "subscribe", email: "anna@example.com", locale: "it" }), true);
assert.equal(mails.length, 3);

// second subscriber, Italian, confirmed; third pending (must not get newsletter)
post({ action: "subscribe", email: "marco@example.it", locale: "it" });
post({ action: "confirm", token: "tok-2" });
post({ action: "subscribe", email: "pending@example.it", locale: "xx" });
assert.equal(row("pending@example.it")[C.locale], "it");
mails.length = 0;

// newsletter send
drafts = [{ getMessage: () => ({ getSubject: () => "[Newsletter] Dicembre", getBody: () => "<p>Ciao a tutti</p>" }) }];
ctx.sendNewsletter();
assert.equal(mails.length, 2);
const anna = mails.find((m) => m.to === "anna@example.com"), marco = mails.find((m) => m.to === "marco@example.it");
assert.equal(anna.subject, "Dicembre");
assert.match(anna.htmlBody, /\/en\/newsletter\?action=unsubscribe&token=tok-1">Unsubscribe/);
assert.match(marco.htmlBody, /\/it\/newsletter\?action=unsubscribe&token=tok-2">Annulla/);
ctx.sendNewsletter(); // resend: skipped
assert.equal(mails.length, 2);
assert.match(alerts.at(-1), /già stata inviata/);

// quota runs out mid-send, resumes next day
drafts = [{ getMessage: () => ({ getSubject: () => "[Newsletter] Gennaio", getBody: () => "<p>x</p>" }) }];
quota = 1; mails.length = 0;
ctx.sendNewsletter();
assert.equal(mails.length, 1);
assert.match(alerts.at(-1), /1 iscritti su 2/);
quota = 100; ctx.sendNewsletter();
assert.equal(mails.length, 2);
assert.notEqual(mails[0].to, mails[1].to);

// unsubscribe; old confirm link can't resubscribe; resubscribe via form works with fresh consent
assert.equal(post({ action: "unsubscribe", token: "tok-1" }), true);
assert.equal(row("anna@example.com")[C.status], "unsubscribed");
assert.equal(Object.prototype.toString.call(row("anna@example.com")[C.unsubscribedAt]), "[object Date]");
assert.equal(post({ action: "confirm", token: "tok-1" }), false);
mails.length = 0;
assert.equal(post({ action: "subscribe", email: "anna@example.com", locale: "it" }), true);
assert.equal(row("anna@example.com")[C.status], "pending");
assert.equal(row("anna@example.com")[C.confirmedAt], "");
assert.match(mails[0].subject, /Conferma/);
assert.equal(rows.length, 4); // header + 3, no duplicate row

// gmail fails on subscribe: nothing written, retry allowed
quota = 0;
assert.equal(post({ action: "subscribe", email: "new@example.it", locale: "it" }), false);
assert.equal(row("new@example.it"), undefined);
console.log("all checks passed");
