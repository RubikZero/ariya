import type { Env } from "./index.js";

export const STYLE = `
* { margin:0;padding:0;box-sizing:border-box; }
body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; background:#0f172a; color:#e2e8f0; line-height:1.6; }
header { background:linear-gradient(135deg,#1e293b,#334155); padding:2rem; border-bottom:1px solid #475569; }
header h1 { font-size:1.5rem; font-weight:700; color:#f8fafc; }
header p { font-size:0.875rem; color:#94a3b8; margin-top:0.25rem; }
main { max-width:800px; margin:2rem auto; padding:0 1rem; }
.card { background:#1e293b; border:1px solid #334155; border-radius:0.5rem; padding:1.5rem; margin-bottom:1.5rem; }
.card h2 { font-size:1.125rem; font-weight:600; margin-bottom:1rem; color:#f1f5f9; }
label { display:block; font-size:0.875rem; font-weight:500; color:#cbd5e1; margin-bottom:0.375rem; }
input { width:100%; padding:0.625rem; background:#0f172a; border:1px solid #475569; border-radius:0.375rem; color:#e2e8f0; font-size:0.875rem; font-family:monospace; margin-bottom:0.75rem; }
input:focus { outline:none; border-color:#3b82f6; box-shadow:0 0 0 2px rgba(59,130,246,0.3); }
button { padding:0.5rem 1rem; font-size:0.875rem; font-weight:500; border:none; border-radius:0.375rem; cursor:pointer; transition:all 0.15s; }
button:active { transform:scale(0.97); }
.btn-primary { background:#3b82f6; color:#fff; }
.btn-primary:hover { background:#2563eb; }
.btn-secondary { background:#475569; color:#e2e8f0; }
.btn-secondary:hover { background:#64748b; }
.btn-success { background:#22c55e; color:#fff; }
.btn-success:hover { background:#16a34a; }
.key-display { display:flex; gap:0.5rem; align-items:center; }
.key-display input { flex:1; margin-bottom:0; }
.copy-msg { font-size:0.75rem; color:#22c55e; display:none; }
.result { margin-top:0.75rem; padding:0.75rem; border-radius:0.375rem; font-size:0.8125rem; font-family:monospace; white-space:pre-wrap; word-break:break-all; }
.result.success { background:rgba(34,197,94,0.1); border:1px solid rgba(34,197,94,0.3); color:#86efac; }
.result.error { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#fca5a5; }
.result.info { background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3); color:#93c5fd; }
table { width:100%; border-collapse:collapse; font-size:0.8125rem; }
th,td { padding:0.5rem 0.75rem; text-align:left; border-bottom:1px solid #334155; }
th { font-weight:600; color:#94a3b8; text-transform:uppercase; font-size:0.6875rem; letter-spacing:0.05em; }
tr:hover td { background:rgba(51,65,85,0.5); }
.empty-state { text-align:center; padding:2rem; color:#64748b; }
.empty-state p { font-size:0.875rem; }
.tag { display:inline-block; padding:0.125rem 0.375rem; border-radius:0.25rem; font-size:0.6875rem; background:#334155; color:#94a3b8; margin-right:0.25rem; }
`;

const DISABLED_PAGE = `
<div class="card" style="max-width:480px;margin:4rem auto;">
  <h2>⛔ 管理面板未启用</h2>
  <p style="color:#94a3b8;font-size:0.875rem;margin-top:0.5rem;">
    启用方式：<br/><br/>
    <strong>方式一（推荐）：Cloudflare Access</strong><br/>
    在 Cloudflare Zero Trust 中为此 Worker 创建 Access 应用。<br/><br/>
    <strong>方式二：用户名密码</strong><br/>
    运行 <code style="background:#0f172a;padding:0.125rem 0.375rem;border-radius:0.25rem;">npm run register-admin</code> 创建管理员账号。
  </p>
</div>`;

const LOGIN_PAGE = `
<div class="card" style="max-width:480px;margin:4rem auto;">
  <h2>🔐 管理员登录</h2>
  <p style="color:#94a3b8;font-size:0.875rem;margin-bottom:1.5rem;">输入用户名和密码登录管理面板。</p>
  <label>用户名</label>
  <input type="text" id="login-username" placeholder="用户名" autocomplete="username" />
  <label>密码</label>
  <input type="password" id="login-password" placeholder="密码" autocomplete="current-password" />
  <button class="btn-primary" onclick="login()" style="width:100%;">登录</button>
  <div class="result" id="login-result"></div>
</div>`;

const DASHBOARD_PAGE = `
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
      <div style="background:#0f172a;padding:0.75rem;border-radius:0.375rem;font-size:0.8125rem;font-family:monospace;margin-bottom:0.5rem;">HMAC_SECRET_KEY=<span id="usage-key-local"></span></div>
      <p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:0.25rem;">▸ 生产部署：运行以下命令并粘贴密钥</p>
      <div style="background:#0f172a;padding:0.75rem;border-radius:0.375rem;font-size:0.8125rem;font-family:monospace;margin-bottom:0.25rem;">npx wrangler secret put HMAC_SECRET_KEY</div>
      <p style="color:#64748b;font-size:0.75rem;">执行后会提示输入值，粘贴生成的密钥后按回车</p>
    </div>
    <div style="margin-bottom:1rem;">
      <p style="color:#93c5fd;font-weight:500;margin-bottom:0.375rem;">步骤 2：配置到 Mod 端</p>
      <p style="color:#94a3b8;font-size:0.8125rem;">将相同的密钥填入 Mod 的 HMAC 密钥配置项中。</p>
    </div>
    <div>
      <p style="color:#93c5fd;font-weight:500;margin-bottom:0.375rem;">步骤 3：测试验证</p>
      <p style="color:#94a3b8;font-size:0.8125rem;">密钥已自动填入下方的测试区域，直接点击发送测试请求即可。</p>
    </div>
  </div>
</div>

<div class="card">
  <h2>📤 测试提交</h2>
  <p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:1rem;">发送一条模拟日志到提交接口，验证端到端是否正常工作。</p>
  <label>HMAC 密钥</label>
  <input type="text" id="test-key" placeholder="粘贴或先生成 HMAC 密钥" />
  <label>请求地址</label>
  <input type="text" id="test-url" placeholder="例如 http://localhost:8787" />
  <button class="btn-success" onclick="testSubmit()">发送测试请求</button>
  <div class="result" id="test-result"></div>
</div>

<div class="card">
  <h2>📋 最近提交</h2>
  <div id="logs-container"><div class="empty-state"><p>点击下方按钮加载日志</p></div></div>
  <button class="btn-primary" onclick="loadLogs()">加载日志</button>
</div>`;

export const GAME_STATE_LABELS: Record<string, string> = {
	"loc.language": "游戏语言",
	"game.scene": "当前场景",
	"game.in_run": "游戏中",
	"game.seed": "种子",
	"game.ascension": "进阶等级",
	"game.act": "当前幕",
	"game.act_name": "幕名称",
	"game.floor": "楼层",
	"game.mode": "游戏模式",
	"game.room_type": "房间类型",
	"game.event": "事件",
	"game.characters": "角色",
	"game.player_count": "玩家数",
	"combat.encounter": "遭遇战",
	"combat.round": "回合",
	"combat.enemy_count": "敌人数",
	"combat.enemies": "敌人",
	"combat.player_hp": "玩家血量",
	"collect.exception": "收集异常",
};

const SCENE_LABELS: Record<string, string> = {
	"MainMenu": "主菜单",
	"LogoAnimation": "Logo 动画",
	"CombatRoom": "战斗房间",
	"MapRoom": "地图房间",
	"EventRoom": "事件房间",
	"RestSiteRoom": "休息处",
	"MerchantRoom": "商店",
	"TreasureRoom": "宝箱房间",
	"Run": "运行中",
};

function htm(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function readableGameState(jsonStr: string): string {
	try {
		const data = JSON.parse(jsonStr);
		const lines: string[] = [];
		for (const [key, val] of Object.entries(data)) {
			const label = GAME_STATE_LABELS[key] || key;
			let displayVal = String(val);
			if (key === "game.scene" && SCENE_LABELS[displayVal]) {
				displayVal = SCENE_LABELS[displayVal];
			}
			lines.push(`<tr><td style="color:#94a3b8;white-space:nowrap;padding:0.25rem 0.5rem;font-size:0.8125rem;">${htm(label)}</td><td style="padding:0.25rem 0.5rem;font-size:0.8125rem;">${htm(displayVal)}</td></tr>`);
		}
		return `<table style="width:100%;border-collapse:collapse;"><tbody>${lines.join("")}</tbody></table>`;
	} catch {
		return `<p style="color:#94a3b8;font-size:0.8125rem;">${htm(jsonStr)}</p>`;
	}
}

const DETAIL_STYLE = `
.back-link { display:inline-flex;align-items:center;gap:0.375rem;color:#93c5fd;text-decoration:none;font-size:0.875rem;margin-bottom:1rem; }
.back-link:hover { color:#bfdbfe; }
.detail-grid { display:grid; grid-template-columns:auto 1fr; gap:0.5rem 1rem; font-size:0.875rem; }
.detail-grid .label { color:#94a3b8; white-space:nowrap; }
.detail-grid .value { color:#e2e8f0; word-break:break-all; }
.stack-frame { display:block; padding:0.125rem 0; color:#94a3b8; }
.stack-frame:first-child { color:#f87171; font-weight:600; }
.stack-frame:first-child::before { content:"\u2192 "; }
`;

export function renderDetailPage(log: any, token: string): string {
	const time = new Date(log.created_at).toLocaleString();
	const gameStateHtml = readableGameState(log.game_state);
	const stackLines = (log.stack_trace || "").split("\n").map((l: string) => htm(l)).join('</span><span class="stack-frame">');

	return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>日志详情 - Ariya</title>
<style>
* { margin:0;padding:0;box-sizing:border-box; }
body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; background:#0f172a; color:#e2e8f0; line-height:1.6; }
header { background:linear-gradient(135deg,#1e293b,#334155); padding:1.5rem 2rem; border-bottom:1px solid #475569; }
header h1 { font-size:1.25rem; font-weight:700; color:#f8fafc; }
main { max-width:900px; margin:2rem auto; padding:0 1rem; }
.card { background:#1e293b; border:1px solid #334155; border-radius:0.5rem; padding:1.5rem; margin-bottom:1.5rem; }
.card h2 { font-size:1rem; font-weight:600; margin-bottom:1rem; color:#f1f5f9; }
pre { background:#0f172a; border:1px solid #334155; border-radius:0.375rem; padding:1rem; font-size:0.8125rem; font-family:"JetBrains Mono","Fira Code",monospace; overflow-x:auto; white-space:pre-wrap; word-break:break-all; line-height:1.5; }
code { background:#0f172a; padding:0.125rem 0.375rem; border-radius:0.25rem; font-size:0.8125rem; font-family:monospace; }
${DETAIL_STYLE}
</style>
</head>
<body>
<header>
	<a href="/admin?token=${encodeURIComponent(token)}" class="back-link">\u2190 返回管理面板</a>
	<h1>日志详情</h1>
</header>
<main>
	<div class="card">
		<h2>基本信息</h2>
		<div class="detail-grid">
			<span class="label">时间</span><span class="value">${htm(time)}</span>
			<span class="label">Mod</span><span class="value"><code>${htm(log.mod_id)}</code></span>
			<span class="label">版本</span><span class="value">${htm(log.mod_version)}</span>
			${log.game_version ? `<span class="label">游戏版本</span><span class="value">${htm(log.game_version)}</span>` : ""}
			<span class="label">错误次数</span><span class="value">${log.count}</span>
			<span class="label">操作系统</span><span class="value">${htm(log.player_os)}</span>
			${log.os_version ? `<span class="label">系统版本</span><span class="value">${htm(log.os_version)}</span>` : ""}
			<span class="label">Hash</span><span class="value" style="font-family:monospace;font-size:0.75rem;color:#64748b;">${htm(log.hash)}</span>
		</div>
	</div>
	<div class="card">
		<h2>异常信息</h2>
		<pre><span class="stack-frame">${stackLines}</span></pre>
	</div>
	<div class="card">
		<h2>游戏状态</h2>
		${gameStateHtml}
	</div>
</main>
</body>
</html>`;
}

function renderHtml(content: string, token: string): Response {
	const tokenJs = token ? JSON.stringify(token) : "null";
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
<main>${content}</main>
<script>
const TOKEN = ${tokenJs};
document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("test-url");
  if (urlInput && !urlInput.value) urlInput.value = window.location.origin;
});

async function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const result = document.getElementById("login-result");
  if (!username || !password) { result.className = "result error"; result.textContent = "\u8bf7\u8f93\u5165\u7528\u6237\u540d\u548c\u5bc6\u7801"; return; }
  result.className = "result info";
  result.textContent = "\u767b\u5f55\u4e2d...";
  try {
    const resp = await fetch("/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username,password}) });
    const data = await resp.json();
    if (resp.ok) { sessionStorage.setItem("ariya_token", data.token); location.href = "/admin?token=" + encodeURIComponent(data.token); }
    else { result.className = "result error"; result.textContent = data.error || "\u767b\u5f55\u5931\u8d25"; }
  } catch(e) { result.className = "result error"; result.textContent = "\u7f51\u7edc\u9519\u8bef: " + e.message; }
}
document.addEventListener("DOMContentLoaded", () => {
  const lp = document.getElementById("login-password");
  if (lp) lp.addEventListener("keydown", e => { if (e.key === "Enter") login(); });
});

function generateKey() {
  const key = Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,"0")).join("");
  document.getElementById("generated-key").value = key;
  document.getElementById("key-usage").style.display = "block";
  document.getElementById("usage-key-local").textContent = key;
  document.getElementById("test-key").value = key;
  document.getElementById("key-usage").scrollIntoView({ behavior:"smooth", block:"nearest" });
}
function htm(s) { if (!s) return ""; return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function copyKey() {
  const input = document.getElementById("generated-key");
  if (!input.value) return;
  navigator.clipboard.writeText(input.value).then(() => {
    const msg = document.getElementById("copy-msg");
    msg.style.display = "inline"; setTimeout(() => msg.style.display = "none", 2000);
  });
}
async function testSubmit() {
  const key = document.getElementById("test-key").value.trim();
  const url = document.getElementById("test-url").value.trim() || window.location.origin;
  const result = document.getElementById("test-result");
  if (!key) { result.className = "result error"; result.textContent = "\u8bf7\u8f93\u5165 HMAC \u5bc6\u94a5"; return; }
  result.className = "result info"; result.textContent = "\u8ba1\u7b97 HMAC \u7b7e\u540d...";
  var p = {};
  p.mod_id = "sts2-mod-example";
  p.mod_version = "1.0.0";
  p.game_version = "2.0";
  p.error_message = "\u6d4b\u8bd5\u5f02\u5e38 - " + new Date().toISOString();
  var nl = String.fromCharCode(10);
  p.stack_trace = "at GameLogic.update (GameLogic.cs:123)" + nl + "at GameManager.run (GameManager.cs:456)";
  p.game_state = '{"game.scene":"CombatRoom","game.in_run":"true"}';
  p.player_os = navigator.platform || "Unknown";
  p.os_version = navigator.userAgent || "Unknown";
  p.created_at = Date.now();
  var payload = JSON.stringify(p);
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
    const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));
    result.textContent = "\u53d1\u9001\u8bf7\u6c42...";
    const resp = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json","X-Mod-Signature":signature}, body:payload });
    const text = await resp.text();
    result.className = resp.ok ? "result success" : "result error";
    result.textContent = (resp.ok ? "OK: " : "ERR: " + resp.status + " ") + text;
  } catch(e) { result.className = "result error"; result.textContent = "\u7f51\u7edc\u9519\u8bef: "+e.message; }
}
function viewLog(hash) {
  var t = TOKEN || sessionStorage.getItem("ariya_token") || "";
  location.href = "/admin/logs?hash=" + encodeURIComponent(hash) + "&token=" + encodeURIComponent(t);
}
document.addEventListener("DOMContentLoaded", function() {
  document.addEventListener("click", function(e) {
    var row = e.target.closest(".log-row");
    if (row) viewLog(row.getAttribute("data-hash"));
  });
});

async function loadLogs() {
  const container = document.getElementById("logs-container");
  container.innerHTML = '<div class="empty-state"><p>\u52a0\u8f7d\u4e2d...</p></div>';
  const token = TOKEN || sessionStorage.getItem("ariya_token") || "";
  try {
    const resp = await fetch("/admin/logs?token="+encodeURIComponent(token));
    if (resp.status === 401) { container.innerHTML = '<div class="result error">\u672a\u6388\u6743\uff0c\u8bf7\u5237\u65b0\u9875\u9762\u91cd\u65b0\u767b\u5f55</div>'; return; }
    const data = await resp.json();
    if (!data.logs || !data.logs.length) { container.innerHTML = '<div class="empty-state"><p>\u6682\u65e0\u65e5\u5fd7</p></div>'; return; }
    let html = '<table><thead><tr><th>\u65f6\u95f4</th><th>Mod</th><th>\u7248\u672c</th><th>\u5f02\u5e38</th><th>\u6b21\u6570</th></tr></thead><tbody>';
    for (const log of data.logs) {
      html += '<tr data-hash="'+htm(log.hash)+'" class="log-row" style="cursor:pointer;">' +
        '<td style="white-space:nowrap;font-size:0.75rem;color:#94a3b8;">'+new Date(log.created_at).toLocaleString()+'</td>' +
        '<td><span class="tag">'+htm(log.mod_id)+'</span></td>' +
        '<td>'+htm(log.mod_version)+'</td>' +
        '<td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+htm(log.error_message)+'">'+htm(log.error_message)+'</td>' +
        '<td>'+log.count+'</td></tr>';
    }
    html += '</tbody></table><p style="color:#64748b;font-size:0.75rem;margin-top:0.5rem;">\u5171 '+data.logs.length+' \u6761\u8bb0\u5f55\u3002\u70b9\u51fb\u884c\u67e5\u770b\u8be6\u60c5\u3002</p>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<div class="result error">\u52a0\u8f7d\u5931\u8d25: '+e.message+'</div>'; }
}
</script>
</body>
</html>`;
	return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export function renderAdminPage(env: Env, authed: boolean, token: string, request: Request): Response {
	const cfEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
	const isAuthed = authed || !!cfEmail;
	const hasAnyAuth = !!env.ADMIN_KEY || !!cfEmail;
	const content = !hasAnyAuth && !token ? DISABLED_PAGE : (isAuthed ? DASHBOARD_PAGE : LOGIN_PAGE);
	return renderHtml(content, token);
}
