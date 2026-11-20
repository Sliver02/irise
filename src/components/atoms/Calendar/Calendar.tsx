"use client";

import type { Locale } from "@/i18n/routing";
import classNames from "classnames";
import { useLocale } from "next-intl";
import { DayPicker, labelGridcell } from "react-day-picker";
import { enUS, it } from "react-day-picker/locale";
import styles from "./Calendar.module.scss";

const LOCALES = { it, en: enUS } satisfies Record<Locale, unknown>;

export interface CalendarProps {
	/** Day to highlight; its month is the one shown. */
	date: Date;
	/** Screen-reader suffix for the highlighted day, e.g. "opening day". */
	label: string;
	className?: string;
}

/** Read-only month view pointing at a single day. */
export const Calendar = ({ date, label, className }: CalendarProps) => (
	<DayPicker
		locale={LOCALES[useLocale() as Locale]}
		defaultMonth={date}
		// Pinned so server markup matches the client: server and browser can disagree
		// on today's date (time zones, cached HTML) and hydration would then mismatch.
		today={date}
		hideNavigation
		modifiers={{ highlight: date }}
		modifiersClassNames={{ highlight: styles.highlight }}
		labels={{
			// Drop the library's hard-coded English "Today, " (today is pinned above).
			labelGridcell: (day, modifiers, options, dateLib) => {
				const text = labelGridcell(day, { ...modifiers, today: false }, options, dateLib);
				return modifiers?.highlight ? `${text}, ${label}` : text;
			},
		}}
		classNames={{
			root: classNames(styles.root, className),
			month_caption: styles.caption,
			caption_label: styles.captionLabel,
			month_grid: styles.grid,
			weekday: styles.weekday,
			day: styles.day,
		}}
	/>
);
