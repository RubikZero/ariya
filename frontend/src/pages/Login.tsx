import { useState, useEffect } from "react";
import { useAuth } from "../auth";
import { api } from "../api";
import { Link } from "react-router-dom";
import { useLocale } from "../locale";

export default function Login() {
	const { login } = useAuth();
	const { t, setLocale, lang } = useLocale();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);

	const [firstRun, setFirstRun] = useState<boolean | null>(null);
	const [regUsername, setRegUsername] = useState("");
	const [regPassword, setRegPassword] = useState("");
	const [regMsg, setRegMsg] = useState("");
	const [regBusy, setRegBusy] = useState(false);

	useEffect(() => {
		api<{ count: number }>("/api/users/count")
			.then((d) => setFirstRun(d.count === 0))
			.catch(() => setFirstRun(false));
	}, []);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setBusy(true);
		try {
			await login(username, password);
		} catch (err: any) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	}

	async function handleRegister(e: React.FormEvent) {
		e.preventDefault();
		setRegMsg("");
		setRegBusy(true);
		try {
			await api("/admin/register-admin", {
				method: "POST",
				body: JSON.stringify({ username: regUsername, password: regPassword }),
			});
			setError(t("login.created"));
			setUsername(regUsername);
			setPassword("");
			setRegPassword("");
			setFirstRun(false);
		} catch (err: any) {
			setRegMsg(err.message);
		} finally {
			setRegBusy(false);
		}
	}

	const currentLang = lang;

	if (firstRun === null) {
		return (
			<div style={containerStyle}>
				<div style={cardStyle}><p style={{ color: "#94a3b8", textAlign: "center" }}>{t("loading")}</p></div>
			</div>
		);
	}

	return (
		<div style={containerStyle}>
			<div style={{ position: "absolute", top: "1rem", right: "1rem" }}>
				<select value={currentLang} onChange={(e) => setLocale(e.target.value)}
					style={{ padding: "0.375rem 0.75rem", background: "#0f172a", color: "#e2e8f0", border: "1px solid #475569", borderRadius: "0.375rem", fontSize: "0.8125rem", cursor: "pointer" }}>
					<option value="zh-CN">中文</option>
					<option value="en">English</option>
				</select>
			</div>

			{firstRun ? (
				<form onSubmit={handleRegister} style={cardStyle}>
					<h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem", color: "#f8fafc" }}>Ariya</h1>
					<p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1.5rem" }}>{t("login.create_admin_desc")}</p>
					{regMsg && <p style={{ color: regMsg === t("login.created") ? "var(--accent-success)" : "#fca5a5", fontSize: "0.8125rem", marginBottom: "0.75rem", padding: "0.5rem", background: "rgba(239,68,68,0.1)", borderRadius: "0.375rem" }}>{regMsg}</p>}
					<label style={labelStyle}>{t("login.title")}</label>
					<input value={regUsername} onChange={(e) => setRegUsername(e.target.value)} style={inputStyle} autoComplete="username" disabled={regBusy} />
					<label style={labelStyle}>Password</label>
					<input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} style={inputStyle} autoComplete="new-password" disabled={regBusy} />
					<button type="submit" disabled={regBusy} style={btnStyle}>{regBusy ? t("login.create_loading") : t("login.create_btn")}</button>
				</form>
			) : (
				<form onSubmit={handleSubmit} style={cardStyle}>
					<h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem", color: "#f8fafc" }}>Ariya</h1>
					<p style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "1.5rem" }}>{t("login.desc")}</p>
					{error && <p style={{ color: "#fca5a5", fontSize: "0.8125rem", marginBottom: "0.75rem", padding: "0.5rem", background: "rgba(239,68,68,0.1)", borderRadius: "0.375rem" }}>{error}</p>}
					<label style={labelStyle}>{t("login.title")}</label>
					<input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} autoComplete="username" disabled={busy} />
					<label style={labelStyle}>Password</label>
					<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} autoComplete="current-password" disabled={busy} />
					<button type="submit" disabled={busy} style={btnStyle}>{busy ? t("login.loading") : t("login.btn")}</button>
					<p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8125rem", color: "#94a3b8" }}>
						{t("login.no_account")} <Link to="/admin/register" style={{ color: "#3b82f6", textDecoration: "none" }}>{t("login.register")}</Link>
					</p>
				</form>
			)}
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
};
