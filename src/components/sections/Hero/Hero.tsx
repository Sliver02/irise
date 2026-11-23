import { INAUGURATION } from "@/common/constants";
import { RouteEnum } from "@/common/routeEnum";
import { Button } from "@/components/atoms/Button";
import { Container } from "@/components/atoms/Grid";
import { Link, locales } from "@/i18n/routing";
import heroImage from "@public/images/hero.jpg";
import { CalendarHeart } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import styles from "./Hero.module.scss";

export const Hero = () => {
	const t = useTranslations("hero");
	const format = useFormatter();
	const current = useLocale();

	return (
		<section className={styles.hero}>
			<div className={styles.photo}>
				<Image
					className={styles.image}
					src={heroImage}
					alt={t("imageAlt")}
					placeholder="blur"
					priority
					fill
					sizes="(min-width: 1024px) 60vw, (min-width: 768px) 50vw, 100vw"
				/>
			</div>

			<div className={styles.topBar}>
				<a href={RouteEnum.INAUGURATION} className={styles.chip}>
					<CalendarHeart size={16} aria-hidden />
					{t("date", {
						date: format.dateTime(INAUGURATION, { day: "numeric", month: "long" }),
					})}
				</a>

				<nav aria-label={t("language")} className={styles.chip}>
					{locales.map((locale) => (
						<Link
							key={locale}
							href={RouteEnum.HOME}
							locale={locale}
							lang={locale}
							aria-current={locale === current ? "page" : undefined}
							className={styles.language}
						>
							{locale.toUpperCase()}
						</Link>
					))}
				</nav>
			</div>

			<Container className={styles.content}>
				<div className={styles.body}>
					{/* The logo is painted by a CSS mask; the text stays for screen readers. */}
					<h1 className={styles.logo}>Irise</h1>
					<p className={styles.eyebrow}>{t("eyebrow")}</p>
					<p className={styles.lead}>{t("lead")}</p>
					<p className={styles.subtitle}>{t("subtitle")}</p>
					<Button
						size="large"
						nativeButton={false}
						render={<a href={RouteEnum.NEWSLETTER} />}
						className={styles.cta}
					>
						{t("cta")}
					</Button>
				</div>
			</Container>
		</section>
	);
};
