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
		"profile.nickname_saved": "昵称已更新", "members.title": "成员管理",
		"loading": "加载中...", "not_found": "未找到",
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
	return messages[currentLocale]?.[key] || messages[FALLBACK]?.[key] || key;
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

// React hook for reactive locale
import { useState, useEffect } from "react";

export function useLocale() {
	const [, setTick] = useState(0);
	useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
	return { t, lang: currentLocale, setLocale };
}
