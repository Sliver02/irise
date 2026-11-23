"use client";

import { AlertResponse } from "@/common/globalInterfaces";
import { Alert } from "@/components/atoms/Alert";
import { Button } from "@/components/atoms/Button";
import { Container } from "@/components/atoms/Grid";
import { Input } from "@/components/atoms/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import styles from "./Newsletter.module.scss";

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

			// MailerLite sends the confirmation email: nobody is on the list until they click it.
			const { ok } = await fetch("/api/newsletter", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, locale }),
			});

			if (ok) {
				setAlert({ severity: "success", text: t("success") });
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
