"use client";

import { RouteEnum } from "@/common/routeEnum";
import { Alert } from "@/components/atoms/Alert";
import { Button } from "@/components/atoms/Button";
import { Container } from "@/components/atoms/Grid";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { callNewsletter } from "./Newsletter";
import styles from "./Newsletter.module.scss";

export interface NewsletterManageProps {
	action?: string;
	token?: string;
}

/**
 * Landing page for the confirm and unsubscribe links in our emails. It waits for a click
 * instead of acting on page load: mail scanners open links in advance, and that would
 * confirm or unsubscribe people without them doing anything.
 */
export const NewsletterManage = ({ action, token }: NewsletterManageProps) => {
	const t = useTranslations("newsletter");
	const kind = action === "confirm" || action === "unsubscribe" ? action : null;
	const [status, setStatus] = useState<"idle" | "loading" | "done" | "invalid" | "error">(
		kind && token ? "idle" : "invalid"
	);

	const submit = async () => {
		if (!kind || !token) return;
		setStatus("loading");
		try {
			setStatus((await callNewsletter({ action: kind, token })) ? "done" : "invalid");
		} catch {
			setStatus("error");
		}
	};

	const copy = kind && status !== "invalid" ? kind : "invalid";

	return (
		<section className={styles.newsletter}>
			<Container>
				<div className={styles.inner}>
					<p className={styles.eyebrow}>{t("eyebrow")}</p>
					<h1 className={styles.title}>{t(`manage.${copy}.title`)}</h1>
					<p className={styles.description}>
						{t(status === "done" ? `manage.${copy}.done` : `manage.${copy}.description`)}
					</p>

					{copy !== "invalid" && status !== "done" && (
						<Button
							size="large"
							disabled={status === "loading"}
							onClick={submit}
							className={styles.action}
						>
							{status === "loading" ? t("loading") : t(`manage.${copy}.button`)}
						</Button>
					)}

					{status === "error" && (
						<Alert
							variant="filled"
							severity="error"
							onClose={() => setStatus("idle")}
							className={styles.alert}
						>
							{t("error")}
						</Alert>
					)}

					<Link href={RouteEnum.HOME} className={styles.back}>
						{t("manage.backHome")}
					</Link>
				</div>
			</Container>
		</section>
	);
};
