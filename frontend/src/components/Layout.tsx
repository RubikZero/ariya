import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { useLocale, LOCALES, LANG_LABELS } from "../locale";

export function Layout() {
	const { user, logout } = useAuth();
	const loc = useLocation();
	const role = user?.role || "member";
	const [collapsed, setCollapsed] = useState(false);
	const { t, lang: currentLang, setLocale } = useLocale();

	const isActive = (path: string) => {
		if (path === "/admin") return loc.pathname === "/admin";
		return loc.pathname.startsWith(path);
	};
	const w = collapsed ? 48 : 200;

	return (
		<div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-dark)", color: "var(--text-primary)" }}>
			<nav style={{ width: w, minWidth: w, background: "var(--bg-mid)", borderRight: "1px solid var(--border-color)", padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem", transition: "width 0.15s", overflow: "hidden" }}>
				<button onClick={() => setCollapsed(!collapsed)} className="btn btn-secondary" style={{ width: "100%", padding: "0.25rem", fontSize: "1rem", marginBottom: "0.5rem", textAlign: "center" }}>
					{collapsed ? "\u25b6" : "\u2630"}
				</button>
				{role === "admin" && <SidebarLink to="/admin" label={t("nav.dashboard")} active={isActive("/admin")} collapsed={collapsed} />}
				<SidebarLink to="/admin/browse" label={t("nav.browse")} active={isActive("/admin/browse")} collapsed={collapsed} />
				<SidebarLink to="/admin/profile" label={t("nav.profile")} active={isActive("/admin/profile")} collapsed={collapsed} />
				{role === "admin" && <SidebarLink to="/admin/users" label={t("nav.members")} active={isActive("/admin/users")} collapsed={collapsed} />}
				<div style={{ marginTop: "auto" }}>
					<button onClick={logout} className="btn btn-secondary" style={{ width: "100%", padding: "0.25rem", fontSize: collapsed ? "0.75rem" : "0.875rem", whiteSpace: "nowrap" }}>
						{collapsed ? "\u23fb" : t("nav.logout")}
					</button>
				</div>
			</nav>
			<main style={{ flex: 1, padding: "1.5rem", overflowX: "auto" }}>
				<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
					<select value={currentLang} onChange={(e) => setLocale(e.target.value)}
						style={{ padding: "0.375rem 0.75rem", background: "var(--bg-deep)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "0.375rem", fontSize: "0.8125rem", cursor: "pointer" }}>
						{LOCALES.map((code) => (
							<option key={code} value={code}>{LANG_LABELS[code]}</option>
						))}
					</select>
				</div>
				<Outlet />
			</main>
		</div>
	);
}

function SidebarLink({ to, label, active, collapsed }: { to: string; label: string; active: boolean; collapsed: boolean }) {
	return (
		<Link to={to} style={{
			display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: "0.5rem",
			padding: collapsed ? "0.5rem 0" : "0.5rem", borderRadius: "0.375rem",
			color: active ? "var(--accent-primary)" : "var(--text-secondary)",
			textDecoration: "none", fontSize: "0.875rem",
			background: active ? "rgba(59,130,246,0.1)" : "transparent",
		}}>
			{collapsed ? label.slice(0, 2) : label}
		</Link>
	);
}
