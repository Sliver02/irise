import "@/designSystem/globals.scss";
import "lenis/dist/lenis.css";
import { rootMeta } from "@/common/seo";
import { structuredData } from "@/common/seoContent";
import { SmoothScroll } from "@/components/atoms/SmoothScroll";
import { Footer } from "@/components/organisms/Footer";
import { locales } from "@/i18n/routing";
import classNames from "classnames";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import localFont from "next/font/local";

// Amatic SC has capitals only: keep it to short titles.
const amatic = localFont({
	src: "../../fonts/AmaticSC-Bold.ttf",
	weight: "700",
	variable: "--font-amatic",
});

const nunito = localFont({
	src: [
		{ path: "../../fonts/NunitoSans-Regular.ttf", weight: "400" },
		{ path: "../../fonts/NunitoSans-SemiBold.ttf", weight: "600" },
		{ path: "../../fonts/NunitoSans-Bold.ttf", weight: "700" },
	],
	variable: "--font-nunito",
});

export const generateMetadata = rootMeta;

export function generateStaticParams() {
	return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	const messages = await getMessages();

	return (
		<html
			lang={locale}
			data-theme="light"
			className={classNames(nunito.variable, amatic.variable)}
		>
			<head>
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(locale)) }}
				/>
			</head>
			<body>
				<NextIntlClientProvider messages={messages}>
					{/* anchors: in-page links (#newsletter, #inauguration) glide via Lenis. */}
					<SmoothScroll options={{ anchors: true }}>
						<main>{children}</main>
						<Footer />
					</SmoothScroll>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
