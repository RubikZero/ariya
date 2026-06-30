export const LOCALES = ["zh-CN", "en", "de", "es", "es-419", "fr", "it", "ja", "ko", "pl", "pt-BR", "ru", "th", "tr"] as const;
export type SupportedLocale = (typeof LOCALES)[number];

export const LANG_LABELS: Record<SupportedLocale, string> = {
	"de": "Deutsch",
	"en": "English",
	"es": "Español (Europa)",
	"es-419": "Español (Latinoamérica)",
	"fr": "Français",
	"it": "Italiano",
	"ja": "日本語",
	"ko": "한국어",
	"pl": "Polski",
	"pt-BR": "Português (Brasil)",
	"ru": "Русский",
	"th": "ไทย",
	"tr": "Türkçe",
	"zh-CN": "中文",
};

const FALLBACK: SupportedLocale = "en";

function detectBrowserLang(): SupportedLocale {
	if (typeof navigator === "undefined") return "zh-CN";
	const lang = navigator.language || "";
	if (lang.startsWith("zh")) return "zh-CN";
	if (lang.startsWith("de")) return "de";
	if (lang.startsWith("fr")) return "fr";
	if (lang.startsWith("it")) return "it";
	if (lang.startsWith("ja")) return "ja";
	if (lang.startsWith("ko")) return "ko";
	if (lang.startsWith("pl")) return "pl";
	if (lang.startsWith("pt")) return "pt-BR";
	if (lang.startsWith("ru")) return "ru";
	if (lang === "es-419" || lang === "es-MX" || lang === "es-AR") return "es-419";
	if (lang.startsWith("es")) return "es";
	if (lang.startsWith("th")) return "th";
	if (lang.startsWith("tr")) return "tr";
	return "en";
}

const savedLang = localStorage.getItem("ariya_locale");
let currentLocale: SupportedLocale = savedLang && (LOCALES as readonly string[]).includes(savedLang)
	? savedLang as SupportedLocale
	: detectBrowserLang();
const listeners = new Set<() => void>();

const msgCache = new Map<SupportedLocale, Record<string, string>>();

async function loadMessages(locale: SupportedLocale) {
	if (msgCache.has(locale)) return;
	const mod = await import(`./i18n/ui/${locale}.json`);
	msgCache.set(locale, (mod as any).default as Record<string, string>);
}

// Preload current locale + fallback (en) on module init
Promise.all([
	loadMessages(FALLBACK),
	...(currentLocale !== FALLBACK ? [loadMessages(currentLocale)] : []),
]).then(() => {
	listeners.forEach((fn) => fn());
});

export function getLocale(): SupportedLocale {
	return currentLocale;
}

export function t(key: string): string {
	return msgCache.get(currentLocale)?.[key] ?? msgCache.get(FALLBACK)?.[key] ?? key;
}

export function setLocale(lang: string) {
	if ((LOCALES as readonly string[]).includes(lang)) {
		currentLocale = lang as SupportedLocale;
		loadMessages(currentLocale);
	}
	localStorage.setItem("ariya_locale", lang);
	listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
	listeners.add(fn);
	return () => { listeners.delete(fn); };
}

import { useState, useEffect } from "react";

export function useLocale() {
	const [, setTick] = useState(0);
	useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
	return { t, lang: currentLocale, setLocale };
}
