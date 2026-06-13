import type { Env } from "./index.js";
import { renderAdminPage, renderDetailPage } from "./admin-ui.js";

async function hmacSign(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	return new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
}

async function hmacVerify(keyBytes: Uint8Array, sig: Uint8Array, data: Uint8Array): Promise<boolean> {
	const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
	return crypto.subtle.verify("HMAC", key, sig, data);
}

export async function createSessionToken(username: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const expiry = Date.now() + 86400000;
	const payload = username + "|" + expiry;
	const sig = await hmacSign(encoder.encode(secret), encoder.encode(payload));
	const sigBase64 = btoa(String.fromCharCode(...sig));
	return btoa(username) + "." + btoa(String(expiry)) + "." + sigBase64;
}

export async function verifySessionToken(token: string, secret: string): Promise<string | null> {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;
		const username = atob(parts[0]);
		const expiry = parseInt(atob(parts[1]));
		if (Date.now() > expiry) return null;
		const payload = username + "|" + expiry;
		const encoder = new TextEncoder();
		const sigBytes = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
		const valid = await hmacVerify(encoder.encode(secret), sigBytes, encoder.encode(payload));
		return valid ? username : null;
	} catch { return null; }
}

export async function handleRegisterAdmin(env: Env, body: { username?: string; password?: string }): Promise<Response> {
	if (!body.username || !body.password) {
		return new Response(JSON.stringify({ error: "Missing username or password" }), { status: 400 });
	}
	if (body.username.length < 2 || body.password.length < 6) {
		return new Response(JSON.stringify({ error: "Username min 2 chars, password min 6 chars" }), { status: 400 });
	}
	const existing = await env.DB.prepare("SELECT COUNT(*) as count FROM admins").first<number>("count");
	if (existing && existing > 0) {
		return new Response(JSON.stringify({ error: "Admin already exists. Register disabled." }), { status: 403 });
	}
	const encoder = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
	const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(body.password + saltHex), "PBKDF2", false, ["deriveBits"]);
	const hashBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(saltHex), iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
	const hashHex = Array.from(new Uint8Array(hashBits)).map(b => b.toString(16).padStart(2, "0")).join("");
	await env.DB.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").bind(body.username, saltHex + ":" + hashHex).run();
	return new Response(JSON.stringify({ success: true, message: "Admin registered. You can now log in." }));
}

export async function handleLogin(env: Env, body: { username?: string; password?: string }): Promise<Response> {
	if (!body.username || !body.password) {
		return new Response(JSON.stringify({ error: "Missing username or password" }), { status: 400 });
	}
	const row = await env.DB.prepare("SELECT password_hash FROM admins WHERE username = ?").bind(body.username).first<{ password_hash: string }>("password_hash");
	if (!row) {
		return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
	}
	const [storedSalt, storedHash] = (row as any).toString().split(":");
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(body.password + storedSalt), "PBKDF2", false, ["deriveBits"]);
	const hashBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(storedSalt), iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
	const computedHash = Array.from(new Uint8Array(hashBits)).map(b => b.toString(16).padStart(2, "0")).join("");
	if (computedHash !== storedHash) {
		return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
	}
	const token = await createSessionToken(body.username, env.HMAC_SECRET_KEY);
	return new Response(JSON.stringify({ success: true, token }));
}

export async function handleAdminLogs(env: Env): Promise<Response> {
	try {
		const result = await env.DB.prepare("SELECT hash, mod_id, mod_version, error_message, count, created_at FROM mod_errors ORDER BY created_at DESC LIMIT 50").all();
		return new Response(JSON.stringify({ logs: result.results }), { headers: { "Content-Type": "application/json" } });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}

export async function handleLogDetail(env: Env, hash: string, token: string, lang: string = "zh-CN"): Promise<Response> {
	try {
		const log = await env.DB.prepare(
			"SELECT hash, mod_id, mod_version, game_version, error_message, stack_trace, game_state, player_os, os_version, count, created_at FROM mod_errors WHERE hash = ?"
		).bind(hash).first();
		if (!log) {
			return new Response("Not found", { status: 404 });
		}
		return new Response(renderDetailPage(log, token, "zh-CN"), {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		});
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}

export { renderAdminPage };
