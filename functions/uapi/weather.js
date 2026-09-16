/**
 * uapis 天气代理（EdgeOne Pages 边缘函数）
 *
 * 路由：functions/uapi/weather.js → /uapi/weather
 * 与 Vercel 版（api/weather.js）路径保持一致，因此前端无需任何改动，
 * 默认的 VITE_UAPI_BASE=/uapi 在两个平台上都直接可用。
 *
 * 为什么每个平台都要单独放一份：
 * - Vercel 识别的是项目根目录的 api/ 目录 + vercel.json 重写；
 * - EdgeOne Pages 识别的是 /functions 目录（文件即路由）+ edgeone.json。
 *   两者互不通用：只部署 Vercel 版时，EdgeOne 上根本不存在 /uapi/weather 这个处理器，
 *   请求会回落到静态资源并 404，前端就表现为「天气定位失败」。
 *
 * 环境变量（EdgeOne Pages 项目设置 → 环境变量）：
 *   UAPI_KEY = uapis 的 API Key（**不要**加 VITE_ 前缀，否则会被打进前端产物）
 * 可选：
 *   ALLOWED_ORIGIN = https://你的域名（限制只有自己的站点能调用，防止被他人盗刷）
 *
 * 关于定位：uapis 的「不传城市按 IP 定位」用的是请求来源 IP，
 * 经边缘函数转发后会变成机房 IP，所以这里取**访客真实 IP**（EdgeOne 原生
 * request.eo.clientIp）再用 /api/v1/network/ipinfo 反查中文城市名。
 * ⚠️ 不要用 request.eo.geo 里的城市名：那通常是英文，uapis 对英文名匹配不可靠
 * （实测 Wuxi → 重庆巫溪县、Suzhou → 安徽宿州市），会静默返回错误城市的天气。
 */

const UAPI_BASE = "https://uapis.cn";
const WEATHER_PATH = "/api/v1/misc/weather";
const IPINFO_PATH = "/api/v1/network/ipinfo";

// 上游数据约 5~10 分钟更新一次
const PUBLIC_CACHE = "public, s-maxage=300, stale-while-revalidate=1200";
const PRIVATE_CACHE = "private, max-age=60";
const FETCH_TIMEOUT = 6000;

/** 请求上游，任何异常（超时 / 网络错误）都不抛出，统一返回 { ok, status, text } */
const fetchUpstream = async (url, apiKey) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "X-API-Key": apiKey },
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status, text: await res.text() };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      text: JSON.stringify({ error: "UPSTREAM_UNREACHABLE", message: error.message }),
    };
  } finally {
    clearTimeout(timer);
  }
};

/** 取访客真实 IP：优先用 EdgeOne 原生属性，请求头作为兜底 */
const getClientIp = (request) => {
  const native = request.eo && request.eo.clientIp;
  if (native) return String(native).trim();

  const raw =
    request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
  const first = String(raw).split(",")[0].trim();
  if (!first) return "";
  // IPv4 可能带端口，如 1.2.3.4:5678；IPv6 本身含冒号，不能按冒号切
  return /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(first) ? first.split(":")[0] : first;
};

/** 用访客 IP 反查中文城市名：region 形如「中国 江苏 南京」，取最后一段 */
const resolveCityByIp = async (ip, apiKey) => {
  if (!ip) return "";
  const result = await fetchUpstream(
    `${UAPI_BASE}${IPINFO_PATH}?ip=${encodeURIComponent(ip)}`,
    apiKey,
  );
  if (!result.ok) return "";
  try {
    const region = JSON.parse(result.text).region;
    if (typeof region !== "string" || !region.trim()) return "";
    const parts = region.trim().split(/\s+/);
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
};

/** 查询天气；city 为空时交给 uapis 按请求来源 IP 定位 */
const requestWeather = (city, apiKey) => {
  const url = new URL(UAPI_BASE + WEATHER_PATH);
  if (city) url.searchParams.set("city", city);
  return fetchUpstream(url.toString(), apiKey);
};

const respond = (result, cacheControl, allowedOrigin) => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": result.ok ? cacheControl : "no-store",
  };
  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin.split(",")[0].trim();
  }
  return new Response(result.text, { status: result.status, headers });
};

export async function onRequest({ request, env }) {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", Allow: "GET" },
    });
  }

  const apiKey = env.UAPI_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "UAPI_KEY_NOT_CONFIGURED",
        message: "未配置环境变量 UAPI_KEY，请在 EdgeOne Pages 项目设置中添加",
      }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  const allowedOrigin = env.ALLOWED_ORIGIN;
  if (allowedOrigin) {
    const origin = request.headers.get("origin") || request.headers.get("referer") || "";
    const allowed = allowedOrigin.split(",").map((item) => item.trim());
    if (!allowed.some((item) => item && origin.startsWith(item))) {
      return new Response(JSON.stringify({ error: "FORBIDDEN_ORIGIN" }), {
        status: 403,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
  }

  const explicitCity = (new URL(request.url).searchParams.get("city") || "").trim();

  // 1) 调用方指定了城市：结果与访客无关，可走 CDN 共享缓存
  if (explicitCity) {
    return respond(await requestWeather(explicitCity, apiKey), PUBLIC_CACHE, allowedOrigin);
  }

  // 2) 未指定城市：用访客真实 IP 反查城市，避免拿机房 IP 去定位
  const ipCity = await resolveCityByIp(getClientIp(request), apiKey);
  if (ipCity) {
    const result = await requestWeather(ipCity, apiKey);
    if (result.ok) return respond(result, PRIVATE_CACHE, allowedOrigin);
  }

  // 3) 兜底：仍不传城市
  return respond(await requestWeather("", apiKey), PRIVATE_CACHE, allowedOrigin);
}
