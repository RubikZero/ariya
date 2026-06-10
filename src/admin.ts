const STYLE = `
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
</div>
`;

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
</div>
`;

function htm(s: string): string {
	return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

async function hmacSign(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	return new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
}

async function hmacVerify(keyBytes: Uint8Array, sig: Uint8Array, data: Uint8Array): Promise<boolean> {
	const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
	return crypto.subtle.verify("HMAC", key, sig, data);
}

export async function createSessionToken(username: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const expiry = Date.now() + 86400000;
	const payload = username + "|" + expiry;
	const sig = await hmacSign(encoder.encode(secret), encoder.encode(payload));
	const sigBase64 = btoa(String.fromCharCode(...sig));
	return btoa(username) + "." + btoa(String(expiry)) + "." + sigBase64;
}

export async function verifySessionToken(token: string, secret: string): Promise<string | null> {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;
		const username = atob(parts[0]);
		const expiry = parseInt(atob(parts[1]));
		if (Date.now() > expiry) return null;
		const payload = username + "|" + expiry;
		const encoder = new TextEncoder();
		const sigBytes = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
		const valid = await hmacVerify(encoder.encode(secret), sigBytes, encoder.encode(payload));
		return valid ? username : null;
	} catch { return null; }
}

export async function handleRegisterAdmin(env: Env, body: { username?: string; password?: string }): Promise<Response> {
	if (!body.username || !body.password) {
		return new Response(JSON.stringify({ error: "Missing username or password" }), { status: 400 });
	}
	if (body.username.length < 2 || body.password.length < 6) {
		return new Response(JSON.stringify({ error: "Username min 2 chars, password min 6 chars" }), { status: 400 });
	}
	// Only allow registration if no admins exist
	const existing = await env.DB.prepare("SELECT COUNT(*) as count FROM admins").first<number>("count");
	if (existing && existing > 0) {
		return new Response(JSON.stringify({ error: "Admin already exists. Register disabled." }), { status: 403 });
	}
	const encoder = new TextEncoder();
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
	// PBKDF2 for password hashing
	const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(body.password + saltHex), "PBKDF2", false, ["deriveBits"]);
	const hashBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(saltHex), iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
	const hashHex = Array.from(new Uint8Array(hashBits)).map(b => b.toString(16).padStart(2, "0")).join("");
	await env.DB.prepare("INSERT INTO admins (username, password_hash) VALUES (?, ?)").bind(body.username, saltHex + ":" + hashHex).run();
	return new Response(JSON.stringify({ success: true, message: "Admin registered. You can now log in." }));
}

export async function handleLogin(env: Env, body: { username?: string; password?: string }): Promise<Response> {
	if (!body.username || !body.password) {
		return new Response(JSON.stringify({ error: "Missing username or password" }), { status: 400 });
	}
	const row = await env.DB.prepare("SELECT password_hash FROM admins WHERE username = ?").bind(body.username).first<{ password_hash: string }>("password_hash");
	if (!row) {
		return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
	}
	const [storedSalt, storedHash] = (row as any).toString().split(":");
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(body.password + storedSalt), "PBKDF2", false, ["deriveBits"]);
	const hashBits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: encoder.encode(storedSalt), iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
	const computedHash = Array.from(new Uint8Array(hashBits)).map(b => b.toString(16).padStart(2, "0")).join("");
	if (computedHash !== storedHash) {
		return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
	}
	const token = await createSessionToken(body.username, env.HMAC_SECRET_KEY);
	return new Response(JSON.stringify({ success: true, token }));
}

export function renderAdminPage(env: Env, authed: boolean, token: string, request: Request): Response {
	const cfEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
	const isAuthed = authed || !!cfEmail;
	const hasAnyAuth = !!env.ADMIN_KEY || !!cfEmail;
	// Check if any admins are registered (D1 auth mode)
	const content = !hasAnyAuth && !token ? DISABLED_PAGE : (isAuthed ? DASHBOARD_PAGE : LOGIN_PAGE);
	return renderHtml(content, env, token);
}

function renderHtml(content: string, env: Env, token: string): Response {
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
  if (!username || !password) { result.className = "result error"; result.textContent = "请输入用户名和密码"; return; }
  result.className = "result info";
  result.textContent = "登录中...";
  try {
    const resp = await fetch("/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username,password}) });
    const data = await resp.json();
    if (resp.ok) { sessionStorage.setItem("ariya_token", data.token); location.href = "/admin?token=" + encodeURIComponent(data.token); }
    else { result.className = "result error"; result.textContent = data.error || "登录失败"; }
  } catch(e) { result.className = "result error"; result.textContent = "网络错误: " + e.message; }
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
  if (!key) { result.className = "result error"; result.textContent = "请输入 HMAC 密钥"; return; }
  result.className = "result info"; result.textContent = "计算 HMAC 签名...";
  const payload = JSON.stringify({ mod_id:"sts2-mod-example", mod_version:"1.0.0", game_version:"2.0", error_message:"测试异常 - "+new Date().toISOString(), stack_trace:"at GameLogic.update (GameLogic.cs:123)\\nat GameManager.run (GameManager.cs:456)", game_state:"{\\"game.scene\\":\\"CombatRoom\\",\\"game.in_run\\":\\"true\\"}", player_os:navigator.platform||"Unknown", os_version:navigator.userAgent||"Unknown", created_at:Date.now() });
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name:"HMAC", hash:"SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
    const signature = btoa(String.fromCharCode(...new Uint8Array(sig)));
    result.textContent = "发送请求...";
    const resp = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json","X-Mod-Signature":signature}, body:payload });
    const text = await resp.text();
    result.className = resp.ok ? "result success" : "result error";
    result.textContent = (resp.ok ? "成功! " : "失败 (HTTP "+resp.status+") ") + "\\n" + text;
  } catch(e) { result.className = "result error"; result.textContent = "网络错误: "+e.message; }
}
async function loadLogs() {
  const container = document.getElementById("logs-container");
  container.innerHTML = '<div class="empty-state"><p>加载中...</p></div>';
  const token = TOKEN || sessionStorage.getItem("ariya_token") || "";
  try {
    const resp = await fetch("/admin/logs?token="+encodeURIComponent(token));
    if (resp.status === 401) { container.innerHTML = '<div class="result error">未授权，请刷新页面重新登录</div>'; return; }
    const data = await resp.json();
    if (!data.logs || !data.logs.length) { container.innerHTML = '<div class="empty-state"><p>暂无日志</p></div>'; return; }
    let html = '<table><thead><tr><th>时间</th><th>Mod</th><th>版本</th><th>异常</th><th>次数</th></tr></thead><tbody>';
    for (const log of data.logs) {
      html += '<tr><td style="white-space:nowrap;font-size:0.75rem;color:#94a3b8;">'+new Date(log.created_at).toLocaleString()+'</td><td><span class="tag">'+htm(log.mod_id)+'</span></td><td>'+htm(log.mod_version)+'</td><td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+htm(log.error_message)+'">'+htm(log.error_message)+'</td><td>'+log.count+'</td></tr>';
    }
    html += '</tbody></table><p style="color:#64748b;font-size:0.75rem;margin-top:0.5rem;">共 '+data.logs.length+' 条</p>';
    container.innerHTML = html;
  } catch(e) { container.innerHTML = '<div class="result error">加载失败: '+e.message+'</div>'; }
}
</script>
</body>
</html>`;
	return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function handleAdminLogs(env: Env): Promise<Response> {
	try {
		const result = await env.DB.prepare("SELECT hash, mod_id, mod_version, error_message, count, created_at FROM mod_errors ORDER BY created_at DESC LIMIT 50").all();
		return new Response(JSON.stringify({ logs: result.results }), { headers: { "Content-Type": "application/json" } });
	} catch (e: any) {
		return new Response(JSON.stringify({ error: e.message }), { status: 500 });
	}
}

import type { Env } from "./index.js";
