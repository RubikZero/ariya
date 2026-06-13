export interface Env {
	DB: D1Database;
	HMAC_SECRET_KEY: string;
	TIMEOUT: number;
	ADMIN_KEY?: string;
}

import { renderAdminPage, handleAdminLogs, handleRegisterAdmin, handleLogin, verifySessionToken } from "./admin.js";
import { handleLogSubmission } from "./logs.js";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/admin") {
			const token = url.searchParams.get("token") || "";
			const cfEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
			const adminKeyOk = env.ADMIN_KEY && token.length === env.ADMIN_KEY.length && (() => { let r=0; for(let i=0;i<token.length;i++) r|=token.charCodeAt(i)^env.ADMIN_KEY.charCodeAt(i); return r===0; })();
			const sessionUser = token ? await verifySessionToken(token, env.HMAC_SECRET_KEY) : null;
			const authed = !!(cfEmail || adminKeyOk || sessionUser);
			return renderAdminPage(env, authed, authed ? token : "", request);
		}
		if (url.pathname === "/admin/logs") {
			const token = url.searchParams.get("token") || "";
			const cfEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
			const adminKeyOk = env.ADMIN_KEY && token.length === env.ADMIN_KEY.length && (() => { let r=0; for(let i=0;i<token.length;i++) r|=token.charCodeAt(i)^env.ADMIN_KEY.charCodeAt(i); return r===0; })();
			const sessionUser = token ? await verifySessionToken(token, env.HMAC_SECRET_KEY) : null;
			if (!cfEmail && !adminKeyOk && !sessionUser) {
				return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
			}
			return handleAdminLogs(env);
		}
		if (url.pathname === "/admin/login" && request.method === "POST") {
			const body = await request.json() as any;
			return handleLogin(env, body);
		}
		if (url.pathname === "/admin/register-admin" && request.method === "POST") {
			const body = await request.json() as any;
			return handleRegisterAdmin(env, body);
		}

		return handleLogSubmission(request, env);
	},
} satisfies ExportedHandler<Env>;
