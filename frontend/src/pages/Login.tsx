import { useState } from "react";
import { useAuth } from "../auth";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
	const { login } = useAuth();
	const nav = useNavigate();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		try {
			await login(username, password);
			nav("/admin/browse");
		} catch (err: any) {
			setError(err.message);
		}
	}

	return (
		<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0f172a" }}>
			<form onSubmit={handleSubmit} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "0.5rem", padding: "2rem", width: "100%", maxWidth: 420, margin: "1rem", color: "#e2e8f0" }}>
				<h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem", color: "#f8fafc" }}>Admin Login</h1>
				<p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1.5rem" }}>Enter your credentials</p>
				{error && <p style={{ color: "#fca5a5", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>{error}</p>}
				<label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#cbd5e1", marginBottom: "0.375rem" }}>Username</label>
				<input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} autoComplete="username" />
				<label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#cbd5e1", marginBottom: "0.375rem" }}>Password</label>
				<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="current-password" />
				<button type="submit" style={{ ...btnStyle, width: "100%", marginTop: "0.5rem" }}>Sign In</button>
				<p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8125rem", color: "#94a3b8" }}>
					No account yet? <Link to="/register" style={{ color: "#3b82f6", textDecoration: "none" }}>Register here</Link>
				</p>
			</form>
		</div>
	);
}

const inputStyle: React.CSSProperties = {
	width: "100%", padding: "0.625rem", background: "#0f172a", border: "1px solid #475569",
	borderRadius: "0.375rem", color: "#e2e8f0", fontSize: "0.875rem", fontFamily: "monospace",
	marginBottom: "0.75rem", boxSizing: "border-box",
};

const btnStyle: React.CSSProperties = {
	padding: "0.625rem", fontSize: "0.875rem", fontWeight: 500, background: "#3b82f6",
	color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer",
};
