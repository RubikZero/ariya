import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";
import worker from "../src/index";

const SCHEMA = `CREATE TABLE IF NOT EXISTS mod_errors (hash TEXT PRIMARY KEY, mod_id TEXT NOT NULL, mod_version TEXT NOT NULL, game_version TEXT, error_message TEXT NOT NULL, stack_trace TEXT NOT NULL, game_state TEXT NOT NULL, player_os TEXT NOT NULL, os_version TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`;
const USER_SCHEMA = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, nickname TEXT NOT NULL DEFAULT '', password_hash TEXT, role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')), auth_method TEXT NOT NULL DEFAULT 'password' CHECK(auth_method IN ('password','zero-trust')), email TEXT, last_active_at DATETIME, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`;
const INVITE_SCHEMA = `CREATE TABLE IF NOT EXISTS invite_codes (code TEXT PRIMARY KEY, created_by TEXT NOT NULL, used_by TEXT, expires_at DATETIME NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`;

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
		await (env as any).DB.exec(USER_SCHEMA);
		await (env as any).DB.exec(INVITE_SCHEMA);
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

	it("admin auth flow: register, login, access dashboard, query logs", async () => {
		// Register (no credentials → 400)
		const r1 = await worker.fetch(new IncomingRequest("http://example.com/admin/register-admin", { method:"POST", body:"{}", headers:{"Content-Type":"application/json"} }), env, createExecutionContext());
		expect(r1.status).toBe(400);

		// Register (first admin → 200)
		const r2 = await worker.fetch(new IncomingRequest("http://example.com/admin/register-admin", { method:"POST", body:JSON.stringify({username:"testadmin",password:"testpass123"}), headers:{"Content-Type":"application/json"} }), env, createExecutionContext());
		expect(r2.status).toBe(200);
		expect(await r2.json()).toHaveProperty("success", true);

		// Register (second admin → 403)
		const r3 = await worker.fetch(new IncomingRequest("http://example.com/admin/register-admin", { method:"POST", body:JSON.stringify({username:"admin2",password:"pass123456"}), headers:{"Content-Type":"application/json"} }), env, createExecutionContext());
		expect(r3.status).toBe(403);

		// Login (wrong password → 401)
		const r4 = await worker.fetch(new IncomingRequest("http://example.com/admin/login", { method:"POST", body:JSON.stringify({username:"testadmin",password:"wrongpass"}), headers:{"Content-Type":"application/json"} }), env, createExecutionContext());
		expect(r4.status).toBe(401);

		// Login (correct password → 200 + token)
		const r5 = await worker.fetch(new IncomingRequest("http://example.com/admin/login", { method:"POST", body:JSON.stringify({username:"testadmin",password:"testpass123"}), headers:{"Content-Type":"application/json"} }), env, createExecutionContext());
		expect(r5.status).toBe(200);
		const loginJson = await r5.json() as any;
		expect(loginJson.success).toBe(true);
		expect(loginJson.token).toBeDefined();
		const token = loginJson.token;

		// Admin page (no token → login page)
		const r6 = await worker.fetch(new IncomingRequest("http://example.com/admin"), env, createExecutionContext());
		expect(r6.status).toBe(200);
		expect(await r6.text()).toContain("管理员登录");

		// Admin page (with token → dashboard)
		const r7 = await worker.fetch(new IncomingRequest("http://example.com/admin?token=" + encodeURIComponent(token)), env, createExecutionContext());
		expect(r7.status).toBe(200);
		expect(await r7.text()).toContain("生成 HMAC 密钥");

		// Logs (no token → 401)
		const r8 = await worker.fetch(new IncomingRequest("http://example.com/admin/logs"), env, createExecutionContext());
		expect(r8.status).toBe(401);

		// Submit a log
		await sendValid(hmacKey, payload);

		// Logs (with token → 200)
		const r9 = await worker.fetch(new IncomingRequest("http://example.com/admin/logs?token=" + encodeURIComponent(token)), env, createExecutionContext());
		expect(r9.status).toBe(200);
		const logsJson = await r9.json() as any;
		expect(logsJson.logs).toBeDefined();
		expect(logsJson.logs.length).toBeGreaterThan(0);

		// Browse data endpoint (Tabulator remote pagination format)
		const r10 = await worker.fetch(new IncomingRequest("http://example.com/admin/browse?token=" + encodeURIComponent(token) + "&_ajax=1&page=1&size=10&sort%5B0%5D%5Bfield%5D=time&sort%5B0%5D%5Bdir%5D=desc"), env, createExecutionContext());
		expect(r10.status).toBe(200);
		expect(r10.headers.get("content-type")).toContain("application/json");
		const browseData = await r10.json() as any;
		// Tabulator remote pagination expects: { data: [], total: N, last_page: N }
		expect(browseData).toHaveProperty("data");
		expect(Array.isArray(browseData.data)).toBe(true);
		expect(browseData.data.length).toBeGreaterThan(0);
		expect(typeof browseData.total).toBe("number");
		expect(browseData.total).toBeGreaterThan(0);
		expect(typeof browseData.last_page).toBe("number");
		expect(browseData.last_page).toBeGreaterThan(0);
		expect(browseData.data[0]).toHaveProperty("id");
		expect(browseData.data[0]).toHaveProperty("time");
	});
});
