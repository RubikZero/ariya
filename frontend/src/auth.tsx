import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api, setToken, clearToken } from "./api";

export interface AuthUser {
	username: string;
	role: "admin" | "member";
	nickname?: string;
}

interface AuthContextType {
	user: AuthUser | null;
	loading: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api<{ user: AuthUser }>("/api/me").then((d) => setUser(d.user)).catch(() => {}).finally(() => setLoading(false));
	}, []);

	async function login(username: string, password: string) {
		const data = await api<{ token: string; role: string }>("/admin/login", {
			method: "POST",
			body: JSON.stringify({ username, password }),
		});
		setToken(data.token, true);
		setUser({ username, role: data.role as "admin" | "member" });
	}

	function logout() {
		clearToken();
		setUser(null);
		window.location.href = "/admin/login";
	}

	return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}
