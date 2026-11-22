"use client";

import { NEWSLETTER_URL } from "@/common/constants";
import NewsletterTemplate, { NewsletterConfirmation } from "@/common/emailTemplates/NewsletterTemplate";
import { AlertResponse } from "@/common/globalInterfaces";
import { Alert } from "@/components/atoms/Alert";
import { Button } from "@/components/atoms/Button";
import { Container } from "@/components/atoms/Grid";
import { Input } from "@/components/atoms/Input";
import emailjs from "@emailjs/browser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useForm } from "react-hook-form";
import { z } from "zod";
import styles from "./Newsletter.module.scss";

const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE as string;
const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE as string;
const publicKey = process.env.NEXT_PUBLIC_EMAILJS_KEY as string;
const receiverEmail = process.env.NEXT_PUBLIC_RECEIVER_EMAIL as string;

/**
 * Fallback while the Apps Script isn't deployed. Two sends through the EmailJS template shared
 * with smup-yoga and panz-snowboard, whose "To Email" is {{reciver_email}}: one to us, one to the
 * subscriber.
 * ponytail: no Sheet, no double opt-in, no unsubscribe page. We keep the list by hand and people
 * unsubscribe by replying. Set NEXT_PUBLIC_NEWSLETTER_URL to switch to the script.
 */
const sendWithEmailJS = (params: Record<string, string>) =>
	emailjs.send(serviceId, templateId, params, publicKey).then((res) => res.text === "OK");

/**
 * Calls the Apps Script web app in `apps-script/newsletter.gs`, which keeps the list in a
 * Google Sheet and sends every email. The body goes as text/plain (fetch's default for a
 * string), so the browser skips the CORS preflight that Apps Script can't answer.
 */
export const callNewsletter = async (body: Record<string, string>) => {
	if (!NEWSLETTER_URL) return false;
	const res = await fetch(NEWSLETTER_URL, { method: "POST", body: JSON.stringify(body) });
	const { ok } = (await res.json()) as { ok?: boolean };
	return ok === true;
};

export const Newsletter = () => {
	const t = useTranslations("newsletter");
	const locale = useLocale();
	const [loading, setLoading] = useState(false);
	const [alert, setAlert] = useState<AlertResponse | null>(null);

	const schema = z.object({ email: z.email(t("invalidEmail")) });
	type NewsletterFormData = z.infer<typeof schema>;

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<NewsletterFormData>({ resolver: zodResolver(schema) });

	const onSubmit = async ({ email }: NewsletterFormData) => {
		try {
			setLoading(true);
			setAlert(null);

			let ok: boolean;
			if (NEWSLETTER_URL) {
				// Double opt-in: the script emails a confirmation link, nobody is on the list until they click it.
				ok = await callNewsletter({ action: "subscribe", email, locale, consent: t("consent") });
			} else {
				const [toUs, toThem] = await Promise.all([
					sendWithEmailJS({
						reciver_email: receiverEmail,
						name: email,
						email,
						title: `Nuova iscrizione newsletter: ${email}`,
						message_html: renderToStaticMarkup(<NewsletterTemplate email={email} locale={locale} />),
					}),
					sendWithEmailJS({
						reciver_email: email,
						name: "Irise",
						email: receiverEmail, // replies (and unsubscribe requests) come to us
						title: t("confirmation.subject"),
						message_html: renderToStaticMarkup(
							<NewsletterConfirmation
								title={t("confirmation.title")}
								body={t("confirmation.body")}
								unsubscribe={t("confirmation.unsubscribe")}
								signoff={t("confirmation.signoff")}
							/>
						),
					}),
				]);
				ok = toUs && toThem;
			}

			if (ok) {
				setAlert({ severity: "success", text: NEWSLETTER_URL ? t("success") : t("successDirect") });
				reset();
			} else {
				setAlert({ severity: "error", text: t("error") });
			}
		} catch {
			setAlert({ severity: "error", text: t("error") });
		} finally {
			setLoading(false);
		}
	};

	return (
		<section id="newsletter" className={styles.newsletter}>
			<Container>
				<div className={styles.inner}>
					<p className={styles.eyebrow}>{t("eyebrow")}</p>
					<h2 className={styles.title}>{t("title")}</h2>
					<p className={styles.description}>{t("description")}</p>

					<form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
						<Input
							fullWidth
							type="email"
							autoComplete="email"
							label={t("email")}
							error={errors.email?.message}
							{...register("email")}
						/>
						<Button
							type="submit"
							size="large"
							disabled={loading}
							className={styles.submit}
						>
							{loading ? t("loading") : t("submit")}
						</Button>
					</form>

					<p className={styles.consent}>{t("consent")}</p>

					{alert && (
						<Alert
							variant="filled"
							severity={alert.severity}
							onClose={() => setAlert(null)}
							className={styles.alert}
						>
							{alert.text}
						</Alert>
					)}
				</div>
			</Container>
		</section>
	);
};
