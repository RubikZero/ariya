import type { Env } from "./index.js";
import type { AuthUser } from "./auth.js";
import { createSessionToken } from "./auth.js";

// --- Registration with invite code ---
export async function handleRegister(env: Env, body: { username?: string; password?: string; invite_code?: string }): Promise<Response> {
	if (!body.username || !body.password || !body.invite_code) {
		return new Response(JSON.stringify({ error: "Missing username, password, or invite_code" }), { status: 400 });
	}
	if (body.username.length < 2 || body.password.length < 6) {
		return new Response(JSON.stringify({ error: "Username min 2 chars, password min 6 chars" }), { status: 400 });
	}

	// Validate invite code
	const invite = await env.DB.prepare("SELECT created_by, used_by, expires_at FROM invite_codes WHERE code = ?").bind(body.invite_code).first<{ created_by: string; used_by: string | null; expires_at: string }>();
	if (!invite) {
		return new Response(JSON.stringify({ error: "Invalid invite code" }), { status: 400 });
	}
	if (invite.used_by) {
		return new Response(JSON.stringify({ error: "Invite code already used" }), { status: 400 });
	}
	if (new Date(invite.expires_at) < new Date()) {
		return new Response(JSON.stringify({ error: "Invite code expired" }), { status: 400 });
	}

	// Check if username already taken
	const existing = await env.DB.prepare("SELECT username FROM users WHERE username = ?").bind(body.username).first();
	if (existing) {
		return new Response(JSON.stringify({ error: "Username already taken" }), { status: 409 });
	}

	// Create user
	const encoder = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
	const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(body.password + saltHex), "PBKDF2", false, ["deriveBits"]);
	const hashBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(saltHex), iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
	const hashHex = Array.from(new Uint8Array(hashBits)).map(b => b.toString(16).padStart(2, "0")).join("");

	await env.DB.prepare("INSERT INTO users (username, nickname, password_hash, role, auth_method) VALUES (?, ?, ?, 'member', 'password')")
		.bind(body.username, body.username, saltHex + ":" + hashHex).run();

	// Mark invite code as used
	await env.DB.prepare("UPDATE invite_codes SET used_by = ? WHERE code = ?").bind(body.username, body.invite_code).run();

	const token = await createSessionToken(body.username, env.HMAC_SECRET_KEY);
	return new Response(JSON.stringify({ success: true, token, role: "member" }));
}

// --- Get current user info ---
export async function handleMe(env: Env, user: AuthUser): Promise<Response> {
	const row = await env.DB.prepare("SELECT username, nickname, role, email, last_active_at, created_at FROM users WHERE username = ?")
		.bind(user.username).first<{ username: string; nickname: string; role: string; email: string | null; last_active_at: string | null; created_at: string }>();
	if (!row) {
		return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
	}
	return new Response(JSON.stringify({ user: row }));
}

// --- Update nickname ---
export async function handleUpdateNickname(env: Env, user: AuthUser, body: { nickname?: string }): Promise<Response> {
	if (!body.nickname || body.nickname.length < 1 || body.nickname.length > 50) {
		return new Response(JSON.stringify({ error: "Nickname must be 1-50 chars" }), { status: 400 });
	}
	await env.DB.prepare("UPDATE users SET nickname = ? WHERE username = ?").bind(body.nickname, user.username).run();
	return new Response(JSON.stringify({ success: true }));
}

// --- Change password ---
export async function handleUpdatePassword(env: Env, user: AuthUser, body: { old_password?: string; new_password?: string }): Promise<Response> {
	if (!body.old_password || !body.new_password) {
		return new Response(JSON.stringify({ error: "Missing old_password or new_password" }), { status: 400 });
	}
	if (body.new_password.length < 6) {
		return new Response(JSON.stringify({ error: "New password min 6 chars" }), { status: 400 });
	}

	const row = await env.DB.prepare("SELECT password_hash FROM users WHERE username = ?").bind(user.username).first<{ password_hash: string }>("password_hash");
	if (!row) {
		return new Response(JSON.stringify({ error: "Password login not enabled for this account" }), { status: 400 });
	}

	const [storedSalt, storedHash] = row.toString().split(":");
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(body.old_password + storedSalt), "PBKDF2", false, ["deriveBits"]);
	const hashBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(storedSalt), iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
	const computedHash = Array.from(new Uint8Array(hashBits)).map(b => b.toString(16).padStart(2, "0")).join("");

	if (computedHash !== storedHash) {
		return new Response(JSON.stringify({ error: "Old password is incorrect" }), { status: 401 });
	}

	// Generate new password hash
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
	const newKeyMaterial = await crypto.subtle.importKey("raw", encoder.encode(body.new_password + saltHex), "PBKDF2", false, ["deriveBits"]);
	const newHashBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(saltHex), iterations: 100000, hash: "SHA-256" }, newKeyMaterial, 256);
	const newHashHex = Array.from(new Uint8Array(newHashBits)).map(b => b.toString(16).padStart(2, "0")).join("");

	await env.DB.prepare("UPDATE users SET password_hash = ? WHERE username = ?").bind(saltHex + ":" + newHashHex, user.username).run();
	return new Response(JSON.stringify({ success: true }));
}

// --- List all users (admin) ---
export async function handleListUsers(env: Env): Promise<Response> {
	const users = await env.DB.prepare("SELECT username, nickname, role, email, last_active_at FROM users ORDER BY role DESC, username ASC").all();
	return new Response(JSON.stringify({ users: users.results }));
}

// --- Update user role (admin) ---
export async function handleUpdateRole(env: Env, targetUsername: string, body: { role?: string }): Promise<Response> {
	if (!body.role || !["admin", "member"].includes(body.role)) {
		return new Response(JSON.stringify({ error: "Role must be 'admin' or 'member'" }), { status: 400 });
	}
	if (targetUsername === "admin" && body.role === "member") {
		// Prevent demoting the default admin (if they still have ADMIN_KEY)
	}
	await env.DB.prepare("UPDATE users SET role = ? WHERE username = ?").bind(body.role, targetUsername).run();
	return new Response(JSON.stringify({ success: true }));
}

// --- Remove user (admin) ---
export async function handleRemoveUser(env: Env, caller: AuthUser, targetUsername: string): Promise<Response> {
	if (targetUsername === caller.username) {
		return new Response(JSON.stringify({ error: "Cannot remove yourself" }), { status: 400 });
	}
	const existing = await env.DB.prepare("SELECT username FROM users WHERE username = ?").bind(targetUsername).first();
	if (!existing) {
		return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
	}
	await env.DB.prepare("DELETE FROM users WHERE username = ?").bind(targetUsername).run();
	return new Response(JSON.stringify({ success: true }));
}

// --- Transfer ownership (admin) ---
export async function handleTransferOwnership(env: Env, caller: AuthUser, body: { target_username?: string }): Promise<Response> {
	if (!body.target_username) {
		return new Response(JSON.stringify({ error: "Missing target_username" }), { status: 400 });
	}
	if (body.target_username === caller.username) {
		return new Response(JSON.stringify({ error: "Cannot transfer to yourself" }), { status: 400 });
	}
	const target = await env.DB.prepare("SELECT username FROM users WHERE username = ?").bind(body.target_username).first();
	if (!target) {
		return new Response(JSON.stringify({ error: "Target user not found" }), { status: 404 });
	}
	// Demote caller to member, promote target to admin
	await env.DB.prepare("UPDATE users SET role = 'member' WHERE username = ?").bind(caller.username).run();
	await env.DB.prepare("UPDATE users SET role = 'admin' WHERE username = ?").bind(body.target_username).run();
	return new Response(JSON.stringify({ success: true }));
}

// --- Create invite code (admin) ---
export async function handleCreateInviteCode(env: Env, caller: AuthUser, body: { expires_in_hours?: number }): Promise<Response> {
	const hours = Math.max(1, Math.min(720, body.expires_in_hours || 48));
	const code = Array.from(crypto.getRandomValues(new Uint8Array(16)))
		.map(b => b.toString(16).padStart(2, "0")).join("");
	const expiresAt = new Date(Date.now() + hours * 3600000).toISOString();
	await env.DB.prepare("INSERT INTO invite_codes (code, created_by, expires_at) VALUES (?, ?, ?)")
		.bind(code, caller.username, expiresAt).run();
	return new Response(JSON.stringify({ code, expires_at: expiresAt }));
}
