import { locales } from "@/i18n/routing";
import { z } from "zod";

const schema = z.object({ email: z.email(), locale: z.enum(locales) });

/**
 * Newsletter sign-up. Adds the email to MailerLite, which sends the double opt-in email and
 * handles unsubscribes. Turn double opt-in on in MailerLite: the API follows the account setting.
 * Runs on the server so MAILERLITE_API_KEY never reaches the browser.
 * ponytail: a person who unsubscribed and signs up again gets the error message (MailerLite
 * answers 422). Pass `resubscribe: true` if that starts to matter.
 */
export async function POST(req: Request) {
	const body = schema.safeParse(await req.json().catch(() => null));
	if (!body.success) return Response.json({ ok: false }, { status: 400 });

	const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${process.env.MAILERLITE_API_KEY}`,
		},
		// MailerLite ignores unknown field keys: `locale` is saved once a custom field with that key exists.
		body: JSON.stringify({ email: body.data.email, fields: { locale: body.data.locale } }),
	});
	if (!res.ok) console.error("MailerLite", res.status, await res.text());
	return Response.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
}
