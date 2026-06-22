import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth";

export function Layout() {
	const { user, logout } = useAuth();
	const loc = useLocation();
	const role = user?.role || "member";

	function isActive(path: string) {
		return loc.pathname === path || loc.pathname.startsWith(path + "/") ? "active" : "";
	}

	return (
		<div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", color: "#e2e8f0" }}>
			<nav style={{ width: 200, minWidth: 200, background: "#1e293b", borderRight: "1px solid #334155", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
				<div style={{ marginBottom: "0.5rem" }}>
					<h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc" }}>Ariya</h1>
				</div>
				{role === "admin" && (
					<Link to="/admin" className={isActive("/admin")} style={navLinkStyle}>
						Dashboard
					</Link>
				)}
				<Link to="/admin/browse" className={isActive("/admin/browse")} style={navLinkStyle}>
					Log Browser
				</Link>
				<Link to="/admin/profile" className={isActive("/admin/profile")} style={navLinkStyle}>
					Profile
				</Link>
				{role === "admin" && (
					<Link to="/admin/users" className={isActive("/admin/users")} style={navLinkStyle}>
						Members
					</Link>
				)}
				<div style={{ marginTop: "auto" }}>
					<button onClick={logout} style={{ ...btnStyle, width: "100%", marginTop: "0.5rem" }}>Logout</button>
				</div>
			</nav>
			<main style={{ flex: 1, padding: "1.5rem", overflowX: "auto" }}>
				<Outlet />
			</main>
		</div>
	);
}

const navLinkStyle: React.CSSProperties = {
	display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem",
	borderRadius: "0.375rem", color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", cursor: "pointer",
};

const btnStyle: React.CSSProperties = {
	padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: 500, border: "none",
	borderRadius: "0.375rem", cursor: "pointer", background: "#475569", color: "#e2e8f0",
};
