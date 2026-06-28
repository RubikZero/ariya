import { useState, useCallback } from "react";
import { apiUrl } from "../api";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../locale";

export default function Dashboard() {
	const { t } = useLocale();
	const [generatedKey, setGeneratedKey] = useState("");
	const [copied, setCopied] = useState(false);
	const [testKey, setTestKey] = useState("");
	const [testUrl, setTestUrl] = useState(import.meta.env.DEV ? "http://localhost:8787" : window.location.origin);
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
			const encoder = new TextEncoder();
			const keyData = encoder.encode(testKey);
			const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
			const p = {
				mod_id: "sts2-mod-example", mod_version: "1.0.0", game_version: "2.0",
				error_message: "Test error - " + new Date().toISOString(),
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
			setTestResult({ ok: resp.ok, text: await resp.text() });
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
			setRecentLogs((await resp.json()).logs || []);
		} catch {} finally {
			setLogsBusy(false);
		}
	}

	return (
		<>
			<div className="card">
				<h2>{t("dashboard.key_title")}</h2>
				<p className="desc">{t("dashboard.key_desc")}</p>
				<div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
					<input readOnly value={generatedKey} placeholder={t("dashboard.key_placeholder")} style={{ flex: 1, marginBottom: 0 }} />
					<button onClick={generateKey} className="btn btn-primary">{t("dashboard.key_generate")}</button>
					<button onClick={copyKey} className="btn btn-secondary">{t("dashboard.key_copy")}</button>
					{copied && <span style={{ fontSize: "0.75rem", color: "var(--accent-success)" }}>{t("dashboard.key_copied")}</span>}
				</div>
			</div>

			<div className="card">
				<h2>{t("dashboard.test_title")}</h2>
				<p className="desc">{t("dashboard.test_desc")}</p>
				<label style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.375rem", display: "block" }}>{t("dashboard.test_key_label")}</label>
				<input value={testKey} onChange={(e) => setTestKey(e.target.value)} placeholder={t("dashboard.test_key_label")} />
				<label style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "0.375rem", display: "block" }}>{t("dashboard.test_url_label")}</label>
				<input value={testUrl} onChange={(e) => setTestUrl(e.target.value)} placeholder="http://localhost:8787" />
				<button onClick={testSubmit} disabled={testBusy} className="btn btn-success">{testBusy ? t("dashboard.test_sending") : t("dashboard.test_btn")}</button>
				{testResult && (
					<div style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: "0.375rem", fontSize: "0.8125rem", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap", background: testResult.ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: testResult.ok ? "var(--accent-success)" : "var(--accent-danger)" }}>
						{testResult.text}
					</div>
				)}
			</div>

			<div className="card">
				<h2>{t("dashboard.logs_title")}</h2>
				<button onClick={loadLogs} disabled={logsBusy} className="btn btn-primary">{logsBusy ? t("dashboard.logs_loading") : t("dashboard.logs_btn")}</button>
				{recentLogs.length > 0 && (
					<>
						<table style={{ marginTop: "0.75rem" }}>
							<thead><tr>{[t("browse.col_time"), t("browse.col_mod"), t("browse.col_version"), t("browse.col_error"), t("browse.col_count")].map((h) => <th key={h}>{h}</th>)}</tr></thead>
							<tbody>
								{recentLogs.map((log: any) => (
									<tr key={log.hash} onClick={() => nav("/admin/logs?hash=" + encodeURIComponent(log.hash))} style={{ cursor: "pointer" }}>
										<td>{new Date(log.created_at).toLocaleString()}</td>
										<td><span style={{ display: "inline-block", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", fontSize: "0.6875rem", background: "var(--bg-hover)", color: "var(--text-secondary)" }}>{log.mod_id}</span></td>
										<td>{log.mod_version}</td>
										<td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.error_message}>{log.error_message}</td>
										<td>{log.count}</td>
									</tr>
								))}
							</tbody>
						</table>
						<p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>{recentLogs.length} records</p>
					</>
				)}
			</div>
		</>
	);
}
