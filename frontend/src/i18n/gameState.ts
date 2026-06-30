import translations from "./game-state.json";

type Locale = "en" | "zh-CN";

type TranslationData = {
	acts: Record<string, string>;
	game_modes: Record<string, string>;
	events: Record<string, string>;
	characters: Record<string, string>;
	encounters: Record<string, string>;
	monsters: Record<string, string>;
	scenes: Record<string, string>;
};

const data = translations as Record<Locale, TranslationData>;

// Maps game_state field names to translation categories and value separators
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

function translateValue(rawValue: string, category: keyof TranslationData, locale: Locale): string {
	const table = data[locale]?.[category];
	if (!table) return rawValue;
	// Try direct match first, then try stripping prefix (e.g. ACT.HIVE -> HIVE, MONSTER.EXOSKELETON -> EXOSKELETON)
	const translated = table[rawValue] ?? table[rawValue.replace(/^[A-Z_]+\./, "")];
	if (!translated || translated === rawValue) return rawValue;
	return `${rawValue} (${translated})`;
}

export function translateGameState(
	state: Record<string, unknown>,
	locale: Locale,
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
