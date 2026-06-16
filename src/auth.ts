import type { Env } from "./index.js";

export interface AuthUser {
	username: string;
	role: "admin" | "member";
	method: "password" | "zero-trust";
}

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

async function verifySessionToken(token: string, secret: string): Promise<string | null> {
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

function getCookie(request: Request, name: string): string | null {
	const cookie = request.headers.get("Cookie");
	if (!cookie) return null;
	for (const part of cookie.split(";")) {
		const [key, ...rest] = part.trim().split("=");
		if (key === name) return decodeURIComponent(rest.join("="));
	}
	return null;
}

export async function getAuthUser(request: Request, env: Env, token: string): Promise<AuthUser | null> {
	// 0. Fallback to cookie if no URL token
	if (!token) {
		const cookieToken = getCookie(request, "ariya_token");
		if (cookieToken) token = cookieToken;
	}

	// 1. Cf-Access header
	const cfEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
	if (cfEmail) {
		const user = await env.DB.prepare("SELECT username, role, auth_method FROM users WHERE email = ?").bind(cfEmail).first<{ username: string; role: string; auth_method: string }>();
		if (user) {
			await env.DB.prepare("UPDATE users SET last_active_at = datetime('now') WHERE email = ?").bind(cfEmail).run();
			return { username: user.username, role: user.role as "admin" | "member", method: "zero-trust" };
		}
		return null;
	}

	// 2. ADMIN_KEY env var (deprecated, kept for compatibility)
	if (env.ADMIN_KEY && token.length === env.ADMIN_KEY.length) {
		let r = 0;
		for (let i = 0; i < token.length; i++) r |= token.charCodeAt(i) ^ env.ADMIN_KEY.charCodeAt(i);
		if (r === 0) {
			return { username: "admin", role: "admin", method: "password" };
		}
	}

	// 3. Session token
	const username = token ? await verifySessionToken(token, env.HMAC_SECRET_KEY) : null;
	if (username) {
		const user = await env.DB.prepare("SELECT username, role FROM users WHERE username = ?").bind(username).first<{ username: string; role: string }>();
		if (user) {
			await env.DB.prepare("UPDATE users SET last_active_at = datetime('now') WHERE username = ?").bind(username).run();
			return { username: user.username, role: user.role as "admin" | "member", method: "password" };
		}
		return { username, role: "member", method: "password" };
	}

	return null;
}

export function requireAdmin(user: AuthUser | null): Response | null {
	if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
	if (user.role !== "admin") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });
	return null;
}

export function requireAuth(user: AuthUser | null): Response | null {
	if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
	return null;
}
