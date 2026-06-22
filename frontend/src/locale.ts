const messages: Record<string, Record<string, string>> = {
	"zh-CN": {
		"nav.dashboard": "控制台", "nav.browse": "日志浏览",
		"nav.profile": "个人设置", "nav.members": "成员管理", "nav.logout": "退出登录",
		"login.title": "管理员登录", "login.desc": "输入用户名和密码登录管理面板",
		"login.btn": "登录", "login.loading": "登录中...",
		"login.no_account": "还没有账号？", "login.register": "注册新账号",
		"dashboard.key_title": "生成 HMAC 密钥",
		"dashboard.key_desc": "Ariya 使用 HMAC-SHA256 验证 Mod 发来的请求。",
		"dashboard.key_generate": "生成", "dashboard.key_copy": "复制",
		"dashboard.key_copied": "已复制", "dashboard.key_placeholder": "点击生成",
		"dashboard.test_title": "测试提交",
		"dashboard.test_desc": "发送一条模拟日志到提交接口，验证端到端是否正常工作。",
		"dashboard.test_key_label": "HMAC 密钥", "dashboard.test_url_label": "请求地址",
		"dashboard.test_btn": "发送测试请求", "dashboard.test_sending": "发送中...",
		"dashboard.logs_title": "最近提交", "dashboard.logs_btn": "加载日志",
		"dashboard.logs_loading": "加载中...",
		"browse.col_time": "时间", "browse.col_mod": "Mod",
		"browse.col_version": "版本", "browse.col_game": "游戏版本",
		"browse.col_error": "异常消息", "browse.col_stack": "堆栈",
		"browse.col_state": "游戏状态", "browse.col_os": "操作系统",
		"browse.col_os_ver": "系统版本", "browse.col_count": "次数",
		"browse.col_hash": "Hash",
		"detail.basic_info": "基本信息", "detail.time": "时间",
		"detail.mod": "Mod", "detail.version": "版本", "detail.game": "游戏版本",
		"detail.error": "异常消息", "detail.count": "错误次数",
		"detail.os": "操作系统", "detail.os_ver": "系统版本",
		"detail.hash": "Hash", "detail.stack": "堆栈跟踪",
		"detail.state": "游戏状态", "detail.back": "返回",
		"profile.title": "个人设置", "profile.username": "用户名",
		"profile.nickname": "昵称", "profile.nickname_btn": "保存昵称",
		"profile.nickname_saved": "昵称已更新",
		"profile.old_password": "当前密码", "profile.new_password": "新密码",
		"profile.password_btn": "修改密码", "profile.password_changed": "密码已修改",
		"register.title": "加入团队", "register.desc": "使用邀请码注册",
		"register.invite_code": "邀请码", "register.username": "用户名",
		"register.password": "密码", "register.btn": "注册",
		"register.has_account": "已有账号？", "register.signin": "登录",
		"members.title": "成员管理",
		"members.table_username": "用户名", "members.table_nickname": "昵称",
		"members.table_role": "角色", "members.table_last_active": "最后活跃",
		"members.table_created": "创建时间", "members.role_admin": "管理员",
		"members.role_member": "成员", "members.no_users": "暂无用户",
		"members.invite_title": "创建邀请码", "members.invite_expires": "有效期（小时）",
		"members.invite_create": "生成", "members.invite_result": "邀请码",
		"members.invite_copied": "已复制",
		"members.transfer_title": "转让所有权",
		"members.transfer_desc": "将管理员所有权转让给其他用户",
		"members.transfer_target": "目标用户名", "members.transfer_btn": "转让",
		"members.transfer_done": "所有权已转让",
		"members.remove_confirm": "确定要删除该用户吗？",
		"members.remove_btn": "删除", "members.remove_done": "用户已删除",
		"members.role_updated": "角色已更新",
		"loading": "加载中...", "not_found": "未找到",
	},
	"en": {
		"nav.dashboard": "Dashboard", "nav.browse": "Log Browser",
		"nav.profile": "Profile", "nav.members": "Members", "nav.logout": "Logout",
		"login.title": "Username", "login.desc": "Enter your credentials",
		"login.btn": "Sign In", "login.loading": "Signing in...",
		"login.no_account": "No account?", "login.register": "Register",
		"dashboard.key_title": "Generate HMAC Key",
		"dashboard.key_desc": "Ariya uses HMAC-SHA256 to verify requests.",
		"dashboard.key_generate": "Generate", "dashboard.key_copy": "Copy",
		"dashboard.key_copied": "Copied", "dashboard.key_placeholder": "Click to generate",
		"dashboard.test_title": "Test Submission",
		"dashboard.test_desc": "Send a sample log to verify the end-to-end flow.",
		"dashboard.test_key_label": "HMAC Key", "dashboard.test_url_label": "Request URL",
		"dashboard.test_btn": "Send Test Request", "dashboard.test_sending": "Sending...",
		"dashboard.logs_title": "Recent Submissions", "dashboard.logs_btn": "Load Logs",
		"dashboard.logs_loading": "Loading...",
		"browse.col_time": "Time", "browse.col_mod": "Mod",
		"browse.col_version": "Version", "browse.col_game": "Game",
		"browse.col_error": "Error", "browse.col_stack": "Stack",
		"browse.col_state": "State", "browse.col_os": "OS",
		"browse.col_os_ver": "OS Ver", "browse.col_count": "Count",
		"browse.col_hash": "Hash",
		"detail.basic_info": "Basic Info", "detail.time": "Time",
		"detail.mod": "Mod", "detail.version": "Version", "detail.game": "Game",
		"detail.error": "Error", "detail.count": "Count",
		"detail.os": "OS", "detail.os_ver": "OS Ver",
		"detail.hash": "Hash", "detail.stack": "Stack Trace",
		"detail.state": "Game State", "detail.back": "Back",
		"profile.title": "Profile", "profile.username": "Username",
		"profile.nickname": "Nickname", "profile.nickname_btn": "Save Nickname",
		"profile.nickname_saved": "Nickname updated",
		"profile.old_password": "Current Password", "profile.new_password": "New Password",
		"profile.password_btn": "Change Password", "profile.password_changed": "Password changed",
		"register.title": "Join Team", "register.desc": "Register with an invite code",
		"register.invite_code": "Invite Code", "register.username": "Username",
		"register.password": "Password", "register.btn": "Register",
		"register.has_account": "Already have an account?",
		"register.signin": "Sign in",
		"members.title": "Members",
		"members.table_username": "Username", "members.table_nickname": "Nickname",
		"members.table_role": "Role", "members.table_last_active": "Last Active",
		"members.table_created": "Created", "members.role_admin": "Admin",
		"members.role_member": "Member", "members.no_users": "No users yet",
		"members.invite_title": "Create Invite Code",
		"members.invite_expires": "Expires in (hours)",
		"members.invite_create": "Create", "members.invite_result": "Invite Code",
		"members.invite_copied": "Copied",
		"members.transfer_title": "Transfer Ownership",
		"members.transfer_desc": "Transfer admin ownership to another user",
		"members.transfer_target": "Target Username", "members.transfer_btn": "Transfer",
		"members.transfer_done": "Ownership transferred",
		"members.remove_confirm": "Are you sure you want to remove this user?",
		"members.remove_btn": "Remove", "members.remove_done": "User removed",
		"members.role_updated": "Role updated",
		"loading": "Loading...", "not_found": "Not found",
	},
};

const FALLBACK = "en";

const userLang = typeof navigator !== "undefined"
	? navigator.language?.startsWith("zh") ? "zh-CN" : "en"
	: "zh-CN";

let currentLocale = localStorage.getItem("ariya_locale") || userLang;
const listeners = new Set<() => void>();

export function getLocale(): string {
	return currentLocale;
}

export function t(key: string): string {
	return messages[currentLocale]?.[key] ?? messages[FALLBACK]?.[key] ?? key;
}

export function setLocale(lang: string) {
	currentLocale = lang;
	localStorage.setItem("ariya_locale", lang);
	listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
	listeners.add(fn);
	return () => { listeners.delete(fn); };
}

import { useState, useEffect } from "react";

export function useLocale() {
	const [, setTick] = useState(0);
	useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
	return { t, lang: currentLocale, setLocale };
}
