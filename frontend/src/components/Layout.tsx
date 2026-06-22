import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { t, setLocale } from "../locale";

export function Layout() {
	const { user, logout } = useAuth();
	const loc = useLocation();
	const role = user?.role || "member";

	const isActive = (path: string) =>
		loc.pathname === path || loc.pathname.startsWith(path + "/") ? "active" : "";

	const currentLang = localStorage.getItem("ariya_locale") || (navigator.language?.startsWith("zh") ? "zh-CN" : "en");

	return (
		<div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-dark)", color: "var(--text-primary)" }}>
			<nav style={{ width: 200, minWidth: 200, background: "var(--bg-mid)", borderRight: "1px solid var(--border-color)", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
				<h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Ariya</h1>
				{role === "admin" && <SidebarLink to="/admin" label={t("nav.dashboard")} active={isActive("/admin")} />}
				<SidebarLink to="/admin/browse" label={t("nav.browse")} active={isActive("/admin/browse")} />
				<SidebarLink to="/admin/profile" label={t("nav.profile")} active={isActive("/admin/profile")} />
				{role === "admin" && <SidebarLink to="/admin/users" label={t("nav.members")} active={isActive("/admin/users")} />}
				<div style={{ marginTop: "auto" }}>
					<select value={currentLang} onChange={(e) => setLocale(e.target.value)}
						style={{ width: "100%", padding: "0.375rem 0.5rem", background: "var(--bg-deep)", color: "var(--text-primary)", border: "1px solid var(--border-color)", borderRadius: "0.375rem", fontSize: "0.8125rem", cursor: "pointer" }}>
						<option value="zh-CN">中文</option>
						<option value="en">English</option>
					</select>
					<button onClick={logout} className="btn btn-secondary" style={{ width: "100%", marginTop: "0.5rem" }}>{t("nav.logout")}</button>
				</div>
			</nav>
			<main style={{ flex: 1, padding: "1.5rem", overflowX: "auto" }}>
				<Outlet />
			</main>
		</div>
	);
}

function SidebarLink({ to, label, active }: { to: string; label: string; active: string }) {
	return (
		<Link to={to} style={{
			display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem",
			borderRadius: "0.375rem", color: active ? "var(--accent-primary)" : "var(--text-secondary)",
			textDecoration: "none", fontSize: "0.875rem", background: active ? "rgba(59,130,246,0.1)" : "transparent",
		}}>
			{label}
		</Link>
	);
}
