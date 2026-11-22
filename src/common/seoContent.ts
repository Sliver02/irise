// Project-specific SEO content. The handling lives in `@/common/seo` (identical across projects).
import { RouteEnum } from "@/common/routeEnum";
import type { Page } from "@/common/seo";
import type { Locale } from "@/i18n/routing";

// Production domain (no trailing slash).
export const SITE_URL = "https://spazioirise.com";
export const SITE_NAME = "Irise";

/** `og:locale` value for each supported locale. */
export const OG_LOCALE: Record<Locale, string> = { en: "en_US", it: "it_IT" };

/** Routes that are real pages (anchors, mailto:, tel: and external URLs are excluded). */
export type PageRoute = RouteEnum.HOME | RouteEnum.NEWSLETTER_PAGE;

// Every page route needs copy in every locale. TypeScript fails the build when one is missing.
// Titles ≤ ~50 chars (SITE_NAME is appended), descriptions ≤ ~160, images under 5 MB.
export const pages: Record<PageRoute, Page> = {
	[RouteEnum.HOME]: {
		image: "og.jpg",
		it: {
			title: "Irise | Yoga, massaggi e workshop",
			description:
				"Yoga, massaggi e workshop tutto l'anno in uno spazio sicuro e accogliente, con Sarah Pompanin e Barbara Calligaro. Inaugurazione sabato 5 dicembre.",
		},
		en: {
			title: "Irise | Yoga, massage and workshops",
			description:
				"Yoga, massage and workshops all year round in a safe, cosy space, with Sarah Pompanin and Barbara Calligaro. Opening day Saturday 5 December.",
		},
	},
	[RouteEnum.NEWSLETTER_PAGE]: {
		image: "og.jpg",
		noindex: true,
		it: {
			title: "Newsletter",
			description: "Conferma o annulla l'iscrizione alla newsletter di Irise.",
		},
		en: {
			title: "Newsletter",
			description: "Confirm or cancel your subscription to the Irise newsletter.",
		},
	},
};

/**
 * schema.org JSON-LD rendered in the root layout's <head>.
 * Generic `WebSite` until the address is confirmed — then switch to a `LocalBusiness`
 * subtype (and an `Event` for the opening). Wrong data is worse than none.
 */
export const structuredData = (locale: string) => ({
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: SITE_NAME,
	url: `${SITE_URL}/${locale}`,
	inLanguage: locale,
});
