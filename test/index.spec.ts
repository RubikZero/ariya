import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../src/index";

const SCHEMA = `CREATE TABLE IF NOT EXISTS mod_errors (uuid TEXT PRIMARY KEY, mod_id TEXT NOT NULL, mod_version TEXT NOT NULL, game_version TEXT, error_message TEXT NOT NULL, stack_trace TEXT NOT NULL, game_state TEXT NOT NULL, player_os TEXT NOT NULL, os_version TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`;

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

async function hmacSign(key: string, data: string): Promise<string> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(key);
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"]
	);
	const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
	return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// These tests use the .dev.vars HMAC_SECRET_KEY
describe("Ariya log endpoint", () => {
	let hmacKey: string;
	let validPayload: object;

	beforeAll(async () => {
		hmacKey = (env as any).HMAC_SECRET_KEY || "test-secret";
		await (env as any).DB.exec(SCHEMA);
		validPayload = {
			uuid: crypto.randomUUID(),
			mod_id: "test-mod",
			mod_version: "1.0.0",
			game_version: "2.0",
			error_message: "Test error",
			stack_trace: "at Test.Method()",
			game_state: "InGame",
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
			body: JSON.stringify(validPayload),
			headers: { "Content-Type": "application/json" },
		});
		expect(response.status).toBe(401);
	});

	it("rejects POST with invalid signature with 403", async () => {
		const response = await SELF.fetch("https://example.com", {
			method: "POST",
			body: JSON.stringify(validPayload),
			headers: {
				"Content-Type": "application/json",
				"X-Mod-Signature": "aW52YWxpZA==",
			},
		});
		expect(response.status).toBe(403);
	});

	it("accepts POST with valid signature (unit style)", async () => {
		const body = JSON.stringify(validPayload);
		const signature = await hmacSign(hmacKey, body);
		const request = new IncomingRequest("http://example.com", {
			method: "POST",
			body,
			headers: {
				"Content-Type": "application/json",
				"X-Mod-Signature": signature,
			},
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		const json = await response.json();
		expect(json).toEqual({ success: true });
	});

	it("accepts POST with valid signature (integration style)", async () => {
		const body = JSON.stringify(validPayload);
		const signature = await hmacSign(hmacKey, body);
		const response = await SELF.fetch("https://example.com", {
			method: "POST",
			body,
			headers: {
				"Content-Type": "application/json",
				"X-Mod-Signature": signature,
			},
		});
		expect(response.status).toBe(200);
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
