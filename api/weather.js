/**
 * uapis 天气代理（Vercel Serverless Function）
 *
 * 目的：把 uapis 的 API Key 保存在服务端环境变量中，前端只请求本站的 /uapi/weather，
 * 避免 Key 被打进前端产物（VITE_ 前缀的变量会完整出现在构建后的 JS 里）。
 *
 * 部署步骤（Vercel）：
 * 1. 项目 Settings → Environment Variables 添加：
 *      UAPI_KEY = 你的 uapis API Key
 *    ⚠️ 不要加 VITE_ 前缀，否则又会被打进前端产物；
 * 2. 可选：添加 ALLOWED_ORIGIN = https://你的域名，限制只有自己的站点能调用本函数；
 * 3. 前端无需配置 VITE_UAPI_BASE（默认值 /uapi 即可），vercel.json 已把
 *    /uapi/weather 重写到本函数。
 *
 * 其他部署方式：
 * - 自有服务器 / nginx：把 /uapi/weather 反代到 https://uapis.cn/api/v1/misc/weather
 *   并注入 X-API-Key 头；也可把 VITE_UAPI_BASE 指向任意实现了相同协议的代理。
 * - Cloudflare Worker：参照 worker/amap-proxy.js 的写法改写本文件即可。
 *
 * 安全说明：
 * - 不接受任意 URL，只转发固定的天气接口，避免变成开放代理被滥用；
 * - 只放行 city 一个参数，其余查询参数一律丢弃；
 * - 响应交给 Vercel Edge 缓存（s-maxage），降低 uapis 额度消耗。
 */

const UAPI_ENDPOINT = "https://uapis.cn/api/v1/misc/weather";
// 上游数据约 5~10 分钟更新一次，缓存 5 分钟可显著减少额度消耗
const CACHE_SECONDS = 300;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const apiKey = process.env.UAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "UAPI_KEY_NOT_CONFIGURED",
      message: "服务端未配置 UAPI_KEY，请在部署平台的 Environment Variables 中添加",
    });
  }

  // 可选来源校验：配置后仅允许自己的站点调用，避免函数被他人当作免费接口盗刷
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin) {
    const origin = req.headers.origin || req.headers.referer || "";
    const allowed = allowedOrigin.split(",").map((item) => item.trim());
    if (!allowed.some((item) => item && origin.startsWith(item))) {
      return res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
    }
  }

  const target = new URL(UAPI_ENDPOINT);
  const { city } = req.query;
  if (typeof city === "string" && city.trim()) {
    target.searchParams.set("city", city.trim());
  }

  let upstream;
  try {
    upstream = await fetch(target, {
      headers: { Accept: "application/json", "X-API-Key": apiKey },
    });
  } catch {
    return res.status(502).json({ error: "UPSTREAM_UNREACHABLE" });
  }

  const body = await upstream.text();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (upstream.ok) {
    res.setHeader(
      "Cache-Control",
      `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 4}`,
    );
  }
  if (allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin.split(",")[0].trim());
  }
  return res.status(upstream.status).send(body);
}
