# Architecture

This document is the canonical rulebook for `nextjs-simple-template` and every project
built on it — read it before adding or changing code.

## Design system — two-layer tokens

Tokens live in `src/designSystem/globals.scss` and follow a strict two-layer rule:

**Layer 1 — palette primitives** (raw values, never used in components directly):

```css
--palette-neutral-0: #ffffff;
--palette-primary-500: #0070f3;
```

**Layer 2 — semantic tokens** (the only layer components touch):

```css
--color-text: var(--palette-neutral-900);
--color-primary: var(--palette-primary-500);
--color-bg: var(--palette-neutral-0);
```

Dark mode remaps Layer 2 via `[data-theme="dark"]` on `<html>` — Layer 1 never changes. No `prefers-color-scheme` media query; the theme attribute is set explicitly.

Typography tokens (`--font-body`, `--font-heading`) default to `system-ui`. Override them in `globals.scss` to wire in custom fonts.

## SCSS modules

Every component owns `ComponentName.tsx` + `ComponentName.module.scss` + a named-export `index.ts` barrel. Global design system files are imported via relative paths — `sassOptions.includePaths` is a [known unresolved bug](https://github.com/vercel/next.js/issues/60088) in Turbopack (Next.js 16's default bundler):

```scss
// atoms/Grid/Col/Col.module.scss — 4 levels from src/
@use "../../../../designSystem/variables";
@use "../../../../designSystem/mediaQueries" as mq;

// organisms/Header/Header.module.scss — 3 levels from src/
@use "../../../designSystem/mediaQueries" as mq;
```

Files within `src/designSystem/` import each other by bare name (Sass resolves them relative to the file's own directory):

```scss
// designSystem/globals.scss
@use "variables";
@use "mediaQueries";
```

Utility mixins:

- `@include mq.media("md")` — `min-width` breakpoint guard (`xs sm md lg xl xxl`)
- `@include utils.toRem(font-size, variables.$font-lg)` — px → rem conversion

Global text utility classes (applied as plain class strings, not module refs):

- `.text--h-xl`, `.text--p-lg`, `.text--align-center`, `.text--strong`, etc.
- `.onlyMobile` / `.onlyDesktop` — responsive show/hide at `md` breakpoint

### Conventions

**No bare tag selectors in `*.module.scss`.** Global tag defaults (`h1–h4`, `p`, `a`) are set once in `globals.scss` / `text.scss`. Component stylesheets must never override them via tag selectors — add an explicit class to the element instead:

```scss
// wrong
.card a {
	color: red;
}

// correct
.link {
	color: red;
}
```

**Consume design system values via `@use`, not inline literals.** Before writing a custom `font-size`, `color`, or breakpoint, check whether a DS variable, mixin, or utility class already covers it:

```scss
@use "../../../designSystem/utils";
@use "../../../designSystem/variables";

.title {
	@include utils.toRem(font-size, variables.$font-h-sm); // not font-size: 2rem
}
```

For colors, always reference semantic tokens (`var(--color-text)`, `var(--color-primary)`) — never palette primitives (`var(--palette-neutral-900)`) or raw hex values.

**Compose class names with `classnames`** — never template literals.

**Reuse the `Card` atom instead of hand-rolling a card.** Before adding a raised-surface `<div>` with its own padding/radius/shadow, check `atoms/Card`. Wrap it and pass a `className` for project-specific overrides (radius, shadow, background token) — don't recreate the scaffolding (flex layout, base padding, border) the atom already provides.

## Atomic design

```
atoms/       — no dependencies on other components
molecules/   — composed of atoms only
organisms/   — composed of atoms + molecules
templates/   — page-level layout shells (no data)
app/[locale] — data-fetching pages assembled from templates/organisms
```

Barrel re-exports enforce import hygiene:

```ts
// correct
import { Button } from "@/components/atoms/Button";

// wrong — import from the module file directly
import Button from "@/components/atoms/Button/Button";
```

## Base-UI primitives

Accessible headless primitives from `@base-ui/react` are wrapped in thin adapter components (Button, Input, Checkbox, Select, Autocomplete, Dropdown). State is styled exclusively via `data-[state]` attributes in SCSS — no JS class toggling:

```scss
// Button
&[data-disabled] {
	opacity: 0.4;
}

// Checkbox
&[data-checked] .indicator {
	opacity: 1;
}

// Select
&[data-popup-open] .arrow {
	transform: rotate(180deg);
}
```

## Icons

Icons come from `lucide-react` only. Do not add `react-icons`, `@mui/icons-material`, or any other icon library. Brand and social logos (Instagram, …) are not part of lucide-react — add them as inline-SVG components under `atoms/`.

## Internal navigation — RouteEnum

All internal link targets are centralized in `src/common/routeEnum.ts` (`RouteEnum`), including hash anchors (`/#contact`). Never hardcode path strings in components — import `RouteEnum` and navigate with `Link` from `@/i18n/routing`.

`RouteEnum` may also hold non-page targets (`mailto:`, external URLs, `#anchors`). Exclude those from `PageRoute` in `seoContent.ts` so they never get metadata or a sitemap entry.

## i18n routing

`next-intl` v4 is wired via `src/proxy.ts` (not `middleware.ts` — Next.js 16 reserves that name). The proxy skips static assets, API routes, and files with extensions.

Route structure: `app/[locale]/…` with `generateStaticParams` emitting one entry per locale.

Navigation helpers from `@/i18n/routing` are locale-aware wrappers around Next.js primitives:

- `Link` — locale-prefixed `<a>`
- `usePathname` — path without locale prefix
- `redirect`, `useRouter`, `getPathname`

Switching locale:

```tsx
<Link href={pathname} locale="it">
	IT
</Link>
```

Messages load from `public/messages/{locale}.json` at request time via `src/i18n/request.ts`.

## SEO — metadata, sitemap, robots

SEO handling is **standardized across every project built on this template**. Only the
content differs between projects; the code that turns content into metadata never does.

| File                                  | Identical in every project?  | Role                                                                                      |
| ------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| `src/common/seo.ts`                   | yes — never edit per project | `pageMetadata`, `pageMeta`, `rootMeta`, `pageUrl`, `localeUrls`, `indexableRoutes`        |
| `src/app/sitemap.ts`, `robots.ts`     | yes                          | Generated from `pages` × locales; robots points at the sitemap                            |
| `src/app/[locale]/<route>/layout.tsx` | same shape                   | One line: `export const generateMetadata = pageMeta(RouteEnum.X)`                         |
| `src/common/seoContent.ts`            | **no — project content**     | `SITE_URL`, `SITE_NAME`, `OG_LOCALE`, `PageRoute`, `pages` (all copy), `structuredData()` |

`seoContent.ts` holds a `Record<PageRoute, Page>`: for every route, a title + description
per locale (optional `og` / `twitter` overrides), one OG image (a file in `public/images`),
and an optional `noindex`. TypeScript fails the build when a route or a locale has no copy.

Wiring:

- Root `[locale]/layout.tsx`: `export const generateMetadata = rootMeta;` plus a
  `<script type="application/ld+json">` in `<head>` rendering `structuredData(locale)`.
  `rootMeta` uses the `HOME` entry and adds the `%s | SITE_NAME` title template.
- Every other route gets a `layout.tsx` that only exports `generateMetadata` and renders
  `children`. A layout works for `"use client"` pages too, which cannot export metadata.

Rules the handling enforces (do not work around them):

- URLs have **no trailing slash**: Next 308-redirects `/x/` to `/x`, so a canonical with a
  slash would point at a redirect. Always build URLs with `pageUrl()`.
- Canonical, hreflang alternates and sitemap entries are the same URLs. `x-default` is the
  default locale's URL.
- The sitemap is generated from `pages`, minus `noindex` routes. Never hand-write
  `public/sitemap.xml` or `public/robots.txt` — they would conflict with the route handlers.
- Never hard-code `canonical` or `<link rel="alternate">` in a layout: a parent's canonical
  is inherited by every child that does not override it, so it would point every page at
  the homepage.
- Copy limits: title ≤ ~50 chars (`SITE_NAME` is appended), description ≤ ~160, OG image
  1200×630 and under 5 MB (X rejects larger).
- `structuredData()` only carries confirmed facts. Wrong data is worse than none.

Adding a page:

1. Add the `RouteEnum` entry (see `src/common/routeEnum.ts`).
2. Add its `pages` entry in `seoContent.ts`, in every locale.
3. Add the route's `layout.tsx` with `pageMeta(RouteEnum.X)`.

It joins the sitemap automatically. Adding a locale: add its copy to every `pages` entry and
its `og:locale` to `OG_LOCALE`.

Starting a project from the template: set `SITE_URL` and `SITE_NAME`, add the OG image,
replace the placeholder copy, and adapt `structuredData()` (e.g. a `LocalBusiness` subtype).

Improving the handling: change `seo.ts`, `sitemap.ts` and `robots.ts` in
`nextjs-simple-template` first, then copy them verbatim into each project so they stay
byte-identical.

## Grid system

12-column fluid grid with a `--max-width: 1440px` container cap.

Classes generated at build time for each breakpoint × each prop:

- `.md-6` → `grid-column: span 6` at `md+`
- `.mdOffset-2` → `grid-column-start: 3` at `md+`
- `.mdOrder-1` → `order: 1` at `md+`
- `.mdAlignSelf-flex-start` → `align-self: flex-start` at `md+`

`Row` passes `gap` as an inline CSS variable; `Col` reads it. This keeps gap values dynamic without generating a combinatorial class matrix.

## Images — blur-up placeholders

Photography uses Next.js `<Image placeholder="blur">`. **Always import the image** — Next then generates the blur data at build time. There is nothing to maintain by hand:

```tsx
import heroImage from "@public/images/hero.jpg";

<Image src={heroImage} placeholder="blur" fill />;
```

Components that render photography therefore take `StaticImageData`, not a path string, and the call site owns the import. The `@public/*` alias keeps those imports readable.

A component that paints a plain CSS background instead of using `next/image` can layer both URLs off the same import — the placeholder sits underneath:

```tsx
style={{ backgroundImage: `url(${image.src}), url(${image.blurDataURL})` }}
```

**Never pass a path to `blurDataURL`.** It must be a `data:` URI. A path such as `/images/foo_placeholder.jpg` appears to work under `next dev` but renders nothing in a production build: `next/image` wraps the value in an SVG data URI, and an SVG loaded as an image cannot fetch external resources. Static imports avoid the problem entirely, and also give Next the blur dimensions it needs to set the placeholder's `viewBox` so the blur matches the image's aspect ratio.

Static imports supply intrinsic `width`/`height` too. Pass explicit values only to force a different box than the source aspect ratio (e.g. cropping mixed sources to one ratio with `object-fit: cover`).

Images referenced from `openGraph` metadata stay plain absolute URL strings — those are consumed by external crawlers, not by `next/image`.

## Newsletter flow

The mailing list is a Google Sheet owned by smup.yoga@gmail.com. A Google Apps Script bound to
that sheet ([apps-script/newsletter.gs](apps-script/newsletter.gs)) is the only backend: it stores
subscribers and sends every email from that Gmail account. Setup and sending steps are at the top
of that file.

```
Newsletter form (react-hook-form + zod)
  → callNewsletter({ action: "subscribe", email, locale, consent })  POST to NEXT_PUBLIC_NEWSLETTER_URL
  → script: row "pending" + confirmation email with /{locale}/newsletter?action=confirm&token=…
/newsletter page (NewsletterManage) — the subscriber clicks the button
  → callNewsletter({ action: "confirm" | "unsubscribe", token })
  → script: row "confirmed" + notification to smup.yoga@gmail.com, or row "unsubscribed"
Sheet menu Newsletter > Invia bozza
  → sends the "[Newsletter] …" Gmail draft to each confirmed row, with its own unsubscribe link
```

This gives double opt-in, a stored record of consent (text, date, confirmation date) and a
one-click unsubscribe link in every newsletter. The `/newsletter` page waits for a click, because
mail scanners open links in advance. The page is `noindex`.

## Header scroll behaviour

`useScroll` (passive event listener) returns `{ scrollY, direction: "up"|"down"|null }`.

The Header applies `.hidden` (CSS `transform: translateY(-100%)`) when `direction === "down" && scrollY > 80`. Re-appearing on scroll up is automatic since the class is removed. The transition is CSS-only — no JS animation.

## File naming convention

| File                        | Purpose                  |
| --------------------------- | ------------------------ |
| `ComponentName.tsx`         | Component implementation |
| `ComponentName.module.scss` | Scoped styles            |
| `index.ts`                  | Named barrel export      |

Never use default exports from barrel files. Always use named exports:

```ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
```
