/**
 * 高德 API 代理（Cloudflare Worker 示例）
 *
 * 用途：把高德 key 保存在 Worker 环境变量中，前端只请求本 Worker，
 * 避免 key 出现在前端构建产物里被盗刷配额。
 *
 * 部署步骤：
 * 1. 在 Cloudflare Dashboard 创建 Worker，将本文件内容粘贴为 Worker 脚本；
 * 2. 在 Worker 的 Settings → Variables 中添加环境变量：
 *      AMAP_KEY = 你的高德 Web服务 Key
 *    （建议同时绑定自定义域或路由，例如 https://你的域名/amap/*）
 * 3. 前端 .env 中配置：
 *      VITE_AMAP_BASE = "https://你的worker域名/amap"
 *      VITE_WEATHER_KEY = ""   （留空，key 由本代理注入）
 * 4. 若站点与 Worker 同域（如 /amap/* 路由），CSP 的 connect-src 'self' 即可覆盖；
 *    若跨域，需把 Worker 域名加入 index.html 的 CSP connect-src 白名单。
 *
 * 安全说明：
 * - 只放行 /v3/ip、/v3/config/district、/v3/weather/weatherInfo 三个只读接口；
 * - key 始终由服务端注入，客户端传入的 key 参数会被覆盖；
 * - 可选：通过 ALLOWED_ORIGIN 环境变量限制仅你的站点可调用（CORS 校验）。
 */

const ALLOWED_PATHS = new Set([
  "/v3/ip",
  "/v3/config/district",
  "/v3/weather/weatherInfo",
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 仅处理 GET（高德这三个接口均为只读查询）
    if (request.method !== "GET") {
      return json({ status: "0", info: "METHOD_NOT_ALLOWED" }, 405);
    }

    // 路径白名单：去掉挂载前缀后必须命中允许的接口
    // 支持两种挂载方式：路径前缀（/amap/v3/...）或独立域名（/v3/...）
    let path = url.pathname;
    const m = path.match(/\/(v3\/.+)$/);
    if (!m) {
      return json({ status: "0", info: "NOT_FOUND" }, 404);
    }
    path = "/" + m[1];

    if (!ALLOWED_PATHS.has(path)) {
      return json({ status: "0", info: "FORBIDDEN_PATH" }, 403);
    }

    // 可选来源校验：配置了 ALLOWED_ORIGIN 时，非白名单来源直接拒绝
    if (env.ALLOWED_ORIGIN) {
      const origin = request.headers.get("Origin") || request.headers.get("Referer") || "";
      const allowed = env.ALLOWED_ORIGIN.split(",").map((s) => s.trim());
      if (!allowed.some((o) => o && origin.startsWith(o))) {
        return json({ status: "0", info: "FORBIDDEN_ORIGIN" }, 403);
      }
    }

    if (!env.AMAP_KEY) {
      return json({ status: "0", info: "AMAP_KEY_NOT_CONFIGURED" }, 500);
    }

    // 转发请求：覆盖 key 参数，丢弃浏览器附带的追踪头
    const target = new URL("https://restapi.amap.com" + path);
    for (const [k, v] of url.searchParams) {
      if (k !== "key") target.searchParams.set(k, v);
    }
    target.searchParams.set("key", env.AMAP_KEY);

    const upstream = await fetch(target, {
      method: "GET",
      headers: { "Accept": "application/json" },
    });

    const resp = new Response(upstream.body, upstream);
    resp.headers.set("Content-Type", "application/json; charset=utf-8");
    resp.headers.set("Cache-Control", "no-store");
    if (env.ALLOWED_ORIGIN) {
      resp.headers.set("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN.split(",")[0].trim());
    }
    return resp;
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
