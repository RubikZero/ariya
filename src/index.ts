interface LogPayload {
	uuid: string
	mod_id: string
	mod_version: string;
	game_version?: string;
	error_message: string;
	stack_trace: string;
	game_state: string; // JSON-serialized dictionary: scene, room, combat, player HP, etc.
	player_os: string;
	os_version: string;
	created_at: number;
}

export interface Env {
	DB: D1Database;
	HMAC_SECRET_KEY: string; // HMAC密钥
	TIMEOUT: number; // 请求过期时间（单位：秒）
}

import { renderAdminPage, handleAdminLogs } from "./admin.js";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		// Admin panel
		if (url.pathname === "/admin") {
			return renderAdminPage(!!env.HMAC_SECRET_KEY);
		}
		if (url.pathname === "/admin/logs") {
			return handleAdminLogs(env);
		}

		// Log submission endpoint
		if (request.method !== "POST") {
			return new Response("Method Not Allowed", { status: 405 });
		}
		const clientSignature = request.headers.get("X-Mod-Signature");
		if (!clientSignature) return new Response("Unauthorized", { status: 401 });
		try {
			const rawBody = await request.text();
			const encoder = new TextEncoder();
			const keyData = encoder.encode(env.HMAC_SECRET_KEY);

			const cryptoKey = await crypto.subtle.importKey(
				"raw",
				keyData,
				{
					name: "HMAC",
					hash: { name: "SHA-256" }
				},
				false,
				["verify"]
			);

			const signatureBuffer = Uint8Array.from(atob(clientSignature), c => c.charCodeAt(0));
			const dataBuffer = encoder.encode(rawBody);

			const isValid = await crypto.subtle.verify(
				"HMAC",
				cryptoKey,
				signatureBuffer,
				dataBuffer
			);

			if (!isValid) {
				return new Response("Forbidden: Invalid HMAC", { status: 403 });
			}

			const logData = JSON.parse(rawBody) as LogPayload;
			const { uuid, mod_id, mod_version, game_version, error_message, stack_trace, game_state, player_os, os_version, created_at } = logData;

			const now = Date.now();
			if (Math.abs(now - created_at) > env.TIMEOUT * 1000) {
				console.warn(`Expired request, time: ${new Date(created_at).toString()}, now: ${new Date(now).toString()}`);
				return new Response("Forbidden: Request expired", { status: 422 });
			}

			const info = await env.DB.prepare(
				`INSERT OR IGNORE INTO mod_errors (uuid, mod_id, mod_version, game_version, error_message, stack_trace, game_state, player_os, os_version, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
				.bind(uuid, mod_id, mod_version, game_version || null, error_message, stack_trace, game_state || null, player_os || null, os_version || null, created_at)
				.run();
			if (info.meta.changes === 0) {
				console.warn("Repeated log: %s", uuid);
			}

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			});
		} catch (error: any) {
			console.log(error);
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
	},
} satisfies ExportedHandler<Env>;
