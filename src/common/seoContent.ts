// Project-specific SEO content. The handling lives in `@/common/seo` (identical across projects).
import { ADDRESS } from "@/common/constants";
import { RouteEnum } from "@/common/routeEnum";
import type { Page } from "@/common/seo";
import type { Locale } from "@/i18n/routing";

// Production domain (no trailing slash).
export const SITE_URL = "https://spazioirise.com";
export const SITE_NAME = "Irise";

/** `og:locale` value for each supported locale. */
export const OG_LOCALE: Record<Locale, string> = { en: "en_US", it: "it_IT" };

/** Routes that are real pages (anchors, mailto:, tel: and external URLs are excluded). */
export type PageRoute = RouteEnum.HOME;

// Every page route needs copy in every locale. TypeScript fails the build when one is missing.
// Titles ≤ ~50 chars (SITE_NAME is appended), descriptions ≤ ~160, images under 5 MB.
export const pages: Record<PageRoute, Page> = {
	[RouteEnum.HOME]: {
		image: "og.jpg",
		it: {
			title: "Irise | Yoga, pilates e meditazione",
			description:
				"Yoga, pilates, meditazione, trattamenti ayurveda e workshop a Pieve di Cadore, con Sarah Pompanin e Barbara Dall’Ò. Inaugurazione sabato 5 dicembre alle 16.",
		},
		en: {
			title: "Irise | Yoga, Pilates and meditation",
			description:
				"Yoga, Pilates, meditation, Ayurvedic treatments and workshops in Pieve di Cadore, with Sarah Pompanin and Barbara Dall’Ò. Opening Saturday 5 December, 4 pm.",
		},
	},
};

const address = {
	"@type": "PostalAddress",
	streetAddress: ADDRESS.street,
	postalCode: ADDRESS.postalCode,
	addressLocality: ADDRESS.city,
	addressRegion: ADDRESS.region,
	addressCountry: ADDRESS.country,
};

/** schema.org JSON-LD rendered in the root layout's <head>. Wrong data is worse than none. */
export const structuredData = (locale: string) => ({
	"@context": "https://schema.org",
	"@graph": [
		{
			"@type": "WebSite",
			name: SITE_NAME,
			url: `${SITE_URL}/${locale}`,
			inLanguage: locale,
		},
		{
			"@type": "LocalBusiness",
			name: SITE_NAME,
			url: SITE_URL,
			email: "info@spazioirise.com",
			address,
		},
		{
			"@type": "Event",
			name: locale === "it" ? "Inaugurazione di Irise" : "Irise opening day",
			startDate: "2026-12-05T16:00:00+01:00",
			eventStatus: "https://schema.org/EventScheduled",
			eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
			location: { "@type": "Place", name: SITE_NAME, address },
			organizer: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
		},
	],
});
