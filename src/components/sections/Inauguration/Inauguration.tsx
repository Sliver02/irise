import { ADDRESS, INAUGURATION } from "@/common/constants";
import { RouteEnum } from "@/common/routeEnum";
import { Calendar } from "@/components/atoms/Calendar";
import { Card } from "@/components/atoms/Card";
import { FadeIn } from "@/components/atoms/FadeIn";
import { Container } from "@/components/atoms/Grid";
import { Clock, MapPin } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import styles from "./Inauguration.module.scss";

export const Inauguration = () => {
	const t = useTranslations("inauguration");
	const format = useFormatter();
	const date = format.dateTime(INAUGURATION, { weekday: "long", day: "numeric", month: "long" });

	return (
		<section id="inauguration" className={styles.inauguration}>
			<Container>
				<div className={styles.inner}>
					<p className={styles.eyebrow}>{t("eyebrow")}</p>
					<h2 className={styles.title}>{t("title", { date })}</h2>
					<p className={styles.body}>{t("body")}</p>

					<div className={styles.details}>
						<span className={styles.detail}>
							<Clock size={18} aria-hidden />
							{t("time")}
						</span>
						<a
							href={RouteEnum.MAP}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.detail}
						>
							<MapPin size={18} aria-hidden />
							{ADDRESS.street}, {ADDRESS.city}
						</a>
					</div>

					<FadeIn className={styles.reveal}>
						<Card surface="flat" className={styles.card}>
							<Calendar date={INAUGURATION} label={t("dayLabel")} />
						</Card>
					</FadeIn>
				</div>
			</Container>
		</section>
	);
};
