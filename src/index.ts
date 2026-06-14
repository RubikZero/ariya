export interface Env {
	DB: D1Database;
	HMAC_SECRET_KEY: string;
	TIMEOUT: number;
	ADMIN_KEY?: string;
}

import { renderAdminPage, renderBrowsePage, handleAdminLogs, handleBrowseLogs, handleLogDetail, handleRegisterAdmin, handleLogin, verifySessionToken } from "./admin.js";
import { handleLogSubmission } from "./logs.js";

async function isAuthed(request: Request, env: Env, token: string): Promise<boolean> {
	if (request.headers.get("Cf-Access-Authenticated-User-Email")) return true;
	if (env.ADMIN_KEY && token.length === env.ADMIN_KEY.length) {
		let r = 0;
		for (let i = 0; i < token.length; i++) r |= token.charCodeAt(i) ^ env.ADMIN_KEY.charCodeAt(i);
		if (r === 0) return true;
	}
	const sessionUser = token ? await verifySessionToken(token, env.HMAC_SECRET_KEY) : null;
	return !!sessionUser;
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/admin") {
			const token = url.searchParams.get("token") || "";
			const lang = url.searchParams.get("lang") || "zh-CN";
			const authed = await isAuthed(request, env, token);
			return renderAdminPage(env, authed, authed ? token : "", request, lang);
		}
		if (url.pathname === "/admin/logs") {
			const token = url.searchParams.get("token") || "";
			const hash = url.searchParams.get("hash") || "";
			const lang = url.searchParams.get("lang") || "zh-CN";
			const from = url.searchParams.get("from") || "";
			const authed = await isAuthed(request, env, token);
			if (!authed) {
				return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
			}
			if (hash) return handleLogDetail(env, hash, token, lang as any, from || undefined);
			return handleAdminLogs(env);
		}
		if (url.pathname === "/admin/browse") {
			const token = url.searchParams.get("token") || "";
			const lang = url.searchParams.get("lang") || "zh-CN";
			const authed = await isAuthed(request, env, token);
			if (!authed) return new Response("Unauthorized", { status: 401 });
			if (request.method === "POST") return handleBrowseLogs(env, request);
			return renderBrowsePage(token, lang);
		}
		if (url.pathname === "/admin/login" && request.method === "POST") {
			const body = await request.json() as any;
			return handleLogin(env, body);
		}
		if (url.pathname === "/admin/register-admin" && request.method === "POST") {
			const body = await request.json() as any;
			return handleRegisterAdmin(env, body);
		}

		if (url.pathname === "/favicon.ico") {
			return new Response(null, { status: 204 });
		}

		return handleLogSubmission(request, env);
	},
} satisfies ExportedHandler<Env>;
