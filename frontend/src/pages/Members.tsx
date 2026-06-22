import { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { useLocale } from "../locale";

interface User {
	username: string;
	nickname: string;
	role: string;
	last_active_at: string | null;
	created_at: string;
}

export default function Members() {
	const { user: me } = useAuth();
	const { t } = useLocale();
	const [users, setUsers] = useState<User[]>([]);
	const [busy, setBusy] = useState(false);
	const [msg, setMsg] = useState("");

	const [inviteHours, setInviteHours] = useState("48");
	const [inviteResult, setInviteResult] = useState("");
	const [inviteBusy, setInviteBusy] = useState(false);
	const [inviteCopied, setInviteCopied] = useState(false);

	const [targetUsername, setTargetUsername] = useState("");
	const [transferBusy, setTransferBusy] = useState(false);

	async function loadUsers() {
		setBusy(true);
		try {
			const data = await api<{ users: User[] }>("/api/users");
			setUsers(data.users || []);
		} catch {}
		setBusy(false);
	}

	useEffect(() => { loadUsers(); }, []);

	async function updateRole(username: string, role: string) {
		try {
			await api("/api/users/" + encodeURIComponent(username) + "/role", {
				method: "PUT", body: JSON.stringify({ role }),
			});
			setMsg(t("members.role_updated"));
			loadUsers();
		} catch (err: any) { setMsg(err.message); }
	}

	async function removeUser(username: string) {
		if (!confirm(t("members.remove_confirm"))) return;
		try {
			await api("/api/users/" + encodeURIComponent(username), { method: "DELETE" });
			setMsg(t("members.remove_done"));
			loadUsers();
		} catch (err: any) { setMsg(err.message); }
	}

	async function createInvite() {
		setInviteBusy(true);
		setInviteResult("");
		setInviteCopied(false);
		try {
			const data = await api<{ code: string; expires_at: string }>("/api/invite-codes", {
				method: "POST", body: JSON.stringify({ expires_in_hours: parseInt(inviteHours) || 48 }),
			});
			setInviteResult(data.code);
		} catch (err: any) { setInviteResult("Error: " + err.message); }
		setInviteBusy(false);
	}

	async function copyInvite() {
		if (!inviteResult) return;
		await navigator.clipboard.writeText(inviteResult);
		setInviteCopied(true);
		setTimeout(() => setInviteCopied(false), 2000);
	}

	async function transferOwnership() {
		if (!targetUsername.trim()) return;
		setTransferBusy(true);
		setMsg("");
		try {
			await api("/api/users/transfer", {
				method: "POST", body: JSON.stringify({ target_username: targetUsername }),
			});
			setMsg(t("members.transfer_done"));
			setTargetUsername("");
			loadUsers();
		} catch (err: any) { setMsg(err.message); }
		setTransferBusy(false);
	}

	return (
		<>
			{msg && (
				<div style={{ padding: "0.75rem 1rem", borderRadius: "0.375rem", fontSize: "0.8125rem", background: "rgba(34,197,94,0.1)", color: "var(--accent-success)", marginBottom: "1rem" }}>
					{msg}
				</div>
			)}

			<div className="card">
				<h2>{t("members.title")}</h2>
				{busy ? (
					<p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("loading")}</p>
				) : users.length === 0 ? (
					<p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{t("members.no_users")}</p>
				) : (
					<table>
						<thead>
							<tr>
								<th>{t("members.table_username")}</th>
								<th>{t("members.table_nickname")}</th>
								<th>{t("members.table_role")}</th>
								<th>{t("members.table_last_active")}</th>
								<th style={{ width: 140 }} />
							</tr>
						</thead>
						<tbody>
							{users.map((u) => (
								<tr key={u.username}>
									<td>{u.username}</td>
									<td style={{ color: "var(--text-muted)" }}>{u.nickname || "-"}</td>
									<td>
										<select
											value={u.role}
											onChange={(e) => updateRole(u.username, e.target.value)}
											style={{ width: "auto", marginBottom: 0, padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
											disabled={u.username === me?.username}
										>
											<option value="admin">{t("members.role_admin")}</option>
											<option value="member">{t("members.role_member")}</option>
										</select>
									</td>
									<td>{u.last_active_at ? new Date(u.last_active_at).toLocaleString() : "-"}</td>
									<td>
										{u.username !== me?.username && (
											<button onClick={() => removeUser(u.username)} className="btn btn-danger" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
												{t("members.remove_btn")}
											</button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>

			<div className="card">
				<h2>{t("members.invite_title")}</h2>
				<label className="label">{t("members.invite_expires")}</label>
				<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
					<input type="number" min={1} max={720} value={inviteHours}
						onChange={(e) => setInviteHours(e.target.value)}
						style={{ flex: 1, marginBottom: 0 }} />
					<button onClick={createInvite} disabled={inviteBusy} className="btn btn-primary">{t("members.invite_create")}</button>
				</div>
				{inviteResult && (
					<div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
						<code className="code-badge" style={{ flex: 1, wordBreak: "break-all", fontSize: "0.75rem" }}>{inviteResult}</code>
						<button onClick={copyInvite} className="btn btn-secondary">{inviteCopied ? t("members.invite_copied") : t("dashboard.key_copy")}</button>
					</div>
				)}
			</div>

			<div className="card">
				<h2>{t("members.transfer_title")}</h2>
				<p className="desc">{t("members.transfer_desc")}</p>
				<label className="label">{t("members.transfer_target")}</label>
				<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
					<input value={targetUsername} onChange={(e) => setTargetUsername(e.target.value)}
						style={{ flex: 1, marginBottom: 0 }} />
					<button onClick={transferOwnership} disabled={transferBusy || !targetUsername.trim()} className="btn btn-danger">{t("members.transfer_btn")}</button>
				</div>
			</div>
		</>
	);
}
