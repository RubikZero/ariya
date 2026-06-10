# Ariya

> Slay the Spire 2 Mod 异常日志收集平台 · Cloudflare Workers 自建服务端

Ariya 是一个轻量级的日志收集服务端，专为 **Slay the Spire 2** Mod 设计。当 Mod 捕获到游戏中的异常时，可以将异常信息（堆栈、游戏状态、运行环境等）通过 HMAC 签名后安全地上传到 Ariya 服务端，存储在 Cloudflare D1 数据库中，方便开发者集中查看和分析。

---

## 目录

- [架构概览](#架构概览)
- [快速部署（推荐）](#快速部署推荐)
- [手动部署](#手动部署)
- [Mod 接入指南](#mod-接入指南)
- [API 文档](#api-文档)
- [管理面板](#管理面板)
- [本地开发](#本地开发)
- [GitHub CI/CD](#github-cicd)
- [许可证](#许可证)

---

## 架构概览

```
┌─────────────┐     HMAC-SHA256 签名     ┌──────────────────┐
│  STS2 Mod   │ ────── POST / ──────────→ │  Ariya Worker    │
│  (C#)       │   X-Mod-Signature 头      │  (Cloudflare)    │
└─────────────┘                           │                  │
                                          │  ┌────────────┐  │
                                          │  │  D1 数据库 │  │
                                          │  └────────────┘  │
                                          └──────────────────┘
                                                    │
                                          ┌─────────┴─────────┐
                                          │  Admin 管理面板    │
                                          │  GET /admin        │
                                          └───────────────────┘
```

- **Mod 端**（C#）：捕获异常 → 序列化为 JSON → HMAC-SHA256 签名 → POST 到 Ariya
- **服务端**（Cloudflare Workers）：验证签名 → 去重存储 → 提供管理面板
- **存储**（D1）：基于 SQLite 的分布式数据库，零运维

---

## 快速部署（推荐）

> 前置条件：Node.js 18+、npm、一个 Cloudflare 账号

```bash
# 1. 克隆项目
git clone <你的仓库地址>
cd ariya

# 2. 安装依赖
npm install

# 3. 登录 Cloudflare（如果尚未登录）
npx wrangler login

# 4. 一键部署（交互式向导）
npm run setup
```

`npm run setup` 会依次完成：
1. ✅ 检查 wrangler 和 Cloudflare 登录状态
2. 🔑 生成 256 位 HMAC 密钥
3. 🗄️ 创建 D1 数据库并自动写入配置
4. 🔐 将 HMAC 密钥设为 Worker 的 Secret 环境变量
5. 🗄️ 执行数据库迁移（建表）
6. 🚀 部署到 Cloudflare Workers

部署完成后会输出配置摘要，**请妥善保管 HMAC 密钥**。

---

## 手动部署

如果你希望分步操作，或者 `npm run setup` 因为网络等原因执行失败：

### 1. 创建 D1 数据库

```bash
npx wrangler d1 create ariya-sts2-mod-logs
```

将输出的 `database_id` 填入 `wrangler.jsonc`：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "ariya-sts2-mod-logs",
    "database_id": "你的-database-id"  // ← 替换这里
  }
]
```

### 2. 生成 HMAC 密钥并设为 Secret

```bash
# 生成 64 字符的十六进制密钥
npm run gen-key

# 设为 Worker 的环境变量（生产环境 / 远程）
npx wrangler secret put HMAC_SECRET_KEY
```

### 3. 初始化数据库

```bash
npx wrangler d1 migrations apply DB --remote
```

### 4. 部署

```bash
npm run deploy
```

### 5. （可选）配置本地开发环境

```bash
# 复制环境变量模板
cp .dev.vars.example .dev.vars

# 编辑 .dev.vars，填入 HMAC_SECRET_KEY
```

---

## API 文档

### 提交日志

```
POST /
Content-Type: application/json
X-Mod-Signature: <HMAC-SHA256 Base64 签名>
```

**请求体（JSON）**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `mod_id` | string | 是 | Mod 标识符 |
| `mod_version` | string | 是 | Mod 版本号 |
| `game_version` | string | 否 | 游戏版本号 |
| `error_message` | string | 是 | 异常消息 |
| `stack_trace` | string | 是 | 堆栈跟踪 |
| `game_state` | string | 否 | 游戏运行时状态的 JSON 序列化字典，包含当前场景、房间、战斗状态、玩家血量等详细上下文。序列化前结构示例：<br>`{"loc.language": "zh-CN", "game.scene": "CombatRoom", "game.in_run": "true", "game.seed": "ABC123", "game.ascension": 5, "game.act": 1, "game.floor": 12, "game.room_type": "EventRoom", "game.characters": "ironclad", "combat.round": 3, "combat.enemy_count": 2, "combat.player_hp": "45/80"}` |
| `player_os` | string | 否 | 玩家操作系统 |
| `os_version` | string | 否 | 系统版本详情 |
| `created_at` | number | 是 | 时间戳（毫秒） |

**签名算法**：

1. 将请求体（UTF-8 JSON 字符串）使用 HMAC-SHA256 签名
2. 将签名的二进制结果以 Base64 编码
3. 放入 `X-Mod-Signature` 请求头

**去重机制**：

服务端对 `mod_id + mod_version + game_version + error_message + stack_trace` 取 SHA-256 作为唯一标识（`hash`）。
相同错误重复提交时，会更新 `game_state`、`player_os`、`os_version`、`created_at`，并将 `count` 加 1。
因此 Mod 端不需要生成并发送 UUID。

**响应**：

- `200` — `{"success": true, "count": 1}` 提交成功，`count` 表示该错误累计发生次数（首次为 1，重复提交递增）
- `401` — 缺少 `X-Mod-Signature` 头
- `403` — HMAC 签名验证失败
- `422` — 请求已过期（超过 `TIMEOUT` 秒）
- `405` — 请求方法不是 POST

---

## 管理面板

部署后访问 `/admin` 即可打开管理面板，支持以下功能：

- **🔑 生成 HMAC 密钥** — 浏览器本地生成 256 位密钥，一键复制
- **📤 测试提交** — 在浏览器中模拟 Mod 发送日志，验证端到端链路
- **📋 最近提交** — 查看最近 50 条日志记录

---

## 本地开发

```bash
# 启动本地开发服务器（默认端口 8787）
npm run dev

# 初始化本地 D1 数据库
npx wrangler d1 migrations apply DB --local

# 运行测试
npm test
```

本地开发使用 `.dev.vars` 中的密钥（不推送至 Git），远程部署使用 `wrangler secret put` 设置的密钥。

---

## GitHub CI/CD

项目包含了 GitHub Actions 工作流（`.github/workflows/deploy.yml`），
推送至 `main` 或 `master` 分支时会自动部署。

在使用前需要在 GitHub 仓库设置以下 Secrets：

| Secret | 说明 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 令牌（需有 Workers 和 D1 权限） |
| `CLOUDFLARE_ACCOUNT_ID` | 你的 Cloudflare 账户 ID |
| `HMAC_SECRET_KEY` | HMAC 密钥（应和本地开发用的 .dev.vars 不同） |

获取 API 令牌：https://dash.cloudflare.com/profile/api-tokens

---

## 许可证

[MIT](LICENSE)
