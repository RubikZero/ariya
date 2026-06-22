const BASE = "";

function getToken(): string {
	const stored = localStorage.getItem("ariya_token")
		|| sessionStorage.getItem("ariya_token")
		|| document.cookie.match(/(?:^|;\s*)ariya_token=([^;]*)/)?.[1]
		|| "";
	return stored;
}

export function setToken(token: string, persist = false) {
	if (persist) localStorage.setItem("ariya_token", token);
	else sessionStorage.setItem("ariya_token", token);
	document.cookie = `ariya_token=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
}

export function clearToken() {
	localStorage.removeItem("ariya_token");
	sessionStorage.removeItem("ariya_token");
	document.cookie = "ariya_token=; path=/; max-age=0";
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
	const token = getToken();
	const headers: Record<string, string> = { ...(options.headers as Record<string, string> || {}) };
	if (token) headers["Authorization"] = `Bearer ${token}`;
	if (!headers["Content-Type"] && options.body) headers["Content-Type"] = "application/json";
	const resp = await fetch(BASE + path, { ...options, headers });
	if (resp.status === 401) {
		clearToken();
		window.location.href = "/";
		throw new Error("Unauthorized");
	}
	if (!resp.ok) {
		const err = await resp.json().catch(() => ({ error: resp.statusText }));
		throw new Error(err.error || "Request failed");
	}
	return resp.json();
}

export function apiUrl(path: string): string {
	const token = getToken();
	const sep = path.includes("?") ? "&" : "?";
	return BASE + path + sep + "token=" + encodeURIComponent(token);
}
