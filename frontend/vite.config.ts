import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	base: "/admin/",
	plugins: [react()],
	server: {
		port: 5173,
		proxy: {
			"/api": { target: "http://localhost:8787", changeOrigin: true },
			"/admin": {
				target: "http://localhost:8787",
				changeOrigin: true,
				bypass: (req) => {
					// Let Vite handle SPA page navigations
					if (req.headers.accept?.includes("text/html")) return req.url;
				},
			},
		},
	},
});
