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

// --- JWT / Zero Trust group support ---

let cachedJwks: any = null;
let cachedJwksTs = 0;
const JWKS_TTL = 3600000;

function base64url(s: string): string {
	return s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4);
}

async function fetchJwks(teamDomain: string): Promise<any> {
	if (cachedJwks && Date.now() - cachedJwksTs < JWKS_TTL) return cachedJwks;
	const resp = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
	if (!resp.ok) throw new Error("Failed to fetch JWKS");
	const data = await resp.json();
	cachedJwks = data;
	cachedJwksTs = Date.now();
	return data;
}

function jwtDecodePayload(jwt: string): any {
	try {
		const payload = jwt.split(".")[1];
		return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64url(payload)), c => c.charCodeAt(0))));
	} catch { return null; }
}

async function jwtVerify(jwt: string, jwks: any): Promise<boolean> {
	try {
		const parts = jwt.split(".");
		if (parts.length !== 3) return false;
		const header = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64url(parts[0])), c => c.charCodeAt(0))));
		const kid = header.kid;
		const jwk = jwks.keys?.find((k: any) => k.kid === kid);
		if (!jwk) return false;

		const key = await crypto.subtle.importKey("jwk", { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256" }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
		const data = new TextEncoder().encode(parts[0] + "." + parts[1]);
		const sig = Uint8Array.from(atob(base64url(parts[2])), c => c.charCodeAt(0));
		return crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, key, sig, data);
	} catch { return false; }
}

function roleFromGroups(groups: string[] | undefined): "admin" | "member" {
	if (!groups || !groups.length) return "member";
	for (const g of groups) {
		if (g.toLowerCase().includes("admin")) return "admin";
	}
	return "member";
}

async function handleAccessJwt(env: Env, jwt: string): Promise<AuthUser | null> {
	const teamDomain = env.CF_ACCESS_TEAM_DOMAIN;
	if (!teamDomain) return null;

	try {
		const payload = jwtDecodePayload(jwt);
		if (!payload || !payload.email) return null;

		// Verify the JWT signature
		const jwks = await fetchJwks(teamDomain);
		const valid = await jwtVerify(jwt, jwks);
		if (!valid) { console.log("Access JWT: signature invalid"); return null; }

		// Check iss matches our team domain
		if (payload.iss && !payload.iss.includes(teamDomain)) {
			console.log("Access JWT: iss mismatch", payload.iss, teamDomain);
			return null;
		}

		const email = payload.email;
		const groups: string[] = payload.custom?.groups || [];

		console.log("Access auth:", JSON.stringify({ email, groups, iss: payload.iss, sub: payload.sub }));

		// Look up existing user
		const existing = await env.DB.prepare("SELECT username, role FROM users WHERE email = ?").bind(email).first<{ username: string; role: string }>();
		if (existing) {
			console.log("Access user exists:", existing.username, existing.role, groups);
			await env.DB.prepare("UPDATE users SET last_active_at = datetime('now') WHERE email = ?").bind(email).run();
			return { username: existing.username, role: existing.role as "admin" | "member", method: "zero-trust" };
		}

		// Auto-register: check OWNER_EMAIL first, fallback to groups
		let role: "admin" | "member" = "member";
		if (env.OWNER_EMAIL && email.toLowerCase() === env.OWNER_EMAIL.toLowerCase()) {
			role = "admin";
		} else {
			role = roleFromGroups(groups);
		}
		const username = email.split("@")[0];
		console.log("Access auto-register:", username, email, role, groups);
		await env.DB.prepare("INSERT INTO users (username, nickname, role, auth_method, email, last_active_at) VALUES (?, ?, ?, 'zero-trust', ?, datetime('now'))")
			.bind(username, username, role, email).run();
		return { username, role, method: "zero-trust" };
	} catch {
		return null;
	}
}

// --- Main auth entry point ---

export async function getAuthUser(request: Request, env: Env, token: string): Promise<AuthUser | null> {
	// 0. Fallback to cookie if no URL token
	if (!token) {
		const cookieToken = getCookie(request, "ariya_token");
		if (cookieToken) token = cookieToken;
	}

	// 1. Access JWT (gives email + groups, supports auto-register)
	const jwt = request.headers.get("CF-Access-JWT-Assertion");
	if (jwt && env.CF_ACCESS_TEAM_DOMAIN) {
		const result = await handleAccessJwt(env, jwt);
		if (result) return result;
	}

	// 2. Cf-Access email header fallback (also auto-registers)
	const cfEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
	if (cfEmail) {
		const user = await env.DB.prepare("SELECT username, role, auth_method FROM users WHERE email = ?").bind(cfEmail).first<{ username: string; role: string; auth_method: string }>();
		if (user) {
			await env.DB.prepare("UPDATE users SET last_active_at = datetime('now') WHERE email = ?").bind(cfEmail).run();
			return { username: user.username, role: user.role as "admin" | "member", method: "zero-trust" };
		}
		// Auto-register if this is the owner email
		const role: "admin" | "member" = (env.OWNER_EMAIL && cfEmail.toLowerCase() === env.OWNER_EMAIL.toLowerCase()) ? "admin" : "member";
		console.log("Access auto-register:", cfEmail, role);
		const username = cfEmail.split("@")[0];
		await env.DB.prepare("INSERT INTO users (username, nickname, role, auth_method, email, last_active_at) VALUES (?, ?, ?, 'zero-trust', ?, datetime('now'))")
			.bind(username, username, role, cfEmail).run();
		return { username, role, method: "zero-trust" };
	}

	// 3. ADMIN_KEY env var
	if (env.ADMIN_KEY && token.length === env.ADMIN_KEY.length) {
		let r = 0;
		for (let i = 0; i < token.length; i++) r |= token.charCodeAt(i) ^ env.ADMIN_KEY.charCodeAt(i);
		if (r === 0) return { username: "admin", role: "admin", method: "password" };
	}

	// 4. Session token
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
