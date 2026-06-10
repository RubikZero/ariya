import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../src/index";

const SCHEMA = `CREATE TABLE IF NOT EXISTS mod_errors (hash TEXT PRIMARY KEY, mod_id TEXT NOT NULL, mod_version TEXT NOT NULL, game_version TEXT, error_message TEXT NOT NULL, stack_trace TEXT NOT NULL, game_state TEXT NOT NULL, player_os TEXT NOT NULL, os_version TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`;

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

async function hmacSign(key: string, data: string): Promise<string> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(key);
	const cryptoKey = await crypto.subtle.importKey(
		"raw", keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false, ["sign"]
	);
	const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
	return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function sendValid(key: string, payload: object) {
	const body = JSON.stringify(payload);
	const signature = await hmacSign(key, body);
	return SELF.fetch("https://example.com", {
		method: "POST",
		body,
		headers: {
			"Content-Type": "application/json",
			"X-Mod-Signature": signature,
		},
	});
}

describe("Ariya log endpoint", () => {
	let hmacKey: string;
	let payload: object;

	beforeAll(async () => {
		hmacKey = (env as any).HMAC_SECRET_KEY || "test-secret";
		await (env as any).DB.exec(SCHEMA);
		payload = {
			mod_id: "test-mod",
			mod_version: "1.0.0",
			game_version: "2.0",
			error_message: "Test error",
			stack_trace: "at Test.Method()",
			game_state: '{"game.scene":"CombatRoom"}',
			player_os: "Windows",
			os_version: "10.0",
			created_at: Date.now(),
		};
	});

	it("rejects GET requests with 405", async () => {
		const request = new IncomingRequest("http://example.com");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(405);
	});

	it("rejects POST without signature with 401", async () => {
		const response = await SELF.fetch("https://example.com", {
			method: "POST",
			body: JSON.stringify(payload),
			headers: { "Content-Type": "application/json" },
		});
		expect(response.status).toBe(401);
	});

	it("rejects POST with invalid signature with 403", async () => {
		const response = await SELF.fetch("https://example.com", {
			method: "POST",
			body: JSON.stringify(payload),
			headers: {
				"Content-Type": "application/json",
				"X-Mod-Signature": "aW52YWxpZA==",
			},
		});
		expect(response.status).toBe(403);
	});

	it("accepts POST with valid signature and returns count=1 on first occurrence, increments on duplicates", async () => {
		const r1 = await sendValid(hmacKey, payload);
		expect(r1.status).toBe(200);
		const j1 = await r1.json() as any;
		expect(j1.success).toBe(true);
		expect(j1.count).toBe(1);

		const r2 = await sendValid(hmacKey, payload);
		expect(r2.status).toBe(200);
		const j2 = await r2.json() as any;
		expect(j2.count).toBe(2);

		const r3 = await sendValid(hmacKey, payload);
		expect(r3.status).toBe(200);
		const j3 = await r3.json() as any;
		expect(j3.count).toBe(3);
	});

	it("returns different hash for different error_message", async () => {
		const diffPayload = { ...payload, error_message: "Different error", created_at: Date.now() };
		const response = await sendValid(hmacKey, diffPayload);
		expect(response.status).toBe(200);
		const json = await response.json() as any;
		expect(json.count).toBe(1);
	});

	it("returns admin page on GET /admin", async () => {
		const request = new IncomingRequest("http://example.com/admin");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const text = await response.text();
		expect(text).toContain("Ariya");
		expect(text).toContain("admin");
	});
});
