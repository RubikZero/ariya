import type { Env } from "./index.js";
import { createSessionToken } from "./auth.js";

// Handles login against the users table
export async function handleLogin(env: Env, body: { username?: string; password?: string }): Promise<Response> {
	if (!body.username || !body.password) {
		return new Response(JSON.stringify({ error: "Missing username or password" }), { status: 400 });
	}
	const row = await env.DB.prepare("SELECT password_hash FROM users WHERE username = ? AND auth_method = 'password'")
		.bind(body.username).first<{ password_hash: string }>("password_hash");
	if (!row) {
		return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
	}
	const [storedSalt, storedHash] = row.toString().split(":");
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(body.password + storedSalt), "PBKDF2", false, ["deriveBits"]);
	const hashBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(storedSalt), iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
	const computedHash = Array.from(new Uint8Array(hashBits)).map(b => b.toString(16).padStart(2, "0")).join("");
	if (computedHash !== storedHash) {
		return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
	}
	// Update last_active_at
	await env.DB.prepare("UPDATE users SET last_active_at = datetime('now') WHERE username = ?").bind(body.username).run();
	const token = await createSessionToken(body.username, env.HMAC_SECRET_KEY);
	const userRow = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(body.username).first<{ role: string }>("role");
	const role = userRow || "member";
	return new Response(JSON.stringify({ success: true, token, role }));
}

export async function handleAdminLogs(env: Env): Promise<Response> {
	try {
		const result = await env.DB.prepare("SELECT hash, mod_id, mod_version, error_message, count, created_at FROM mod_errors ORDER BY created_at DESC LIMIT 50").all();
		return new Response(JSON.stringify({ logs: result.results }), { headers: { "Content-Type": "application/json" } });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}

const SORT_MAP: Record<string, string> = {
	time: "created_at", mod_id: "mod_id", mod_ver: "mod_version",
	game_ver: "game_version", error: "error_message", stack: "stack_trace",
	state: "game_state", os: "player_os", os_ver: "os_version",
	count: "count", hash: "hash",
};

const ALLOWED_DIRS = ["asc", "desc"];

export async function handleBrowseLogs(env: Env, request: Request): Promise<Response> {
	try {
		const url = new URL(request.url);
		const page = Math.max(1, parseInt(url.searchParams.get("page") || "") || 1);
		const size = Math.min(2000, Math.max(10, parseInt(url.searchParams.get("size") || "") || 20));
		const sortField = SORT_MAP[url.searchParams.get("sort[0][field]") || ""] || "created_at";
		const sortDir = ALLOWED_DIRS.includes(url.searchParams.get("sort[0][dir]") || "") ? url.searchParams.get("sort[0][dir]")! : "desc";
		const offset = (page - 1) * size;

		const countResult = await env.DB.prepare("SELECT COUNT(*) as total FROM mod_errors").first<number>("total");
		const total = countResult || 0;
		const lastPage = Math.max(1, Math.ceil(total / size));

		const rows = await env.DB.prepare(
			`SELECT hash, mod_id, mod_version, game_version, error_message, stack_trace, game_state, player_os, os_version, count, created_at
			 FROM mod_errors ORDER BY ${sortField} ${sortDir} LIMIT ? OFFSET ?`
		).bind(size, offset).all();

		const data = rows.results.map((r: any) => ({
			id: r.hash, time: new Date(r.created_at).getTime(), time_display: new Date(r.created_at).toLocaleString(),
			mod_id: r.mod_id, mod_ver: r.mod_version, game_ver: r.game_version || "-",
			error: r.error_message, stack: r.stack_trace ? r.stack_trace.substring(0, 80) : "-", stack_full: r.stack_trace,
			state: r.game_state ? r.game_state.substring(0, 60) : "-", state_full: r.game_state,
			os: r.player_os || "-", os_ver: r.os_version || "-", count: r.count, hash: r.hash.substring(0, 8), _lang: "",
		}));

		return new Response(JSON.stringify({ data, total, last_page: lastPage }), { headers: { "Content-Type": "application/json" } });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}


