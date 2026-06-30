#!/usr/bin/env node

import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const MODE_DEV_ONLY = process.argv.includes("dev");

function run(cmd, args, options = {}) {
	console.log(`\n> ${cmd} ${args.join(" ")}`);
	const result = spawnSync(cmd, args, {
		cwd: ROOT,
		stdio: "inherit",
		...options,
	});
	if (result.status !== 0) {
		console.error(`\n❌ 命令失败: ${cmd} ${args.join(" ")}`);
		process.exit(1);
	}
	return result;
}

function runCapture(cmd, args) {
	console.log(`\n> ${cmd} ${args.join(" ")}`);
	const result = spawnSync(cmd, args, {
		cwd: ROOT,
		encoding: "utf-8",
		stdio: ["pipe", "pipe", "pipe"],
	});
	if (result.status !== 0) {
		console.error(`\n❌ 命令失败: ${cmd} ${args.join(" ")}`);
		console.error(result.stderr);
		process.exit(1);
	}
	return result.stdout.trim();
}

function question(prompt) {
	return new Promise((resolve) => {
		const rl = createInterface({ input: process.stdin, output: process.stdout });
		rl.question(prompt, (answer) => {
			rl.close();
			resolve(answer);
		});
	});
}

async function main() {
	const modeLabel = MODE_DEV_ONLY ? "本地开发环境" : "完整部署";
	console.log(`
╔══════════════════════════════════════════╗
║        Ariya - 部署向导 (${modeLabel})    ║
║  Slay the Spire 2 Mod 日志收集平台       ║
╚══════════════════════════════════════════╝
`);

	// --- Prerequisites ---
	const hasWrangler = spawnSync("npx", ["wrangler", "--version"], {
		cwd: ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"],
	});
	if (hasWrangler.status !== 0) {
		console.log("❌ 未检测到 wrangler，请先执行: npm install");
		process.exit(1);
	}
	console.log(`✅ wrangler ${hasWrangler.stdout.trim()}`);

	const whoami = spawnSync("npx", ["wrangler", "whoami"], {
		cwd: ROOT, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"],
	});
	if (whoami.status !== 0) {
		console.log("❌ 未登录 Cloudflare，请先执行: npx wrangler login");
		process.exit(1);
	}
	console.log(`✅ 已登录: ${whoami.stdout.split("\n")[0]?.trim() || "未知"}`);

	// ========================================
	// Phase 1: Local Development Environment
	// ========================================
	console.log(`\n${"═".repeat(50)}`);
	console.log("阶段一：本地开发环境");
	console.log(`${"═".repeat(50)}`);

	const hmacSecret = randomBytes(32).toString("hex");

	const devConfigPath = join(ROOT, "wrangler.dev.jsonc");
	const devConfigTemplatePath = join(ROOT, "wrangler.dev.jsonc.example");
	const devVarsPath = join(ROOT, ".dev.vars");

	if (existsSync(devConfigPath)) {
		console.log("\n✅ wrangler.dev.jsonc 已存在，跳过创建。");
	} else {
		const devDbName = "ariya-sts2-mod-logs-dev";

		// Try to find an existing dev D1 database first
		let dbId;
		try {
			const list = runCapture("npx", ["wrangler", "d1", "list", "--json"]);
			const dbs = JSON.parse(list);
			const existing = dbs.find((d) => d.name === devDbName);
			if (existing) {
				dbId = existing.uuid;
				console.log(`\n📦 使用已有的开发 D1 数据库 ${devDbName} (ID: ${dbId})`);
			}
		} catch {
			// ignore list errors, will create below
		}

		if (!dbId) {
			if (MODE_DEV_ONLY) {
				console.log(`\n📦 创建开发 D1 数据库 ${devDbName}...`);
			} else {
				const ans = await question(`\n📦 未找到开发 D1 数据库 ${devDbName}，是否创建？(Y/n): `);
				if (ans.toLowerCase() === "n") {
					console.log("   ⏭️  跳过开发环境配置。");
					return;
				}
			}

			let dbOutput;
			try {
				dbOutput = runCapture("npx", ["wrangler", "d1", "create", devDbName, "--json", "--experimental-backup"]);
			} catch {
				dbOutput = runCapture("npx", ["wrangler", "d1", "create", devDbName, "--json"]);
			}

			let dbJson;
			try {
				dbJson = JSON.parse(dbOutput);
			} catch {
				const match = dbOutput.match(/database_id\s*=\s*"([^"]+)"/);
				if (match) {
					dbJson = { uuid: match[1] };
				} else {
					console.error("❌ 无法解析 D1 数据库信息。");
					process.exit(1);
				}
			}

			dbId = dbJson.uuid || dbJson.result?.uuid;
			console.log(`   ✅ 开发数据库 ID: ${dbId}`);
		}

		// Generate wrangler.dev.jsonc from template
		if (!existsSync(devConfigTemplatePath)) {
			console.error("❌ 未找到 wrangler.dev.jsonc.example 模板文件");
			process.exit(1);
		}
		const template = readFileSync(devConfigTemplatePath, "utf-8");
		writeFileSync(devConfigPath, template.replace("__DEV_D1_DATABASE_ID__", dbId));
		console.log("   ✅ wrangler.dev.jsonc 已从模板生成（已加入 .gitignore，不会提交）");
	}

	// Write .dev.vars with HMAC secret
	if (!existsSync(devVarsPath)) {
		const devVars = [
			`HMAC_SECRET_KEY=${hmacSecret}`,
			"TIMEOUT=600",
		].join("\n") + "\n";
		writeFileSync(devVarsPath, devVars);
		console.log("   ✅ .dev.vars 已创建（HMAC_SECRET_KEY + TIMEOUT）");
	} else {
		const content = readFileSync(devVarsPath, "utf-8");
		if (!content.includes("HMAC_SECRET_KEY")) {
			writeFileSync(devVarsPath, content + `HMAC_SECRET_KEY=${hmacSecret}\n`);
			console.log("   ✅ .dev.vars 已补充 HMAC_SECRET_KEY");
		} else {
			console.log("   ✅ .dev.vars 已有 HMAC_SECRET_KEY，跳过");
		}
	}

	// Run migrations on dev database
	console.log("\n🗄️  执行开发数据库迁移...");
	run("npx", ["wrangler", "d1", "migrations", "apply", "DB", "--config", "wrangler.dev.jsonc", "--remote"]);
	console.log("   ✅ 开发数据库迁移完成");

	console.log(`\n📋 本地开发环境就绪！执行以下命令启动:`);
	console.log(`   npm run dev`);

	// ========================================
	// Phase 2: Production Deployment
	// ========================================
	if (!MODE_DEV_ONLY) {
		console.log(`\n${"═".repeat(50)}`);
		console.log("阶段二：生产部署");
		console.log(`${"═".repeat(50)}`);

		// Create production database
		const prodDbName = "ariya-sts2-mod-logs";
		let prodDbId;
		console.log(`\n📦 检查生产数据库 ${prodDbName}...`);
		try {
			const list = runCapture("npx", ["wrangler", "d1", "list", "--json"]);
			const dbs = JSON.parse(list);
			const existing = dbs.find((d) => d.name === prodDbName);
			if (existing) {
				prodDbId = existing.uuid;
				console.log(`   ✅ 已存在，ID: ${prodDbId}`);
			} else {
				throw new Error("not found");
			}
		} catch {
			let dbOutput;
			try {
				dbOutput = runCapture("npx", ["wrangler", "d1", "create", prodDbName, "--json", "--experimental-backup"]);
			} catch {
				dbOutput = runCapture("npx", ["wrangler", "d1", "create", prodDbName, "--json"]);
			}
			let dbJson;
			try { dbJson = JSON.parse(dbOutput); } catch { dbJson = {}; }
			prodDbId = dbJson.uuid || dbJson.result?.uuid;
			console.log(`   ✅ 新建，ID: ${prodDbId}`);
		}

		// Write to .env for CI/CD reference
		console.log("\n📝 写入数据库 ID 到 .env（供 CI/CD 参考）...");
		const envPath = join(ROOT, ".env");
		writeFileSync(envPath, `D1_DATABASE_ID=${prodDbId}\n`);
		console.log("   ✅ .env 已更新");

		// Set production secrets
		console.log("\n🔐 设置生产环境 HMAC_SECRET_KEY...");
		run("npx", ["wrangler", "secret", "put", "HMAC_SECRET_KEY"], {
			input: hmacSecret + "\n",
			encoding: "utf-8",
			stdio: ["pipe", "inherit", "inherit"],
		});
		console.log("   ✅ HMAC_SECRET_KEY 已设置");

		const setAdminKey = await question("\n🔐 是否设置 ADMIN_KEY（可选，推荐 Cloudflare API Token）？(y/N): ");
		if (setAdminKey.toLowerCase() === "y") {
			run("npx", ["wrangler", "secret", "put", "ADMIN_KEY"]);
			console.log("   ✅ ADMIN_KEY 已设置");
		} else {
			console.log("   ⏭️  跳过");
		}

		const setCfAccess = await question("\n🔐 是否设置 Cloudflare Access 团队域名（可选）？(y/N): ");
		if (setCfAccess.toLowerCase() === "y") {
			run("npx", ["wrangler", "secret", "put", "CF_ACCESS_TEAM_DOMAIN"]);
			console.log("   ✅ CF_ACCESS_TEAM_DOMAIN 已设置");

			const setOwnerEmail = await question("   🔐 是否设置 OWNER_EMAIL（可选，自动授予管理员权限）？(y/N): ");
			if (setOwnerEmail.toLowerCase() === "y") {
				run("npx", ["wrangler", "secret", "put", "OWNER_EMAIL"]);
				console.log("   ✅ OWNER_EMAIL 已设置");
			}
		} else {
			console.log("   ⏭️  跳过");
		}

		// Run production migrations
		console.log("\n🗄️  执行生产数据库迁移...");
		run("npx", ["wrangler", "d1", "migrations", "apply", "DB", "--remote"]);
		console.log("   ✅ 生产数据库迁移完成");

		// Deploy
		const deploy = await question("\n🚀 是否现在部署？(Y/n): ");
		if (deploy.toLowerCase() !== "n") {
			console.log("\n🚀 部署中...");
			run("npm", ["run", "predeploy"]);
			run("npx", ["wrangler", "deploy"]);
			console.log("   ✅ 部署完成");
		} else {
			console.log("   ⏸️  跳过。稍后可执行: npm run predeploy && npx wrangler deploy");
		}

		console.log(`
╔══════════════════════════════════════════╗
║           部署完成！                     ║
╚══════════════════════════════════════════╝

  📋 生产环境摘要:
  HMAC_SECRET_KEY = ${hmacSecret.slice(0, 16)}...
  请将上述密钥配置到 Mod 项目中。
`);
	} else {
		console.log(`
╔══════════════════════════════════════════╗
║       本地开发环境就绪！                 ║
╚══════════════════════════════════════════╝

  启动命令:
    npm run dev          # 后端 Worker
    cd frontend && npm run dev   # 前端 Vite

  .dev.vars 中的 HMAC_SECRET_KEY 用于本地签名测试。
`);
	}
}

main().catch((e) => {
	console.error("❌ 安装失败:", e.message);
	process.exit(1);
});
