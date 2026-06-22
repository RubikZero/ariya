import { useState } from "react";
import { api, setToken } from "../api";
import { Link, useNavigate } from "react-router-dom";
import { useLocale } from "../locale";

export default function Register() {
	const { t } = useLocale();
	const nav = useNavigate();
	const [code, setCode] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		try {
			const data = await api<{ token: string }>("/api/register", {
				method: "POST", body: JSON.stringify({ invite_code: code, username, password }),
			});
			setToken(data.token, true);
			nav("/admin/browse");
		} catch (err: any) { setError(err.message); }
	}

	return (
		<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg-dark)" }}>
			<form onSubmit={handleSubmit} className="card" style={{ maxWidth: 420, width: "100%", margin: "1rem" }}>
				<h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--text-primary)" }}>{t("register.title")}</h1>
				<p className="desc">{t("register.desc")}</p>
				{error && <p style={{ color: "var(--accent-danger)", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>{error}</p>}
				<label className="label">{t("register.invite_code")}</label>
				<input value={code} onChange={(e) => setCode(e.target.value)} />
				<label className="label">{t("register.username")}</label>
				<input value={username} onChange={(e) => setUsername(e.target.value)} />
				<label className="label">{t("register.password")}</label>
				<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
				<button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>{t("register.btn")}</button>
				<p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
					{t("register.has_account")} <Link to="/" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>{t("register.signin")}</Link>
				</p>
			</form>
		</div>
	);
}
