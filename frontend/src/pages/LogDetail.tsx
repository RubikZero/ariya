import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { apiUrl } from "../api";
import { useLocale } from "../locale";

export default function LogDetail() {
	const { t } = useLocale();
	const [search] = useSearchParams();
	const hash = search.get("hash") || "";
	const [log, setLog] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!hash) return;
		fetch(apiUrl("/api/logs/detail?hash=" + encodeURIComponent(hash)))
			.then((r) => r.json())
			.then((data) => {
				if (data.log) setLog(data.log);
				else setLog(null);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [hash]);

	if (loading) return <p style={{ color: "var(--text-secondary)", padding: "2rem" }}>{t("loading")}</p>;
	if (!log) return <p style={{ color: "var(--accent-danger)", padding: "2rem" }}>{t("not_found")}</p>;

	const gs = parseGameState(log.game_state);

	return (
		<>
			<Link to="/admin/browse" style={{ color: "var(--accent-primary)", fontSize: "0.875rem", textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>&larr; {t("detail.back")}</Link>
			<div className="card">
				<h2>{t("detail.basic_info")}</h2>
				<div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem", fontSize: "0.875rem" }}>
					<Label>{t("detail.time")}</Label><Value>{new Date(log.created_at).toLocaleString()}</Value>
					<Label>{t("detail.mod")}</Label><Value><code className="code-badge">{log.mod_id}</code></Value>
					<Label>{t("detail.version")}</Label><Value>{log.mod_version}</Value>
					{log.game_version && <><Label>{t("detail.game")}</Label><Value>{log.game_version}</Value></>}
					<Label>{t("detail.error")}</Label><Value>{log.error_message}</Value>
					<Label>{t("detail.count")}</Label><Value>{log.count}</Value>
					<Label>{t("detail.os")}</Label><Value>{log.player_os}</Value>
					{log.os_version && <><Label>{t("detail.os_ver")}</Label><Value>{log.os_version}</Value></>}
					<Label>{t("detail.hash")}</Label><Value style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.hash}</Value>
				</div>
			</div>
			<div className="card">
				<h2>{t("detail.stack")}</h2>
				<pre style={{ background: "var(--bg-deep)", border: "1px solid var(--border-color)", borderRadius: "0.375rem", padding: "1rem", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", overflowX: "auto", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{(log.stack_trace || "").split("\n").map((l: string, i: number) => (
					<span key={i} style={{ display: "block", padding: "0.125rem 0", color: i === 0 ? "var(--accent-danger)" : "var(--text-secondary)", fontWeight: i === 0 ? 600 : 400 }}>{l}</span>
				))}</pre>
			</div>
			{gs && (
				<div className="card">
					<h2>{t("detail.state")}</h2>
					<table>
						<tbody>{Object.entries(gs).map(([k, v]) => (
							<tr key={k}><td style={{ color: "var(--text-secondary)", padding: "0.25rem 0.5rem" }}>{k}</td><td style={{ padding: "0.25rem 0.5rem" }}>{String(v)}</td></tr>
						))}</tbody>
					</table>
				</div>
			)}
		</>
	);
}

function Label({ children }: any) {
	return <span style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{children}</span>;
}
function Value({ children, style }: any) {
	return <span style={{ color: "var(--text-primary)", wordBreak: "break-all", ...style }}>{children}</span>;
}

function parseGameState(json: string): Record<string, any> | null {
	try { return JSON.parse(json); } catch { return null; }
}
