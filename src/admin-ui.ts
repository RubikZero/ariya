import type { Env } from "./index.js";
import { t, langStrings, LANGUAGES, type Lang } from "./strings.js";

export const STYLE = `
* { margin:0;padding:0;box-sizing:border-box; }
body { font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; background:#0f172a; color:#e2e8f0; line-height:1.6; }
header { background:linear-gradient(135deg,#1e293b,#334155); padding:1rem 1.5rem; border-bottom:1px solid #475569; }
header h1 { font-size:1.25rem; font-weight:700; color:#f8fafc; }
header p { font-size:0.8125rem; color:#94a3b8; margin-top:0.125rem; }
.layout { display:flex; gap:0; min-height:calc(100vh - 73px); }
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
.sidebar { width:200px; min-width:200px; background:#1e293b; border-right:1px solid #334155; padding:1rem; display:flex; flex-direction:column; gap:0.25rem; }
.sidebar.collapsed { width:48px; min-width:48px; }
.sidebar .nav-item { display:flex; align-items:center; gap:0.5rem; padding:0.5rem; border-radius:0.375rem; color:#94a3b8; text-decoration:none; font-size:0.875rem; cursor:pointer; }
.sidebar .nav-item:hover { background:#334155; color:#e2e8f0; }
.sidebar .nav-item.active { background:#3b82f6; color:#fff; }
.sidebar .nav-icon { font-size:1rem; width:1.25rem; text-align:center; flex-shrink:0; }
.sidebar .nav-label { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sidebar.collapsed .nav-label { display:none; }
.sidebar .toggle-btn { background:none; border:none; color:#64748b; cursor:pointer; font-size:1rem; padding:0.25rem; border-radius:0.25rem; margin-bottom:0.5rem; text-align:center; width:100%; }
.sidebar .toggle-btn:hover { background:#334155; color:#e2e8f0; }
.sidebar.collapsed .nav-item { justify-content:center; padding:0.5rem 0; gap:0; }
.ag-theme-alpine-dark { --ag-background-color: #1e293b; --ag-odd-row-background-color: #1a2235; --ag-header-background-color: #0f172a; --ag-border-color: #334155; --ag-row-hover-color: #334155; --ag-selected-row-background-color: #3b82f6; --ag-font-size: 12px; --ag-header-font-size: 11px; height: auto; min-height: 200px; }
.ag-theme-alpine-dark .ag-cell { display:flex; align-items:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ag-theme-alpine-dark .ag-row { cursor:pointer; }
.sidebar.collapsed .nav-item:hover { padding:0.5rem 0; }
.content { flex:1; padding:1.5rem; overflow-x:auto; }
th { position:relative; user-select:none; }
.resizer { position:absolute; right:0; top:0; bottom:0; width:5px; cursor:col-resize; z-index:1; }

`;

const DISABLED_PAGE = (lang: Lang) => `
<div class="card" style="max-width:480px;margin:4rem auto;">
  <h2>${htm(t("admin.disabled.title", lang))}</h2>
  <p style="color:#94a3b8;font-size:0.875rem;margin-top:0.5rem;">
    ${t("admin.disabled.text", lang)}<br/><br/>
    <strong>${t("admin.disabled.method1", lang)}</strong><br/>
    ${t("admin.disabled.method1.desc", lang)}<br/><br/>
    <strong>${t("admin.disabled.method2", lang)}</strong><br/>
    ${htm(t("admin.disabled.method2.desc", lang))}
  </p>
</div>`;

const LOGIN_PAGE = (lang: Lang) => `
<div class="card" style="max-width:480px;margin:4rem auto;">
  <h2>${htm(t("admin.login.title", lang))}</h2>
  <p style="color:#94a3b8;font-size:0.875rem;margin-bottom:1.5rem;">${htm(t("admin.login.desc", lang))}</p>
  <label>${htm(t("admin.login.username", lang))}</label>
  <input type="text" id="login-username" placeholder="${htm(t("admin.login.username", lang))}" autocomplete="username" />
  <label>${htm(t("admin.login.password", lang))}</label>
  <input type="password" id="login-password" placeholder="${htm(t("admin.login.password", lang))}" autocomplete="current-password" />
  <button class="btn-primary" onclick="login()" style="width:100%;">${htm(t("admin.login.btn", lang))}</button>
  <div class="result" id="login-result"></div>
</div>`;

const DASHBOARD_PAGE = (lang: Lang) => `
<div class="card">
  <h2>${htm(t("admin.dashboard.key.title", lang))}</h2>
  <p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:1rem;">${htm(t("admin.dashboard.key.desc", lang))}</p>
  <div class="key-display">
    <input type="text" id="generated-key" readonly placeholder="${htm(t("admin.dashboard.key.placeholder", lang))}" />
    <button class="btn-primary" onclick="generateKey()">${htm(t("admin.dashboard.key.generate", lang))}</button>
    <button class="btn-secondary" onclick="copyKey()">${htm(t("admin.dashboard.key.copy", lang))}</button>
    <span class="copy-msg" id="copy-msg">${htm(t("admin.dashboard.key.copied", lang))}</span>
  </div>
  <div id="key-usage" style="display:none;margin-top:1rem;border-top:1px solid #334155;padding-top:1rem;">
    <p style="color:#f1f5f9;font-weight:600;margin-bottom:0.75rem;">${htm(t("admin.dashboard.key.usage.title", lang))}</p>
    <div style="margin-bottom:1rem;">
      <p style="color:#93c5fd;font-weight:500;margin-bottom:0.375rem;">${htm(t("admin.dashboard.key.step1", lang))}</p>
      <p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:0.25rem;">${htm(t("admin.dashboard.key.step1.local", lang))}</p>
      <div style="background:#0f172a;padding:0.75rem;border-radius:0.375rem;font-size:0.8125rem;font-family:monospace;margin-bottom:0.5rem;">HMAC_SECRET_KEY=<span id="usage-key-local"></span></div>
      <p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:0.25rem;">${htm(t("admin.dashboard.key.step1.prod", lang))}</p>
      <div style="background:#0f172a;padding:0.75rem;border-radius:0.375rem;font-size:0.8125rem;font-family:monospace;margin-bottom:0.25rem;">npx wrangler secret put HMAC_SECRET_KEY</div>
      <p style="color:#64748b;font-size:0.75rem;">${htm(t("admin.dashboard.key.step1.hint", lang))}</p>
    </div>
    <div style="margin-bottom:1rem;">
      <p style="color:#93c5fd;font-weight:500;margin-bottom:0.375rem;">${htm(t("admin.dashboard.key.step2", lang))}</p>
      <p style="color:#94a3b8;font-size:0.8125rem;">${htm(t("admin.dashboard.key.step2.desc", lang))}</p>
    </div>
    <div>
      <p style="color:#93c5fd;font-weight:500;margin-bottom:0.375rem;">${htm(t("admin.dashboard.key.step3", lang))}</p>
      <p style="color:#94a3b8;font-size:0.8125rem;">${htm(t("admin.dashboard.key.step3.desc", lang))}</p>
    </div>
  </div>
</div>

<div class="card">
  <h2>${htm(t("admin.dashboard.test.title", lang))}</h2>
  <p style="color:#94a3b8;font-size:0.8125rem;margin-bottom:1rem;">${htm(t("admin.dashboard.test.desc", lang))}</p>
  <label>${htm(t("admin.dashboard.test.key_label", lang))}</label>
  <input type="text" id="test-key" placeholder="${htm(t("admin.dashboard.test.key_placeholder", lang))}" />
  <label>${htm(t("admin.dashboard.test.url_label", lang))}</label>
  <input type="text" id="test-url" placeholder="${htm(t("admin.dashboard.test.url_placeholder", lang))}" />
  <button class="btn-success" onclick="testSubmit()">${htm(t("admin.dashboard.test.btn", lang))}</button>
  <div class="result" id="test-result"></div>
</div>

<div class="card">
  <h2>${htm(t("admin.dashboard.logs.title", lang))}</h2>
  <div id="logs-container"><div class="empty-state"><p>${htm(t("admin.dashboard.logs.btn", lang))}</p></div></div>
  <button class="btn-primary" onclick="loadLogs()">${htm(t("admin.dashboard.logs.btn", lang))}</button>
</div>`;

const GAME_STATE_KEYS: Record<string, string> = {
	"loc.language": "game_state.loc.language",
	"game.scene": "game_state.game.scene",
	"game.in_run": "game_state.game.in_run",
	"game.seed": "game_state.game.seed",
	"game.ascension": "game_state.game.ascension",
	"game.act": "game_state.game.act",
	"game.act_name": "game_state.game.act_name",
	"game.floor": "game_state.game.floor",
	"game.mode": "game_state.game.mode",
	"game.room_type": "game_state.game.room_type",
	"game.event": "game_state.game.event",
	"game.characters": "game_state.game.characters",
	"game.player_count": "game_state.game.player_count",
	"combat.encounter": "game_state.combat.encounter",
	"combat.round": "game_state.combat.round",
	"combat.enemy_count": "game_state.combat.enemy_count",
	"combat.enemies": "game_state.combat.enemies",
	"combat.player_hp": "game_state.combat.player_hp",
	"collect.exception": "game_state.collect.exception",
};

const SCENE_KEYS: Record<string, string> = {
	"MainMenu": "scene.MainMenu",
	"LogoAnimation": "scene.LogoAnimation",
	"CombatRoom": "scene.CombatRoom",
	"MapRoom": "scene.MapRoom",
	"EventRoom": "scene.EventRoom",
	"RestSiteRoom": "scene.RestSiteRoom",
	"MerchantRoom": "scene.MerchantRoom",
	"TreasureRoom": "scene.TreasureRoom",
	"Run": "scene.Run",
};

function htm(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function readableGameState(jsonStr: string, lang: Lang): string {
	try {
		const data = JSON.parse(jsonStr);
		const lines: string[] = [];
		for (const [key, val] of Object.entries(data)) {
			const labelKey = GAME_STATE_KEYS[key];
			const label = labelKey ? t(labelKey, lang) : key;
			let displayVal = String(val);
			const sceneKey = SCENE_KEYS[displayVal];
			if (key === "game.scene" && sceneKey) {
				displayVal = t(sceneKey, lang);
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

function renderDetailPage(log: any, token: string, lang: Lang, from?: string): string {
	const time = new Date(log.created_at).toLocaleString();
	const gameStateHtml = readableGameState(log.game_state, lang);
	const stackLines = (log.stack_trace || "").split("\n").map((l: string) => htm(l)).join('</span><span class="stack-frame">');

	return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${htm(t("detail.page.title", lang))}</title>
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
<header style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
  <div>
    <a href="/${from === "browse" ? "admin/browse" : "admin"}?token=${encodeURIComponent(token)}&lang=${lang}" class="back-link">\u2190 ${htm(t(from === "browse" ? "detail.back_browse" : "detail.back", lang))}</a>
    <h1>${htm(t("detail.page.heading", lang))}</h1>
  </div>
  <select onchange="var q=location.search;if(q.match(/lang=[^&]+/)){location.search=q.replace(/lang=[^&]+/,'lang='+this.value)}else{location.search=q+(q?'&':'?')+'lang='+this.value}" style="background:#0f172a;color:#e2e8f0;border:1px solid #475569;border-radius:0.375rem;padding:0.375rem 0.75rem;font-size:0.8125rem;cursor:pointer;">
    <option value="zh-CN" ${lang === "zh-CN" ? "selected" : ""}>中文</option>
    <option value="en" ${lang === "en" ? "selected" : ""}>English</option>
  </select>
</header>
<main>
	<div class="card">
		<h2>${htm(t("detail.basic_info", lang))}</h2>
		<div class="detail-grid">
			<span class="label">${htm(t("detail.time", lang))}</span><span class="value">${htm(time)}</span>
			<span class="label">${htm(t("detail.mod", lang))}</span><span class="value"><code>${htm(log.mod_id)}</code></span>
			<span class="label">${htm(t("detail.version", lang))}</span><span class="value">${htm(log.mod_version)}</span>
			${log.game_version ? `<span class="label">${htm(t("detail.game_version", lang))}</span><span class="value">${htm(log.game_version)}</span>` : ""}
			<span class="label">${htm(t("detail.error_count", lang))}</span><span class="value">${log.count}</span>
			<span class="label">${htm(t("detail.os", lang))}</span><span class="value">${htm(log.player_os)}</span>
			${log.os_version ? `<span class="label">${htm(t("detail.os_version", lang))}</span><span class="value">${htm(log.os_version)}</span>` : ""}
			<span class="label">${htm(t("detail.hash", lang))}</span><span class="value" style="font-family:monospace;font-size:0.75rem;color:#64748b;">${htm(log.hash)}</span>
		</div>
	</div>
	<div class="card">
		<h2>${htm(t("detail.error_info", lang))}</h2>
		<pre><span class="stack-frame">${stackLines}</span></pre>
	</div>
	<div class="card">
		<h2>${htm(t("detail.game_state", lang))}</h2>
		${gameStateHtml}
	</div>
</main>
</body>
</html>`;
}

function sidebarHtml(lang: Lang, token: string, page: string): string {
	return `<div class="sidebar" id="sidebar">
  <button class="toggle-btn" onclick="toggleSidebar()">\u2630</button>
  <a href="/admin?token=${encodeURIComponent(token)}&lang=${lang}" class="nav-item ${page === "dashboard" ? "active" : ""}">
    <span class="nav-icon">\u2302</span><span class="nav-label">${htm(t("admin.nav.dashboard", lang))}</span>
  </a>
  <a href="/admin/browse?token=${encodeURIComponent(token)}&lang=${lang}" class="nav-item ${page === "browse" ? "active" : ""}">
    <span class="nav-icon">\u2637</span><span class="nav-label">${htm(t("admin.nav.browse", lang))}</span>
  </a>
</div>`;
}

function renderHtml(content: string, token: string, lang: Lang, authed: boolean = false, page: string = ""): Response {
	const tokenJs = token ? JSON.stringify(token) : "null";
	const ls = langStrings(lang);
	const langJs = JSON.stringify(ls);
	const mainContent = authed
		? `<div class="layout">${sidebarHtml(lang, token, page)}<main class="content">${content}</main></div>`
		: `<main style="max-width:480px;margin:4rem auto;padding:0 1rem;">${content}</main>`;
	const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${htm(t("admin.page.title", lang))}</title>
<link href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.3.1/dist/styles/ag-grid.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/ag-grid-community@31.3.1/dist/styles/ag-theme-alpine-dark.min.css" rel="stylesheet">
<style>${STYLE}</style>
</head>
<body>
<header style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
  <div>
    <h1>Ariya</h1>
    <p>${htm(t("admin.page.subtitle", lang))}</p>
  </div>
  <select onchange="switchLang(this.value)" style="background:#0f172a;color:#e2e8f0;border:1px solid #475569;border-radius:0.375rem;padding:0.375rem 0.75rem;font-size:0.8125rem;cursor:pointer;">${LANGUAGES.map(l => `<option value="${l.code}" ${lang === l.code ? "selected" : ""}>${htm(l.name)}</option>`).join("")}</select>
</header>
${mainContent}
<script src="https://cdn.jsdelivr.net/npm/ag-grid-community@31.3.1/dist/ag-grid-community.min.js"></script>
<script>
const TOKEN = ${tokenJs};
const LANG = ${langJs};
function s(key) { return LANG[key] || key; }
function toggleSidebar() { document.getElementById("sidebar").classList.toggle("collapsed"); }
document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("test-url");
  if (urlInput && !urlInput.value) urlInput.value = window.location.origin;
});

async function login() {
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const result = document.getElementById("login-result");
  if (!username || !password) { result.className = "result error"; result.textContent = s("admin.login.required"); return; }
  result.className = "result info";
  result.textContent = s("admin.login.loading");
  try {
    const resp = await fetch("/admin/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username,password}) });
    const data = await resp.json();
    if (resp.ok) { sessionStorage.setItem("ariya_token", data.token); location.href = "/admin?token=" + encodeURIComponent(data.token); }
    else { result.className = "result error"; result.textContent = data.error || s("admin.login.fail"); }
  } catch(e) { result.className = "result error"; result.textContent = s("error.network").replace("{msg}", e.message); }
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
function switchLang(lang) {
  var u = new URL(window.location.href);
  u.searchParams.set("lang", lang);
  sessionStorage.setItem("ariya_lang", lang);
  location.href = u.toString();
}
var savedLang = sessionStorage.getItem("ariya_lang");
if (savedLang && !window.location.search.includes("lang=")) {
  var u = new URL(window.location.href);
  u.searchParams.set("lang", savedLang);
  location.href = u.toString();
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
  if (!key) { result.className = "result error"; result.textContent = s("admin.dashboard.test.key_required"); return; }
  result.className = "result info"; result.textContent = s("admin.dashboard.test.signing");
  var p = {};
  p.mod_id = "sts2-mod-example";
  p.mod_version = "1.0.0";
  p.game_version = "2.0";
  p.error_message = s("admin.dashboard.test.ok") + " - " + new Date().toISOString();
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
    result.textContent = s("admin.dashboard.test.sending");
    const resp = await fetch(url, { method:"POST", headers:{"Content-Type":"application/json","X-Mod-Signature":signature}, body:payload });
    const text = await resp.text();
    result.className = resp.ok ? "result success" : "result error";
    result.textContent = (resp.ok ? s("admin.dashboard.test.ok") + ": " : s("admin.dashboard.test.err") + ": " + resp.status + " ") + text;
  } catch(e) { result.className = "result error"; result.textContent = s("error.network").replace("{msg}", e.message); }
}
function viewLog(hash, from, lang) {
  var t = TOKEN || sessionStorage.getItem("ariya_token") || "";
  if (!lang) lang = (document.getElementById("lang-select") || {}).value || (location.href.match(/[?&]lang=([^&]+)/) || [])[1] || "";
  var url = "/admin/logs?hash=" + encodeURIComponent(hash) + "&token=" + encodeURIComponent(t);
  if (lang) url += "&lang=" + encodeURIComponent(lang);
  if (from) url += "&from=" + encodeURIComponent(from);
  location.href = url;
}
document.addEventListener("DOMContentLoaded", function() {
  document.addEventListener("click", function(e) {
    var row = e.target.closest(".log-row");
    if (row) {
      var hash = row.getAttribute("data-hash");
      var from = row.getAttribute("data-from") || "";
      var lang = row.getAttribute("data-lang") || "";
      viewLog(hash, from, lang);
    }
  });
});

async function loadLogs() {
  const container = document.getElementById("logs-container");
  container.innerHTML = '<div class="empty-state"><p>' + s("admin.dashboard.logs.loading") + '</p></div>';
  const token = TOKEN || sessionStorage.getItem("ariya_token") || "";
  try {
    const resp = await fetch("/admin/logs?token="+encodeURIComponent(token));
    if (resp.status === 401) { container.innerHTML = '<div class="result error">' + s("admin.dashboard.logs.unauthorized") + '</div>'; return; }
    const data = await resp.json();
    if (!data.logs || !data.logs.length) { container.innerHTML = '<div class="empty-state"><p>' + s("admin.dashboard.logs.empty") + '</p></div>'; return; }
    let h = '<table><thead><tr><th>' + s("admin.dashboard.logs.col_time") + '</th><th>' + s("admin.dashboard.logs.col_mod") + '</th><th>' + s("admin.dashboard.logs.col_version") + '</th><th>' + s("admin.dashboard.logs.col_error") + '</th><th>' + s("admin.dashboard.logs.col_count") + '</th></tr></thead><tbody>';
    for (const log of data.logs) {
      h += '<tr data-hash="'+htm(log.hash)+'" class="log-row" style="cursor:pointer;">' +
        '<td style="white-space:nowrap;font-size:0.75rem;color:#94a3b8;">'+new Date(log.created_at).toLocaleString()+'</td>' +
        '<td><span class="tag">'+htm(log.mod_id)+'</span></td>' +
        '<td>'+htm(log.mod_version)+'</td>' +
        '<td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+htm(log.error_message)+'">'+htm(log.error_message)+'</td>' +
        '<td>'+log.count+'</td></tr>';
    }
    h += '</tbody></table><p style="color:#64748b;font-size:0.75rem;margin-top:0.5rem;">' + s("admin.dashboard.logs.total").replace("{count}", data.logs.length) + '</p>';
    container.innerHTML = h;
  } catch(e) { container.innerHTML = '<div class="result error">' + s("error.network").replace("{msg}", e.message) + '</div>'; }
}
async function loadBrowseData() {
  var container = document.getElementById("browse-container");
  if (!container) return;
  var token = TOKEN || sessionStorage.getItem("ariya_token") || "";
  var savedSize = parseInt(sessionStorage.getItem("browse_page_size") || "20");
  if (isNaN(savedSize) || savedSize < 10) savedSize = 20;

  container.innerHTML = '<div class="empty-state"><p>' + s("admin.browse.loading") + '</p></div>';

  if (typeof agGrid === "undefined") {
    container.innerHTML = '<div class="result error">AG Grid library failed to load</div>';
    return;
  }

  var gridDiv = document.createElement("div");
  gridDiv.id = "browse-grid";
  gridDiv.className = "ag-theme-alpine-dark";
  gridDiv.style.width = "100%";
  gridDiv.style.minHeight = "300px";
  container.innerHTML = "";
  container.appendChild(gridDiv);

  var api = null;
  var gridOptions = {
    columnDefs: [
      {field:"time", headerName:s("admin.browse.col_time"), width:140, sortable:true, cellRenderer:function(p){return p.value?new Date(p.value).toLocaleString():"";}},
      {field:"mod_id", headerName:s("admin.browse.col_mod"), width:90, sortable:true},
      {field:"mod_ver", headerName:s("admin.browse.col_version"), width:80, sortable:true},
      {field:"game_ver", headerName:s("admin.browse.col_game_version"), width:80, sortable:true},
      {field:"error", headerName:s("admin.browse.col_error"), flex:3, minWidth:80, tooltipField:"error"},
      {field:"stack", headerName:s("admin.browse.col_stack"), flex:3, minWidth:80, tooltipField:"stack"},
      {field:"state", headerName:s("admin.browse.col_state"), flex:2, minWidth:60, tooltipField:"state"},
      {field:"os", headerName:s("admin.browse.col_os"), width:80, sortable:true},
      {field:"os_ver", headerName:s("admin.browse.col_os_ver"), width:80, sortable:true},
      {field:"count", headerName:s("admin.browse.col_count"), width:60, sortable:true},
      {field:"hash", headerName:s("admin.browse.col_hash"), width:70, sortable:true}
    ],
    defaultColDef: { resizable: true },
    pagination: true,
    paginationPageSize: savedSize,
    paginationPageSizeSelector: [10, 20, 50],
    onPaginationChanged: function() {
      if (api) sessionStorage.setItem("browse_page_size", String(api.paginationGetPageSize()));
    },
    onRowClicked: function(event) {
      var d = event.data;
      if (d && d.id) viewLog(d.id, "browse", d._lang || "");
    },
    onGridReady: function(event) {
      api = event.api;
      var datasource = {
        getRows: function(params) {
          var size = params.endRow - params.startRow;
          var page = Math.floor(params.startRow / size) + 1;
          var sortStr = "";
          if (params.sortModel && params.sortModel.length) {
            sortStr = "&sort[0][field]=" + encodeURIComponent(params.sortModel[0].colId) + "&sort[0][dir]=" + encodeURIComponent(params.sortModel[0].sort);
          }
          fetch("/admin/browse?token=" + encodeURIComponent(token) + "&_ajax=1&page=" + page + "&size=" + size + sortStr)
            .then(function(r){ return r.json(); })
            .then(function(data) {
              params.successCallback(data.data || [], data.total || 0);
            })
            .catch(function() { params.failCallback(); });
        }
      };
      event.api.setGridOption("serverSideDatasource", datasource);
      event.api.setGridOption("rowModelType", "serverSide");
    }
  };
  new agGrid.Grid(gridDiv, gridOptions);
}
document.addEventListener("DOMContentLoaded", function() {
  if (document.getElementById("browse-container")) loadBrowseData();
});
</script>
</body>
</html>`;
	return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function validLang(lang: string): Lang {
	return LANGUAGES.some(l => l.code === lang) ? lang as Lang : "zh-CN" as Lang;
}

export function renderAdminPage(env: Env, authed: boolean, token: string, request: Request, lang: string = "zh-CN"): Response {
	const cfEmail = request.headers.get("Cf-Access-Authenticated-User-Email");
	const isAuthed = authed || !!cfEmail;
	const hasAnyAuth = !!env.ADMIN_KEY || !!cfEmail;
	const l = validLang(lang);
	const content = !hasAnyAuth && !token ? DISABLED_PAGE(l) : (isAuthed ? DASHBOARD_PAGE(l) : LOGIN_PAGE(l));
	return renderHtml(content, token, l, isAuthed, "dashboard");
}

export function renderBrowsePage(token: string, lang: string = "zh-CN"): Response {
	const l = validLang(lang);
	const content = `<div class="card"><h2>${htm(t("admin.browse.title", l))}</h2>
<div id="browse-container"><div class="empty-state"><p>${htm(t("admin.browse.loading", l))}</p></div></div></div>`;
	return renderHtml(content, token, l, true, "browse");
}

export { renderDetailPage };
