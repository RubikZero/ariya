export interface Env {
	DB: D1Database;
	HMAC_SECRET_KEY: string;
	TIMEOUT: number;
	ADMIN_KEY?: string;
	CF_ACCESS_TEAM_DOMAIN?: string;
	OWNER_EMAIL?: string;
	ASSETS?: Fetcher;
}

import { handleAdminLogs, handleBrowseLogs, handleLogin } from "./admin.js";
import { createSessionToken } from "./auth.js";
import { handleLogSubmission } from "./logs.js";
import { getAuthUser, requireAdmin, requireAuth } from "./auth.js";
import { handleRegister, handleMe, handleUpdateNickname, handleUpdatePassword, handleListUsers, handleUpdateRole, handleRemoveUser, handleTransferOwnership, handleCreateInviteCode, handleUserCount } from "./users.js";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// Favicon / .well-known (always, no auth)
		if (url.pathname === "/favicon.ico" || url.pathname.startsWith("/.well-known/")) {
			return new Response(null, { status: 204 });
		}

		// Browser GET / or /index.html -> redirect to admin app (behind Zero Trust)
		if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
			return Response.redirect(url.origin + "/admin", 302);
		}

		// --- Admin & API routes (protected by Cloudflare Access) ---
		if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api")) {
			let token = url.searchParams.get("token") || "";
			const user = await getAuthUser(request, env, token);
			const role = user?.role || "member";

			if (user && user.method === "zero-trust" && !token) {
				token = await createSessionToken(user.username, env.HMAC_SECRET_KEY);
			}

			// SPA: serve index.html for admin HTML navigation + static assets
			if (env.ASSETS && request.method === "GET" && url.pathname.startsWith("/admin")) {
				const accept = request.headers.get("Accept") || "";
				if (accept.includes("text/html")) {
					const indexUrl = new URL("/index.html", url);
					const spaResponse = await env.ASSETS.fetch(new Request(indexUrl, request));
					if (user?.method === "zero-trust" && token) {
						const resp2 = new Response(spaResponse.body, spaResponse);
						resp2.headers.append("Set-Cookie", `ariya_token=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`);
						return resp2;
					}
					return spaResponse;
				}
				const assetResponse = await env.ASSETS.fetch(request);
				if (assetResponse.status !== 404) return assetResponse;
			}

			// --- Admin API ---
			if (url.pathname === "/admin/login" && request.method === "POST") {
				const body = await request.json() as any;
				return handleLogin(env, body);
			}
			if (url.pathname === "/admin/register-admin" && request.method === "POST") {
				const body = await request.json() as any;
				const existing = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first<number>("count");
				if (existing && existing > 0) {
					return new Response(JSON.stringify({ error: "Users already exist. Use invite codes instead." }), { status: 403 });
				}
				if (!body.username || !body.password) {
					return new Response(JSON.stringify({ error: "Missing username or password" }), { status: 400 });
				}
				if (body.username.length < 2 || body.password.length < 6) {
					return new Response(JSON.stringify({ error: "Username min 2 chars, password min 6 chars" }), { status: 400 });
				}
				const encoder = new TextEncoder();
				const salt = crypto.getRandomValues(new Uint8Array(16));
				const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
				const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(body.password + saltHex), "PBKDF2", false, ["deriveBits"]);
				const hashBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(saltHex), iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
				const hashHex = Array.from(new Uint8Array(hashBits)).map(b => b.toString(16).padStart(2, "0")).join("");
				await env.DB.prepare("INSERT INTO users (username, nickname, password_hash, role, auth_method) VALUES (?, ?, ?, 'admin', 'password')")
					.bind(body.username, body.username, saltHex + ":" + hashHex).run();
				return new Response(JSON.stringify({ success: true, message: "Admin registered. You can now log in." }));
			}
			if (url.pathname === "/admin/logs") {
				const blocked = requireAuth(user);
				if (blocked) return blocked;
				return handleAdminLogs(env);
			}
			if (url.pathname === "/admin/browse") {
				const blocked = requireAuth(user);
				if (blocked) return blocked;
				return handleBrowseLogs(env, request);
			}

			// --- User management API ---
			if (url.pathname === "/api/me" && request.method === "GET") {
				const blocked = requireAuth(user); if (blocked) return blocked;
				return handleMe(env, user!);
			}
			if (url.pathname === "/api/me/nickname" && request.method === "PUT") {
				const blocked = requireAuth(user); if (blocked) return blocked;
				const body = await request.json() as any;
				return handleUpdateNickname(env, user!, body);
			}
			if (url.pathname === "/api/me/password" && request.method === "PUT") {
				const blocked = requireAuth(user); if (blocked) return blocked;
				const body = await request.json() as any;
				return handleUpdatePassword(env, user!, body);
			}

			if (url.pathname === "/api/users" && request.method === "GET") {
				const blocked = requireAdmin(user); if (blocked) return blocked;
				return handleListUsers(env);
			}
			if (url.pathname.startsWith("/api/users/") && request.method === "PUT") {
				const blocked = requireAdmin(user); if (blocked) return blocked;
				const targetUsername = url.pathname.replace("/api/users/", "").replace("/role", "");
				const body = await request.json() as any;
				if (url.pathname.endsWith("/role")) return handleUpdateRole(env, targetUsername, body);
				return new Response("Not Found", { status: 404 });
			}
			if (url.pathname.startsWith("/api/users/") && request.method === "DELETE") {
				const blocked = requireAdmin(user); if (blocked) return blocked;
				const targetUsername = url.pathname.replace("/api/users/", "");
				return handleRemoveUser(env, user!, targetUsername);
			}
			if (url.pathname === "/api/users/transfer" && request.method === "POST") {
				const blocked = requireAdmin(user); if (blocked) return blocked;
				const body = await request.json() as any;
				return handleTransferOwnership(env, user!, body);
			}
			if (url.pathname === "/api/users/count") {
				return handleUserCount(env);
			}

			if (url.pathname === "/api/logs/detail") {
				const blocked = requireAuth(user);
				if (blocked) return blocked;
				const hash = url.searchParams.get("hash") || "";
				if (!hash) return new Response(JSON.stringify({ error: "Missing hash" }), { status: 400, headers: { "Content-Type": "application/json" } });
				try {
					const log = await env.DB.prepare(
						"SELECT hash, mod_id, mod_version, game_version, error_message, stack_trace, game_state, player_os, os_version, count, created_at FROM mod_errors WHERE hash = ?"
					).bind(hash).first();
					if (!log) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
					return new Response(JSON.stringify({ log }), { headers: { "Content-Type": "application/json" } });
				} catch (e: any) {
					return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
				}
			}

			if (url.pathname === "/api/invite-codes" && request.method === "POST") {
				const blocked = requireAdmin(user); if (blocked) return blocked;
				const body = await request.json() as any;
				return handleCreateInviteCode(env, user!, body);
			}

			// --- Registration (no auth required) ---
			if (url.pathname === "/api/register" && request.method === "POST") {
				const body = await request.json() as any;
				return handleRegister(env, body);
			}

			return new Response("Not Found", { status: 404 });
		}

		// --- Static assets outside admin/api (JS, CSS, images) ---
		if (env.ASSETS && request.method === "GET" && url.pathname !== "/" && url.pathname !== "/index.html") {
			const assetResponse = await env.ASSETS.fetch(request);
			if (assetResponse.status !== 404) return assetResponse;
		}

		// --- Everything else → log upload ---
		return handleLogSubmission(request, env);
	},
} satisfies ExportedHandler<Env>;
