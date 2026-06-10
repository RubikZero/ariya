const STYLE = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 0; }
header { background: linear-gradient(135deg, #1e293b, #334155); padding: 2rem; border-bottom: 1px solid #475569; }
header h1 { font-size: 1.5rem; font-weight: 700; color: #f8fafc; }
header p { font-size: 0.875rem; color: #94a3b8; margin-top: 0.25rem; }
main { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
.card { background: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 1.5rem; }
.card h2 { font-size: 1.125rem; font-weight: 600; margin-bottom: 1rem; color: #f1f5f9; }
label { display: block; font-size: 0.875rem; font-weight: 500; color: #cbd5e1; margin-bottom: 0.375rem; }
input, textarea { width: 100%; padding: 0.625rem; background: #0f172a; border: 1px solid #475569; border-radius: 0.375rem; color: #e2e8f0; font-size: 0.875rem; font-family: "JetBrains Mono", "Cascadia Code", "Fira Code", monospace; margin-bottom: 0.75rem; }
input:focus, textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.3); }
textarea { min-height: 120px; resize: vertical; }
button { padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; border: none; border-radius: 0.375rem; cursor: pointer; transition: all 0.15s; }
button:active { transform: scale(0.97); }
.btn-primary { background: #3b82f6; color: #fff; }
.btn-primary:hover { background: #2563eb; }
.btn-secondary { background: #475569; color: #e2e8f0; }
.btn-secondary:hover { background: #64748b; }
.btn-success { background: #22c55e; color: #fff; }
.btn-success:hover { background: #16a34a; }
.btn-danger { background: #ef4444; color: #fff; }
.btn-danger:hover { background: #dc2626; }
.flex { display: flex; gap: 0.5rem; align-items: center; }
.mt-2 { margin-top: 0.5rem; }
.mb-2 { margin-bottom: 0.5rem; }
.key-display { display: flex; gap: 0.5rem; align-items: center; }
.key-display input { flex: 1; margin-bottom: 0; }
.copy-msg { font-size: 0.75rem; color: #22c55e; display: none; }
.result { margin-top: 0.75rem; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.8125rem; font-family: "JetBrains Mono", "Cascadia Code", "Fira Code", monospace; white-space: pre-wrap; word-break: break-all; }
.result.success { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); color: #86efac; }
.result.error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
.result.info { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); color: #93c5fd; }
table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #334155; }
th { font-weight: 600; color: #94a3b8; text-transform: uppercase; font-size: 0.6875rem; letter-spacing: 0.05em; }
tr:hover td { background: rgba(51,65,85,0.5); }
.status-badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 600; }
.status-badge.online { background: rgba(34,197,94,0.15); color: #86efac; }
.status-badge.offline { background: rgba(239,68,68,0.15); color: #fca5a5; }
.empty-state { text-align: center; padding: 2rem; color: #64748b; }
.empty-state p { font-size: 0.875rem; }
.tag { display: inline-block; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-size: 0.6875rem; background: #334155; color: #94a3b8; margin-right: 0.25rem; }
`;

export function renderAdminPage(keyConfigured: boolean): Response {
	const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ariya - 管理面板</title>
<style>${STYLE}</style>
</head>
<body>
<header>
	<h1>Ariya</h1>
	<p>Slay the Spire 2 Mod 日志收集平台 · 管理面板</p>
</header>
<main>
	<div class="card">
		<h2>🔑 生成 HMAC 密钥</h2>
		<p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:1rem;">Ariya 使用 HMAC-SHA256 验证 Mod 发来的请求。Mod 和服务端必须使用<strong>相同的密钥</strong>。</p>
		<div class="key-display">
			<input type="text" id="generated-key" readonly placeholder="点击下方按钮生成密钥" />
			<button class="btn-primary" onclick="generateKey()">生成</button>
			<button class="btn-secondary" onclick="copyKey()">复制</button>
			<span class="copy-msg" id="copy-msg">已复制</span>
		</div>
		<div id="key-usage" style="display:none;margin-top:1rem;border-top:1px solid #334155;padding-top:1rem;">
			<p style="color:#f1f5f9;font-weight:600;margin-bottom:0.75rem;">使用此密钥需要完成以下配置：</p>

			<div style="margin-bottom:1rem;">
				<p style="color:#93c5fd;font-weight:500;margin-bottom:0.375rem;">步骤 1：配置到 Worker 端</p>
				<p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:0.25rem;">▸ 本地开发：将密钥填入 <code style="background:#0f172a;padding:0.125rem 0.375rem;border-radius:0.25rem;">.dev.vars</code></p>
				<div style="background:#0f172a;padding:0.75rem;border-radius:0.375rem;font-size:0.8125rem;font-family:monospace;margin-bottom:0.5rem;">
					HMAC_SECRET_KEY=<span id="usage-key-local"></span>
				</div>
				<p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:0.25rem;">▸ 生产部署：运行以下命令并粘贴密钥</p>
				<div style="background:#0f172a;padding:0.75rem;border-radius:0.375rem;font-size:0.8125rem;font-family:monospace;margin-bottom:0.25rem;" id="usage-cmd-prod">
					npx wrangler secret put HMAC_SECRET_KEY
				</div>
				<p style="color:#64748b;font-size:0.75rem;">执行后会提示输入值，粘贴生成的密钥后按回车</p>
			</div>

			<div style="margin-bottom:1rem;">
				<p style="color:#93c5fd;font-weight:500;margin-bottom:0.375rem;">步骤 2：配置到 Mod 端</p>
				<p style="color:#94a3b8;font-size:0.8125rem;">将相同的密钥填入 Mod 的 HMAC 密钥配置项中。</p>
			</div>

			<div>
				<p style="color:#93c5fd;font-weight:500;margin-bottom:0.375rem;">步骤 3：测试验证</p>
				<p style="color:#94a3b8;font-size:0.8125rem;">密钥已自动填入下方的测试区域，直接点击"发送测试请求"即可。</p>
			</div>
		</div>
	</div>

	<div class="card">
		<h2>📤 测试提交</h2>
		<p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:1rem;">发送一条模拟日志到提交接口，验证端到端是否正常工作。</p>
		<label>HMAC 密钥</label>
		<input type="text" id="test-key" placeholder="粘贴或先生成 HMAC 密钥" />
		<label>请求地址</label>
		<input type="text" id="test-url" placeholder="例如 http://localhost:8787 或 https://ariya.example.workers.dev" />
		<button class="btn-success" onclick="testSubmit()">发送测试请求</button>
		<div class="result" id="test-result"></div>
	</div>

	<div class="card">
		<h2>📋 最近提交</h2>
		<div id="logs-container">
			<div class="empty-state"><p>点击下方按钮加载日志</p></div>
		</div>
		<button class="btn-primary" onclick="loadLogs()">加载日志</button>
	</div>
</main>
<script>
// Auto-fill test URL on page load
document.addEventListener("DOMContentLoaded", () => {
	const urlInput = document.getElementById("test-url");
	if (!urlInput.value) urlInput.value = window.location.origin;
});

function generateKey() {
	const key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
		.map(b => b.toString(16).padStart(2, "0"))
		.join("");
	document.getElementById("generated-key").value = key;

	// Show usage guide
	document.getElementById("key-usage").style.display = "block";
	document.getElementById("usage-key-local").textContent = key;

	// Auto-fill test section
	document.getElementById("test-key").value = key;

	// Scroll to usage guide
	document.getElementById("key-usage").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function copyKey() {
	const input = document.getElementById("generated-key");
	if (!input.value) return;
	navigator.clipboard.writeText(input.value).then(() => {
		const msg = document.getElementById("copy-msg");
		msg.style.display = "inline";
		setTimeout(() => msg.style.display = "none", 2000);
	});
}

async function testSubmit() {
	const key = document.getElementById("test-key").value.trim();
	const url = document.getElementById("test-url").value.trim() || window.location.origin;
	const result = document.getElementById("test-result");

	if (!key) { result.className = "result error"; result.textContent = "请先输入 HMAC 密钥"; return; }

	result.className = "result info";
	result.textContent = "正在计算 HMAC 签名...";

	const payload = JSON.stringify({
		uuid: crypto.randomUUID(),
		mod_id: "sts2-mod-example",
		mod_version: "1.0.0",
		game_version: "2.0",
		error_message: "测试异常信息 — " + new Date().toISOString(),
		stack_trace: "at GameLogic.update (GameLogic.cs:123)\\nat GameManager.run (GameManager.cs:456)",
		game_state: "InGame",
		player_os: navigator.platform || "Unknown",
		os_version: navigator.userAgent || "Unknown",
		created_at: Date.now()
	});

	try {
		const encoder = new TextEncoder();
		const keyData = encoder.encode(key);
		const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
		const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
		const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));

		result.className = "result info";
		result.textContent = "正在发送请求...";

		const resp = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json", "X-Mod-Signature": signature },
			body: payload
		});

		const text = await resp.text();
		if (resp.ok) {
			result.className = "result success";
			result.textContent = "✅ 提交成功！状态: " + resp.status + "\\n响应: " + text;
		} else {
			result.className = "result error";
			result.textContent = "❌ 请求失败 (HTTP " + resp.status + ")\\n响应: " + text;
		}
	} catch (e) {
		result.className = "result error";
		result.textContent = "❌ 网络错误: " + e.message;
	}
}

async function loadLogs() {
	const container = document.getElementById("logs-container");
	container.innerHTML = '<div class="empty-state"><p>加载中...</p></div>';

	try {
		const resp = await fetch("/admin/logs");
		const data = await resp.json();
		if (!data.logs || data.logs.length === 0) {
			container.innerHTML = '<div class="empty-state"><p>暂无日志记录</p></div>';
			return;
		}
		let html = '<table><thead><tr><th>时间</th><th>Mod</th><th>版本</th><th>异常</th><th>UUID</th></tr></thead><tbody>';
		for (const log of data.logs) {
			html += '<tr>' +
				'<td style="white-space:nowrap;font-size:0.75rem;color:#94a3b8;">' + new Date(log.created_at).toLocaleString() + '</td>' +
				'<td><span class="tag">' + escapeHtml(log.mod_id) + '</span></td>' +
				'<td>' + escapeHtml(log.mod_version) + '</td>' +
				'<td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escapeHtml(log.error_message) + '">' + escapeHtml(log.error_message) + '</td>' +
				'<td style="font-family:monospace;font-size:0.75rem;color:#64748b;">' + escapeHtml(log.uuid.slice(0, 8)) + '…</td>' +
				'</tr>';
		}
		html += '</tbody></table><p style="color:#64748b;font-size:0.75rem;margin-top:0.5rem;">共 ' + data.logs.length + ' 条记录</p>';
		container.innerHTML = html;
	} catch (e) {
		container.innerHTML = '<div class="result error">加载失败: ' + e.message + '</div>';
	}
}

function escapeHtml(s) {
	if (!s) return "";
	return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
</script>
</body>
</html>`;
	return new Response(html, {
		headers: { "Content-Type": "text/html; charset=utf-8" },
	});
}

export async function handleAdminLogs(env: Env): Promise<Response> {
	try {
		const result = await env.DB.prepare(
			`SELECT uuid, mod_id, mod_version, error_message, created_at FROM mod_errors ORDER BY created_at DESC LIMIT 50`
		).all();
		return new Response(JSON.stringify({ logs: result.results }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}

// We need the Env type, re-import from the main context
import type { Env } from "./index.js";
