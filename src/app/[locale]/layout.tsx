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
import { Cormorant_Garamond, Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const cormorant = Cormorant_Garamond({
	subsets: ["latin"],
	weight: ["400", "500"],
	style: ["normal", "italic"],
	variable: "--font-cormorant",
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
			className={classNames(inter.variable, cormorant.variable)}
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
