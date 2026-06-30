import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
				miniflare: {
					compatibilityFlags: ["nodejs_compat"],
					compatibilityDate: "2026-06-10",
					bindings: {
						HMAC_SECRET_KEY: "test-secret",
						TIMEOUT: 300,
					},
				},
			},
		},
	},
});
