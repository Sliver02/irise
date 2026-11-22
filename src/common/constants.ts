/** Opening day. Noon Rome time, so it lands on 5 December in any visitor's time zone. */
export const INAUGURATION = new Date("2026-12-05T12:00:00+01:00");

/** Apps Script web app (apps-script/newsletter.gs). Unset: the newsletter form falls back to EmailJS. */
export const NEWSLETTER_URL = process.env.NEXT_PUBLIC_NEWSLETTER_URL;
