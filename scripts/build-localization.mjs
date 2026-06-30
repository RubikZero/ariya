#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SRC_DIR = process.argv[2];

if (!SRC_DIR) {
	console.error("Usage: npm run build:localization -- <path-to-localization-dir>");
	console.error('Example: npm run build:localization -- "E:\\GodotWorkspace\\sts2-localization\\localization"');
	process.exit(1);
}

if (!existsSync(SRC_DIR)) {
	console.error(`Source directory not found: ${SRC_DIR}`);
	process.exit(1);
}

// Language code mapping: Ariya locale -> game localization folder
const LANG_MAP = {
	"en": "eng",
	"zh-CN": "zhs",
	"de": "deu",
	"es": "esp",
	"fr": "fra",
	"it": "ita",
	"ja": "jpn",
	"ko": "kor",
	"pl": "pol",
	"pt-BR": "ptb",
	"ru": "rus",
	"es-419": "spa",
	"th": "tha",
	"tr": "tur",
};

// BBCode tags to strip: [tag]...[/tag] and [tag=value]
const BBCODE_REGEX = /\[\/?(?:b|i|color=[^\]]+|gold|purple|red|green|blue|orange|pink|jitter|sine|shake|font_size=\d+|thinky_dots)\]/g;

function stripBbcode(text) {
	return text.replace(BBCODE_REGEX, "").replace(/\[\/?(?:[a-z_]+(?:=[^\]]+)?)\]/g, "").trim();
}

function loadJson(langFolder, filename) {
	const path = join(SRC_DIR, langFolder, filename);
	if (!existsSync(path)) return {};
	return JSON.parse(readFileSync(path, "utf-8"));
}

function extractTitles(obj, suffix = ".title") {
	const result = {};
	for (const [key, value] of Object.entries(obj)) {
		if (key.endsWith(suffix)) {
			const id = key.slice(0, -suffix.length);
			result[id] = stripBbcode(value);
		}
	}
	return result;
}

// Scene/room type mapping: C# class name -> static_hover_tips key
const SCENE_MAP = {
	"CombatRoom": "ROOM_ENEMY",
	"EventRoom": "ROOM_EVENT",
	"MerchantRoom": "ROOM_MERCHANT",
	"RestSiteRoom": "ROOM_REST",
	"TreasureRoom": "ROOM_TREASURE",
	"MapRoom": "ROOM_MAP",
};

function buildLangData(langCode, langFolder) {
	const data = {};

	// acts -> acts.json .title
	data.acts = extractTitles(loadJson(langFolder, "acts.json"));

	// game_modes -> game_modes.json .title
	data.game_modes = extractTitles(loadJson(langFolder, "game_modes.json"));

	// events -> events.json .title (only top-level event IDs, no nested keys)
	const events = loadJson(langFolder, "events.json");
	data.events = {};
	for (const [key, value] of Object.entries(events)) {
		if (key.endsWith(".title")) {
			const id = key.slice(0, -".title".length);
			// Event IDs are uppercase snake_case without dots (e.g. ABYSSAL_BATHS)
			// Skip nested keys like CRYSTAL_SPHERE.minigame.instructions
			if (/^[A-Z][A-Z0-9_]*$/.test(id)) {
				data.events[id] = stripBbcode(value);
			}
		}
	}

	// characters -> characters.json .title
	data.characters = extractTitles(loadJson(langFolder, "characters.json"));

	// encounters -> encounters.json .title
	data.encounters = extractTitles(loadJson(langFolder, "encounters.json"));

	// monsters -> monsters.json .name
	data.monsters = extractTitles(loadJson(langFolder, "monsters.json"), ".name");

	// scenes -> static_hover_tips.json ROOM_*.title (manually mapped)
	const tips = loadJson(langFolder, "static_hover_tips.json");
	data.scenes = {};
	for (const [sceneKey, locKey] of Object.entries(SCENE_MAP)) {
		const fullKey = locKey + ".title";
		if (tips[fullKey]) {
			data.scenes[sceneKey] = stripBbcode(tips[fullKey]);
		}
	}

	return data;
}

console.log("Building game state translations...");
console.log(`  Source: ${SRC_DIR}`);

const output = {};
for (const [locale, folder] of Object.entries(LANG_MAP)) {
	console.log(`  Processing ${locale} (${folder}/)...`);
	output[locale] = buildLangData(locale, folder);

	const counts = Object.entries(output[locale])
		.map(([cat, items]) => `${cat}: ${Object.keys(items).length}`)
		.join(", ");
	console.log(`    ${counts}`);
}

const outDir = join(ROOT, "frontend", "src", "i18n", "game-state");
let totalBytes = 0;
for (const [locale, data] of Object.entries(output)) {
	const outPath = join(outDir, `${locale}.json`);
	writeFileSync(outPath, JSON.stringify(data, null, "\t") + "\n");
	totalBytes += readFileSync(outPath).length;
}
const totalKb = (totalBytes / 1024).toFixed(1);
console.log(`\nDone! Written ${Object.keys(LANG_MAP).length} files to ${outDir} (${totalKb} KB total)`);
