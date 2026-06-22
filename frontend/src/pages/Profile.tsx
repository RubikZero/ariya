import { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { useLocale } from "../locale";

export default function Profile() {
	const { user } = useAuth();
	const { t } = useLocale();
	const [nickname, setNickname] = useState("");
	const [nickMsg, setNickMsg] = useState("");

	const [oldPassword, setOldPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [pwMsg, setPwMsg] = useState("");

	useEffect(() => {
		api<{ user: any }>("/api/me").then((d) => setNickname(d.user.nickname || "")).catch(() => {});
	}, []);

	async function saveNickname() {
		setNickMsg("");
		try {
			await api("/api/me/nickname", { method: "PUT", body: JSON.stringify({ nickname }) });
			setNickMsg(t("profile.nickname_saved"));
		} catch (err: any) { setNickMsg(err.message); }
	}

	async function changePassword() {
		setPwMsg("");
		try {
			await api("/api/me/password", { method: "PUT", body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }) });
			setPwMsg(t("profile.password_changed"));
			setOldPassword("");
			setNewPassword("");
		} catch (err: any) { setPwMsg(err.message); }
	}

	return (
		<>
			<div className="card">
				<h2>{t("profile.title")}</h2>
				<label className="label">{t("profile.username")}</label>
				<input value={user?.username || ""} readOnly style={{ color: "var(--text-muted)" }} />
				<label className="label">{t("profile.nickname")}</label>
				<input value={nickname} onChange={(e) => setNickname(e.target.value)} />
				<button onClick={saveNickname} className="btn btn-primary">{t("profile.nickname_btn")}</button>
				{nickMsg && <p style={{ color: "var(--accent-success)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{nickMsg}</p>}
			</div>

			<div className="card">
				<h2>{t("profile.old_password")}</h2>
				<label className="label">{t("profile.old_password")}</label>
				<input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
				<label className="label">{t("profile.new_password")}</label>
				<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
				<button onClick={changePassword} className="btn btn-primary">{t("profile.password_btn")}</button>
				{pwMsg && <p style={{ color: "var(--accent-success)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{pwMsg}</p>}
			</div>
		</>
	);
}
