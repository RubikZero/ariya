import { useState, useEffect } from "react";
import { api } from "../api";
import { useAuth } from "../auth";

export default function Profile() {
	const { user } = useAuth();
	const [nickname, setNickname] = useState("");
	const [msg, setMsg] = useState("");

	useEffect(() => {
		api<{ user: any }>("/api/me").then((d) => setNickname(d.user.nickname || "")).catch(() => {});
	}, []);

	async function saveNickname() {
		setMsg("");
		try {
			await api("/api/me/nickname", { method: "PUT", body: JSON.stringify({ nickname }) });
			setMsg("Nickname updated");
		} catch (err: any) { setMsg(err.message); }
	}

	return (
		<>
			<div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "0.5rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
				<h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", color: "#f1f5f9" }}>Profile Settings</h2>
				<label style={{ display: "block", fontSize: "0.875rem", color: "#cbd5e1", marginBottom: "0.375rem" }}>Username</label>
				<input value={user?.username || ""} readOnly style={{ ...inputStyle, color: "#94a3b8" }} />
				<label style={{ display: "block", fontSize: "0.875rem", color: "#cbd5e1", marginBottom: "0.375rem" }}>Nickname</label>
				<input value={nickname} onChange={(e) => setNickname(e.target.value)} style={inputStyle} />
				<button onClick={saveNickname} style={btnStyle}>Save Nickname</button>
				{msg && <p style={{ color: "#86efac", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{msg}</p>}
			</div>
		</>
	);
}

const inputStyle: React.CSSProperties = {
	width: "100%", padding: "0.625rem", background: "#0f172a", border: "1px solid #475569",
	borderRadius: "0.375rem", color: "#e2e8f0", fontSize: "0.875rem", fontFamily: "monospace",
	marginBottom: "0.75rem", boxSizing: "border-box",
};
const btnStyle: React.CSSProperties = {
	padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, background: "#3b82f6",
	color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer",
};
