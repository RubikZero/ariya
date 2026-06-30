import type { SupportedLocale } from "../locale";

type TranslationData = {
	acts: Record<string, string>;
	game_modes: Record<string, string>;
	events: Record<string, string>;
	characters: Record<string, string>;
	encounters: Record<string, string>;
	monsters: Record<string, string>;
	scenes: Record<string, string>;
};

const cache = new Map<SupportedLocale, TranslationData>();

function detectInitialLocale(): SupportedLocale {
	const saved = localStorage.getItem("ariya_locale");
	const all = ["zh-CN","en","de","es","es-419","fr","it","ja","ko","pl","pt-BR","ru","th","tr"] as const;
	if (saved && (all as readonly string[]).includes(saved)) return saved as SupportedLocale;
	if (typeof navigator === "undefined") return "zh-CN";
	const lang = navigator.language || "";
	if (lang.startsWith("zh")) return "zh-CN";
	if ((all as readonly string[]).find((l) => lang.startsWith(l))) {
		const match = (all as readonly string[]).find((l) => lang.startsWith(l));
		if (match) return match as SupportedLocale;
	}
	return "en";
}

const initialLocale = detectInitialLocale();
Promise.all([
	import(`./game-state/${initialLocale}.json`),
	...(initialLocale !== "en" ? [import(`./game-state/en.json`)] : []),
]).then(([main, fallback]) => {
	cache.set(initialLocale, (main as any).default as TranslationData);
	if (fallback) cache.set("en", (fallback as any).default as TranslationData);
});

export async function ensureGameState(locale: SupportedLocale): Promise<void> {
	if (cache.has(locale)) return;
	const mod = await import(`./game-state/${locale}.json`);
	cache.set(locale, (mod as any).default as TranslationData);
}

const FIELD_MAP: Record<string, { category: keyof TranslationData; separator?: string }> = {
	"game.act_name": { category: "acts" },
	"game.mode": { category: "game_modes" },
	"game.event": { category: "events" },
	"game.scene": { category: "scenes" },
	"game.room_type": { category: "scenes" },
	"game.characters": { category: "characters", separator: ", " },
	"combat.encounter": { category: "encounters" },
	"combat.enemies": { category: "monsters", separator: ", " },
};

function translateValue(rawValue: string, category: keyof TranslationData, locale: SupportedLocale): string {
	const table = cache.get(locale)?.[category];
	if (!table) return rawValue;
	const translated = table[rawValue] ?? table[rawValue.replace(/^[A-Z_]+\./, "")];
	if (!translated || translated === rawValue) return rawValue;
	return `${rawValue} (${translated})`;
}

export function translateGameState(
	state: Record<string, unknown>,
	locale: SupportedLocale,
): Record<string, string> {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(state)) {
		const fieldDef = FIELD_MAP[key];
		const rawString = String(value);
		if (!fieldDef) {
			result[key] = rawString;
			continue;
		}
		if (fieldDef.separator) {
			const parts = rawString.split(fieldDef.separator).map((p) => p.trim());
			const translatedParts = parts.map((p) => translateValue(p, fieldDef.category, locale));
			result[key] = translatedParts.join(fieldDef.separator);
		} else {
			result[key] = translateValue(rawString, fieldDef.category, locale);
		}
	}
	return result;
}
