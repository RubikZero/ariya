export interface Env {
	DB: D1Database;
	HMAC_SECRET_KEY: string;
	TIMEOUT: number;
	ADMIN_KEY?: string;
	CF_ACCESS_TEAM_DOMAIN?: string;
}

import { renderAdminPage, renderBrowsePage, renderRegisterPage, renderUsersPage, renderProfilePage, handleAdminLogs, handleBrowseLogs, handleLogDetail, handleLogin } from "./admin.js";
import { handleLogSubmission } from "./logs.js";
import { getAuthUser, requireAdmin, requireAuth } from "./auth.js";
import { handleRegister, handleMe, handleUpdateNickname, handleUpdatePassword, handleListUsers, handleUpdateRole, handleRemoveUser, handleTransferOwnership, handleCreateInviteCode } from "./users.js";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const token = url.searchParams.get("token") || "";
		const lang = url.searchParams.get("lang") || "zh-CN";
		const user = await getAuthUser(request, env, token);

		// --- Admin routes ---
		const role = user?.role || "member";

		if (url.pathname === "/admin") {
			const authed = !!user;
			if (authed && role !== "admin") {
				return Response.redirect(url.origin + "/admin/browse?token=" + encodeURIComponent(token) + "&lang=" + encodeURIComponent(lang), 302);
			}
			return renderAdminPage(env, authed, authed ? token : "", request, lang, role);
		}
		if (url.pathname === "/admin/logs") {
			const blocked = requireAuth(user);
			if (blocked) return blocked;
			const hash = url.searchParams.get("hash") || "";
			const from = url.searchParams.get("from") || "";
			if (hash) return handleLogDetail(env, hash, token, lang as any, from || undefined);
			return handleAdminLogs(env);
		}
		if (url.pathname === "/admin/browse") {
			const blocked = requireAuth(user);
			if (blocked) return blocked;
			if (url.searchParams.has("_ajax")) return handleBrowseLogs(env, request);
			return renderBrowsePage(token, lang, role);
		}
		if (url.pathname === "/admin/users") {
			const blocked = requireAdmin(user);
			if (blocked) return blocked;
			return renderUsersPage(token, lang, role);
		}
		if (url.pathname === "/admin/profile") {
			const blocked = requireAuth(user);
			if (blocked) return blocked;
			return renderProfilePage(token, lang, role);
		}
		if (url.pathname === "/admin/login" && request.method === "POST") {
			const body = await request.json() as any;
			return handleLogin(env, body);
		}
		if (url.pathname === "/admin/register-admin" && request.method === "POST") {
			const body = await request.json() as any;
			// Check if any users exist — if not, create first admin
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
		if (url.pathname === "/register") {
			return renderRegisterPage(lang);
		}

		if (url.pathname === "/favicon.ico" || url.pathname.startsWith("/.well-known/")) {
			return new Response(null, { status: 204 });
		}

		// Redirect /admin/login to /admin for the login page
		if (url.pathname === "/admin/login" && request.method === "GET") {
			return Response.redirect(url.origin + "/admin", 302);
		}

		return handleLogSubmission(request, env);
	},
} satisfies ExportedHandler<Env>;
