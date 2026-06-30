import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import LogBrowser from "./pages/LogBrowser";
import LogDetail from "./pages/LogDetail";
import Members from "./pages/Members";
import Profile from "./pages/Profile";
import { type ReactNode } from "react";

function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
	const { user, loading } = useAuth();
	if (loading) return <p style={{ color: "#94a3b8", padding: "2rem" }}>Loading...</p>;
	if (!user) return <Navigate to="/admin/login" replace />;
	if (adminOnly && user.role !== "admin") return <Navigate to="/admin/browse" replace />;
	return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
	const { user, loading } = useAuth();
	if (loading) return null;
	if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/admin/browse"} replace />;
	return <>{children}</>;
}

export default function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<Routes>
					<Route path="/admin/login" element={<GuestRoute><Login /></GuestRoute>} />
					<Route path="/admin/register" element={<GuestRoute><Register /></GuestRoute>} />

					<Route element={<Layout />}>
						<Route path="/admin" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
						<Route path="/admin/browse" element={<ProtectedRoute><LogBrowser /></ProtectedRoute>} />
						<Route path="/admin/logs" element={<ProtectedRoute><LogDetail /></ProtectedRoute>} />
						<Route path="/admin/users" element={<ProtectedRoute adminOnly><Members /></ProtectedRoute>} />
						<Route path="/admin/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
					</Route>
				</Routes>
			</AuthProvider>
		</BrowserRouter>
	);
}
