import { useState, useCallback } from "react";
import { apiUrl } from "../api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
	const [generatedKey, setGeneratedKey] = useState("");
	const [copied, setCopied] = useState(false);
	const [testKey, setTestKey] = useState("");
	const [testUrl, setTestUrl] = useState(window.location.origin);
	const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
	const [testBusy, setTestBusy] = useState(false);
	const [recentLogs, setRecentLogs] = useState<any[]>([]);
	const [logsBusy, setLogsBusy] = useState(false);
	const nav = useNavigate();

	const generateKey = useCallback(() => {
		const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
			.map((b) => b.toString(16).padStart(2, "0")).join("");
		setGeneratedKey(key);
		setTestKey(key);
		setCopied(false);
	}, []);

	const copyKey = useCallback(async () => {
		if (!generatedKey) return;
		await navigator.clipboard.writeText(generatedKey);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [generatedKey]);

	async function testSubmit() {
		if (!testKey) return;
		setTestBusy(true);
		setTestResult(null);
		try {
			const now = new Date().toISOString();
			const encoder = new TextEncoder();
			const keyData = encoder.encode(testKey);
			const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

			const p = {
				mod_id: "sts2-mod-example", mod_version: "1.0.0", game_version: "2.0",
				error_message: "Test error - " + now,
				stack_trace: "at GameLogic.update (GameLogic.cs:123)\nat GameManager.run (GameManager.cs:456)",
				game_state: '{"game.scene":"CombatRoom","game.in_run":"true"}',
				player_os: navigator.platform, os_version: navigator.userAgent,
				created_at: Date.now(),
			};
			const body = JSON.stringify(p);
			const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(body));
			const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));

			const resp = await fetch(testUrl || window.location.origin, {
				method: "POST", headers: { "Content-Type": "application/json", "X-Mod-Signature": signature }, body,
			});
			const text = await resp.text();
			setTestResult({ ok: resp.ok, text });
		} catch (e: any) {
			setTestResult({ ok: false, text: e.message });
		} finally {
			setTestBusy(false);
		}
	}

	async function loadLogs() {
		setLogsBusy(true);
		try {
			const resp = await fetch(apiUrl("/admin/logs"));
			const data = await resp.json();
			setRecentLogs(data.logs || []);
		} catch {} finally {
			setLogsBusy(false);
		}
	}

	return (
		<>
			<div style={cardStyle}>
				<h2 style={h2Style}>Generate HMAC Key</h2>
				<p style={descStyle}>Ariya uses HMAC-SHA256 to verify requests from the mod.</p>
				<div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
					<input readOnly value={generatedKey} placeholder="Click generate" style={{ ...inputStyle, flex: 1, marginBottom: 0 }} />
					<button onClick={generateKey} style={btnPrm}>Generate</button>
					<button onClick={copyKey} style={btnSec}>Copy</button>
					{copied && <span style={{ fontSize: "0.75rem", color: "#22c55e" }}>Copied</span>}
				</div>
			</div>

			<div style={cardStyle}>
				<h2 style={h2Style}>Test Submission</h2>
				<p style={descStyle}>Send a test log to verify the end-to-end flow.</p>
				<label style={labelStyle}>HMAC Key</label>
				<input value={testKey} onChange={(e) => setTestKey(e.target.value)} style={inputStyle} placeholder="Paste HMAC key" />
				<label style={labelStyle}>Request URL</label>
				<input value={testUrl} onChange={(e) => setTestUrl(e.target.value)} style={inputStyle} placeholder="http://localhost:8787" />
				<button onClick={testSubmit} disabled={testBusy} style={btnSuc}>{testBusy ? "Sending..." : "Send Test Request"}</button>
				{testResult && <div style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: "0.375rem", fontSize: "0.8125rem", fontFamily: "monospace", whiteSpace: "pre-wrap", background: testResult.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: testResult.ok ? "#86efac" : "#fca5a5" }}>{testResult.text}</div>}
			</div>

			<div style={cardStyle}>
				<h2 style={h2Style}>Recent Submissions</h2>
				<button onClick={loadLogs} disabled={logsBusy} style={btnPrm}>{logsBusy ? "Loading..." : "Load Logs"}</button>
				{recentLogs.length > 0 && (
					<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem", marginTop: "0.75rem" }}>
						<thead><tr>{["Time", "Mod", "Version", "Error", "Count"].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
						<tbody>
							{recentLogs.map((log: any) => (
								<tr key={log.hash} onClick={() => nav("/admin/logs?hash=" + encodeURIComponent(log.hash))} style={{ cursor: "pointer" }}>
									<td style={tdStyle}>{new Date(log.created_at).toLocaleString()}</td>
									<td style={tdStyle}><span style={tagStyle}>{log.mod_id}</span></td>
									<td style={tdStyle}>{log.mod_version}</td>
									<td style={{ ...tdStyle, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.error_message}>{log.error_message}</td>
									<td style={tdStyle}>{log.count}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
				{recentLogs.length > 0 && <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.5rem" }}>{recentLogs.length} records</p>}
			</div>
		</>
	);
}

const cardStyle: React.CSSProperties = {
	background: "#1e293b", border: "1px solid #334155", borderRadius: "0.5rem",
	padding: "1.5rem", marginBottom: "1.5rem",
};
const h2Style: React.CSSProperties = { fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem", color: "#f1f5f9" };
const descStyle: React.CSSProperties = { color: "#94a3b8", fontSize: "0.8125rem", marginBottom: "1rem" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#cbd5e1", marginBottom: "0.375rem" };
const inputStyle: React.CSSProperties = {
	width: "100%", padding: "0.625rem", background: "#0f172a", border: "1px solid #475569",
	borderRadius: "0.375rem", color: "#e2e8f0", fontSize: "0.875rem", fontFamily: "monospace",
	marginBottom: "0.75rem", boxSizing: "border-box", outline: "none",
};
const btnPrm: React.CSSProperties = { padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, background: "#3b82f6", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer" };
const btnSec: React.CSSProperties = { padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, background: "#475569", color: "#e2e8f0", border: "none", borderRadius: "0.375rem", cursor: "pointer" };
const btnSuc: React.CSSProperties = { padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, background: "#22c55e", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer" };
const thStyle: React.CSSProperties = { padding: "0.5rem 0.75rem", textAlign: "left", borderBottom: "1px solid #334155", fontWeight: 600, color: "#94a3b8", fontSize: "0.6875rem", textTransform: "uppercase", letterSpacing: "0.05em" };
const tdStyle: React.CSSProperties = { padding: "0.5rem 0.75rem", borderBottom: "1px solid #334155" };
const tagStyle: React.CSSProperties = { display: "inline-block", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", fontSize: "0.6875rem", background: "#334155", color: "#94a3b8" };
