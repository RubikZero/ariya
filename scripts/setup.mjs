#!/usr/bin/env node

import { randomBytes, randomUUID } from "node:crypto";
import { spawnSync, execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

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
	console.log(`
╔══════════════════════════════════════════╗
║        Ariya - 一键部署向导              ║
║  Slay the Spire 2 Mod 日志收集平台       ║
╚══════════════════════════════════════════╝
`);

	const hasWrangler = spawnSync("npx", ["wrangler", "--version"], {
		cwd: ROOT,
		encoding: "utf-8",
		stdio: ["pipe", "pipe", "pipe"],
	});
	if (hasWrangler.status !== 0) {
		console.log("❌ 未检测到 wrangler，请先安装依赖: npm install");
		process.exit(1);
	}
	console.log(`✅ wrangler 版本: ${hasWrangler.stdout.trim()}`);

	// Step 1: Check if user is logged in
	console.log("\n📋 检查 Cloudflare 登录状态...");
	const whoami = spawnSync("npx", ["wrangler", "whoami"], {
		cwd: ROOT,
		encoding: "utf-8",
		stdio: ["pipe", "pipe", "pipe"],
	});
	if (whoami.status !== 0) {
		console.log("❌ 未登录 Cloudflare，请先运行: npx wrangler login");
		process.exit(1);
	}
	console.log(`✅ 已登录: ${whoami.stdout.split("\n")[0]?.trim() || "未知"}`);

	// Step 2: Generate HMAC secret
	console.log("\n🔑 生成 HMAC 密钥...");
	const hmacSecret = randomBytes(32).toString("hex");
	console.log(`   密钥: ${hmacSecret}`);
	console.log("   ⚠️  请妥善保管此密钥！Mod 端也需要配置相同的密钥。");

	// Step 3: Create D1 database
	console.log("\n🗄️  创建 D1 数据库...");
	let dbOutput;
	try {
		dbOutput = runCapture("npx", ["wrangler", "d1", "create", "ariya-sts2-mod-logs", "--json", "--experimental-backup"]);
	} catch {
		dbOutput = runCapture("npx", ["wrangler", "d1", "create", "ariya-sts2-mod-logs", "--json"]);
	}

	let dbJson;
	try {
		dbJson = JSON.parse(dbOutput);
	} catch {
		// Fallback: if not JSON, try to parse the output manually
		const match = dbOutput.match(/database_id\s*=\s*"([^"]+)"/);
		if (match) {
			dbJson = { uuid: match[1] };
		} else {
			console.error("❌ 无法解析 D1 数据库信息，请手动创建:");
			console.error("   npx wrangler d1 create ariya-sts2-mod-logs");
			process.exit(1);
		}
	}

	const dbId = dbJson.uuid || dbJson.result?.uuid;
	console.log(`   ✅ 数据库 ID: ${dbId}`);

	// Step 4: Update wrangler.jsonc
	console.log("\n📝 更新 wrangler.jsonc 配置...");
	const configPath = join(ROOT, "wrangler.jsonc");
	let config = readFileSync(configPath, "utf-8");
	config = config.replace('"database_id": "placeholder"', `"database_id": "${dbId}"`);
	config = config.replace('"database_id": ""', `"database_id": "${dbId}"`);
	if (!config.includes(dbId)) {
		console.log("   ⚠️  未找到 placeholder database_id，请手动编辑 wrangler.jsonc");
		console.log(`   database_id 应设置为: ${dbId}`);
	} else {
		writeFileSync(configPath, config);
		console.log("   ✅ wrangler.jsonc 已更新");
	}

	// Step 5: Set secrets
	console.log("\n🔐 设置 HMAC_SECRET_KEY...");
	run("npx", ["wrangler", "secret", "put", "HMAC_SECRET_KEY"], {
		input: hmacSecret + "\n",
		encoding: "utf-8",
		stdio: ["pipe", "inherit", "inherit"],
	});
	console.log("   ✅ HMAC_SECRET_KEY 已设置");

	// Step 6: Run migrations
	console.log("\n🗄️  执行数据库迁移...");
	run("npx", ["wrangler", "d1", "migrations", "apply", "DB", "--remote"]);

	// Step 7: Deploy
	const answer = await question("\n🚀 是否现在部署到 Cloudflare？(Y/n): ");
	if (answer.toLowerCase() !== "n") {
		console.log("\n🚀 部署中...");
		run("npx", ["wrangler", "deploy"]);
	} else {
		console.log("\n   ⏸️  跳过部署。稍后可执行: npm run deploy");
	}

	// Summary
	console.log(`
╔══════════════════════════════════════════╗
║           部署完成！                     ║
╚══════════════════════════════════════════╝

  📋 配置摘要（请勿泄露）:
  ┌─────────────────────────────────┐
  │ HMAC_SECRET_KEY = ${hmacSecret.slice(0, 16)}...│
  │ Database ID     = ${dbId.slice(0, 16)}...│
  └─────────────────────────────────┘

  下一步:
  1. 在 Mod 项目中使用上述 HMAC_SECRET_KEY 签名请求
  2. 将 Mod 的日志提交地址指向 Worker 部署后的 URL
  3. 可通过 /admin 页面查看日志和管理配置
`);
}

main().catch((e) => {
	console.error("❌ 安装失败:", e.message);
	process.exit(1);
});
