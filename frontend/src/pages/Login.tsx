import { useState } from "react";
import { api, setToken } from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
	const nav = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setBusy(true);
		try {
			const data = await api<{ token: string; role: string }>("/admin/login", {
				method: "POST", body: JSON.stringify({ username, password }),
			});
			setToken(data.token, true);
			nav(data.role === "admin" ? "/admin" : "/admin/browse", { replace: true });
		} catch (err: any) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	}

	return (
		<div style={containerStyle}>
			<form onSubmit={handleSubmit} style={cardStyle}>
				<h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem", color: "#f8fafc" }}>Ariya</h1>
				<p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1.5rem" }}>Sign in to admin panel</p>
				{error && <p style={{ color: "#fca5a5", fontSize: "0.8125rem", marginBottom: "0.75rem", padding: "0.5rem", background: "rgba(239,68,68,0.1)", borderRadius: "0.375rem" }}>{error}</p>}
				<label style={labelStyle}>Username</label>
				<input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} autoComplete="username" disabled={busy} />
				<label style={labelStyle}>Password</label>
				<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="current-password" disabled={busy} />
				<button type="submit" disabled={busy} style={btnStyle}>{busy ? "Signing in..." : "Sign In"}</button>
				<p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8125rem", color: "#94a3b8" }}>
					No account? <Link to="/register" style={{ color: "#3b82f6", textDecoration: "none" }}>Register</Link>
				</p>
			</form>
		</div>
	);
}

const containerStyle: React.CSSProperties = {
	display: "flex", justifyContent: "center", alignItems: "center",
	minHeight: "100vh", background: "#0f172a",
};
const cardStyle: React.CSSProperties = {
	background: "#1e293b", border: "1px solid #334155", borderRadius: "0.5rem",
	padding: "2rem", width: "100%", maxWidth: 420, margin: "1rem", color: "#e2e8f0",
};
const labelStyle: React.CSSProperties = {
	display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#cbd5e1", marginBottom: "0.375rem",
};
const inputStyle: React.CSSProperties = {
	width: "100%", padding: "0.625rem", background: "#0f172a", border: "1px solid #475569",
	borderRadius: "0.375rem", color: "#e2e8f0", fontSize: "0.875rem", outline: "none",
	marginBottom: "0.75rem", boxSizing: "border-box",
};
const btnStyle: React.CSSProperties = {
	padding: "0.625rem", fontSize: "0.875rem", fontWeight: 500, background: "#3b82f6",
	color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", width: "100%",
	opacity: 1,
};
