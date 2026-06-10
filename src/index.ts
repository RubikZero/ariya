interface LogPayload {
	mod_id: string;
	mod_version: string;
	game_version?: string;
	error_message: string;
	stack_trace: string;
	game_state: string;
	player_os: string;
	os_version: string;
	created_at: number;
}

export interface Env {
	DB: D1Database;
	HMAC_SECRET_KEY: string;
	TIMEOUT: number;
	ADMIN_KEY?: string;
}

import { renderAdminPage, handleAdminLogs, handleVerify, isAdminAuthed } from "./admin.js";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === "/admin") {
			const token = url.searchParams.get("token") || "";
			return renderAdminPage(env, token);
		}
		if (url.pathname === "/admin/logs") {
			if (!isAdminAuthed(env, url.searchParams.get("token") || "")) {
				return new Response("Unauthorized", { status: 401 });
			}
			return handleAdminLogs(env);
		}
		if (url.pathname === "/admin/verify") {
			if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
			const body = await request.json() as any;
			return handleVerify(env, body);
		}

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
				"raw", keyData,
				{ name: "HMAC", hash: { name: "SHA-256" } },
				false, ["verify"]
			);

			const signatureBuffer = Uint8Array.from(atob(clientSignature), c => c.charCodeAt(0));
			const isValid = await crypto.subtle.verify("HMAC", cryptoKey, signatureBuffer, encoder.encode(rawBody));

			if (!isValid) {
				return new Response("Forbidden: Invalid HMAC", { status: 403 });
			}

			const logData = JSON.parse(rawBody) as LogPayload;
			const { mod_id, mod_version, game_version, error_message, stack_trace, game_state, player_os, os_version, created_at } = logData;

			const now = Date.now();
			if (Math.abs(now - created_at) > env.TIMEOUT * 1000) {
				console.warn(`Expired request, time: ${new Date(created_at).toString()}, now: ${new Date(now).toString()}`);
				return new Response("Forbidden: Request expired", { status: 422 });
			}

			const hashInput = [mod_id, mod_version, game_version || "", error_message, stack_trace].join("|");
			const hashBytes = await crypto.subtle.digest("SHA-256", encoder.encode(hashInput));
			const hash = Array.from(new Uint8Array(hashBytes)).map(b => b.toString(16).padStart(2, "0")).join("");

			const result = await env.DB.prepare(
				`INSERT INTO mod_errors (hash, mod_id, mod_version, game_version, error_message, stack_trace, game_state, player_os, os_version, count, created_at)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
				 ON CONFLICT(hash) DO UPDATE SET
					 game_state = excluded.game_state,
					 player_os  = excluded.player_os,
					 os_version = excluded.os_version,
					 created_at = excluded.created_at,
					 count      = count + 1
				 RETURNING count`
			)
				.bind(hash, mod_id, mod_version, game_version || null, error_message, stack_trace, game_state || null, player_os || null, os_version || null, created_at)
				.first<number>("count") || 0;

			return new Response(JSON.stringify({ success: true, count: result }), {
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
