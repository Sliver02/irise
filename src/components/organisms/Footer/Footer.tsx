import { RouteEnum } from "@/common/routeEnum";
import { Container } from "@/components/atoms/Grid";
import { Instagram } from "@/components/atoms/SocialIcons";
import classNames from "classnames";
import { Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";
import styles from "./Footer.module.scss";

interface Contact {
	name: string;
	links: { href: RouteEnum; label: string; icon: ReactNode }[];
}

const CONTACTS: Contact[] = [
	{
		name: "Sarah Maria Ursula Pompanin",
		links: [
			{ href: RouteEnum.SARAH_EMAIL, label: "smup.yoga@gmail.com", icon: <Mail size={16} /> },
			{ href: RouteEnum.SARAH_PHONE, label: "+39 366 145 0576", icon: <Phone size={16} /> },
			{ href: RouteEnum.SARAH_INSTAGRAM, label: "@smup_yoga", icon: <Instagram size={16} /> },
		],
	},
	{
		name: "Barbara “Dallo” Calligaro",
		links: [
			{
				href: RouteEnum.BARBARA_EMAIL,
				label: "barbara@example.com",
				icon: <Mail size={16} />,
			},
			{ href: RouteEnum.BARBARA_PHONE, label: "+39 000 000 0000", icon: <Phone size={16} /> },
			{
				href: RouteEnum.BARBARA_INSTAGRAM,
				label: "@barbaradallo",
				icon: <Instagram size={16} />,
			},
		],
	},
];

export const Footer = () => {
	const t = useTranslations("footer");

	return (
		<footer className={styles.footer}>
			<Container>
				<div className={styles.top}>
					<div>
						<p className={styles.wordmark}>Irise</p>
						<p className={styles.tagline}>{t("tagline")}</p>
						<a
							href={RouteEnum.IRISE_INSTAGRAM}
							className={classNames(styles.link, styles.social)}
							target="_blank"
							rel="noopener noreferrer"
						>
							<span className={styles.icon} aria-hidden>
								<Instagram size={16} />
							</span>
							@spazio_irise
						</a>
					</div>

					<div>
						<h2 className={styles.heading}>{t("contacts")}</h2>
						<div className={styles.people}>
							{CONTACTS.map(({ name, links }) => (
								<address key={name} className={styles.person}>
									<p className={styles.name}>{name}</p>
									<ul className={styles.list}>
										{links.map(({ href, label, icon }) => {
											const external = href.startsWith("http");
											return (
												<li key={href}>
													<a
														href={href}
														className={styles.link}
														target={external ? "_blank" : undefined}
														rel={
															external
																? "noopener noreferrer"
																: undefined
														}
													>
														<span className={styles.icon} aria-hidden>
															{icon}
														</span>
														{label}
													</a>
												</li>
											);
										})}
									</ul>
								</address>
							))}
						</div>
					</div>
				</div>

				<p className={styles.bottom}>
					<span>
						© {new Date().getFullYear()} Irise — {t("copyright")}
					</span>
					<span>
						{t("credits")}{" "}
						<a
							href="https://www.jacopopanzera.com/"
							target="_blank"
							rel="noopener noreferrer"
							className={styles.link}
						>
							Jacopo Panzera
						</a>
					</span>
				</p>
			</Container>
		</footer>
	);
};
