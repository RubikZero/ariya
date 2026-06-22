import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { apiUrl } from "../api";

export default function LogDetail() {
	const [search] = useSearchParams();
	const hash = search.get("hash") || "";
	const [log, setLog] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!hash) return;
		fetch(apiUrl("/admin/logs?hash=" + encodeURIComponent(hash)))
			.then((r) => r.json())
			.then((data) => {
				if (data.logs?.length) setLog(data.logs[0]);
				else setLog(null);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, [hash]);

	if (loading) return <p style={{ color: "#94a3b8", padding: "2rem" }}>Loading...</p>;
	if (!log) return <p style={{ color: "#fc5a5a", padding: "2rem" }}>Log not found</p>;

	const gs = parseGameState(log.game_state);

	return (
		<>
			<Link to="/admin/browse" style={{ color: "#93c5fd", fontSize: "0.875rem", textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>&larr; Back</Link>
			<div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "0.5rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
				<h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "#f1f5f9" }}>Basic Info</h2>
				<div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.5rem 1rem", fontSize: "0.875rem" }}>
					<Label>Time</Label><Value>{new Date(log.created_at).toLocaleString()}</Value>
					<Label>Mod</Label><Value><code style={codeStyle}>{log.mod_id}</code></Value>
					<Label>Version</Label><Value>{log.mod_version}</Value>
					{log.game_version && <><Label>Game</Label><Value>{log.game_version}</Value></>}
					<Label>Error</Label><Value>{log.error_message}</Value>
					<Label>Count</Label><Value>{log.count}</Value>
					<Label>OS</Label><Value>{log.player_os}</Value>
					{log.os_version && <><Label>OS Ver</Label><Value>{log.os_version}</Value></>}
					<Label>Hash</Label><Value style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#64748b" }}>{log.hash}</Value>
				</div>
			</div>
			<div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "0.5rem", padding: "1.5rem", marginBottom: "1.5rem" }}>
				<h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "#f1f5f9" }}>Stack Trace</h2>
				<pre style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "0.375rem", padding: "1rem", fontSize: "0.8125rem", fontFamily: "monospace", overflowX: "auto", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>{(log.stack_trace || "").split("\n").map((l: string, i: number) => (
					<span key={i} style={{ display: "block", padding: "0.125rem 0", color: i === 0 ? "#f87171" : "#94a3b8", fontWeight: i === 0 ? 600 : 400 }}>{l}</span>
				))}</pre>
			</div>
			{gs && (
				<div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "0.5rem", padding: "1.5rem" }}>
					<h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "#f1f5f9" }}>Game State</h2>
					<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
						<tbody>{Object.entries(gs).map(([k, v]) => (
							<tr key={k}><td style={{ color: "#94a3b8", padding: "0.25rem 0.5rem" }}>{k}</td><td style={{ padding: "0.25rem 0.5rem" }}>{String(v)}</td></tr>
						))}</tbody>
					</table>
				</div>
			)}
		</>
	);
}

function Label({ children }: any) {
	return <span style={{ color: "#94a3b8", whiteSpace: "nowrap" }}>{children}</span>;
}
function Value({ children, style }: any) {
	return <span style={{ color: "#e2e8f0", wordBreak: "break-all", ...style }}>{children}</span>;
}
const codeStyle: React.CSSProperties = { background: "#0f172a", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", fontSize: "0.8125rem", fontFamily: "monospace" };

function parseGameState(json: string): Record<string, any> | null {
	try { return JSON.parse(json); } catch { return null; }
}
