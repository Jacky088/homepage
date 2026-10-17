/**
 * uapis 天气代理（Vercel Serverless Function）
 *
 * 为什么需要它：
 * 前端直接请求 uapis 必须带 API Key，而 VITE_ 前缀的变量会被打进前端产物导致 Key 公开，
 * 因此把 Key 放在服务端注入。
 *
 * 为什么不能只做「原样转发」：
 * uapis 的「不传城市时按 IP 自动定位」依据的是**请求来源 IP**。经 Serverless 函数转发后，
 * 来源 IP 变成了 Vercel 机房（如 iad1）的 IP，uapis 无法解析该地址，直接返回
 * {"error":"LOCATION_NOT_FOUND"}，前端表现就是「天气定位失败」。
 * 因此这里先从 x-forwarded-for 取出**访客真实 IP**，再用 uapis 的
 * /api/v1/network/ipinfo 反查中文城市名，最后带着 city 去查天气。
 *
 * ⚠️ 不要改成使用 Vercel 的 x-vercel-ip-city 头：它返回英文城市名，而 uapis 对英文名的
 * 匹配并不可靠（实测 Wuxi → 重庆巫溪县、Suzhou → 安徽宿州市），会静默返回**错误城市**
 * 的天气，比直接失败更糟。
 *
 * 部署（Vercel）：
 * 1. 项目 Settings → Environment Variables 添加 UAPI_KEY（**不要**加 VITE_ 前缀）；
 * 2. 可选添加 ALLOWED_ORIGIN = https://你的域名，限制只有自己的站点能调用本函数；
 * 3. 前端无需配置 VITE_UAPI_BASE（默认 /uapi），vercel.json 已把 /uapi/weather 重写到本函数。
 *
 * 缓存策略：
 * - 调用方显式传了 city（与访客无关，如前端保存的城市）→ 允许 CDN 共享缓存；
 * - 由访客 IP 解析出的 city（因人而异）→ 只允许浏览器私有缓存，绝不能走 CDN，
 *   否则会把 A 城市的天气发给 B 城市的访客。
 *
 * 安全说明：
 * - 不接受任意 URL，只转发固定的天气 / IP 归属地接口，避免成为开放代理；
 * - 只放行 city 一个查询参数，其余一律忽略。
 */

const UAPI_BASE = "https://uapis.cn";
const WEATHER_PATH = "/api/v1/misc/weather";
const IPINFO_PATH = "/api/v1/network/ipinfo";

// 上游数据约 5~10 分钟更新一次
const PUBLIC_CACHE = "public, s-maxage=300, stale-while-revalidate=1200";
const PRIVATE_CACHE = "private, max-age=60";
const FETCH_TIMEOUT = 6000;

/**
 * 请求上游并解析 JSON，任何异常（超时 / 网络错误 / 非 JSON）都不抛出，
 * 统一返回 { ok, status, text }，由调用方决定如何处理
 */
const fetchUpstream = async (url, apiKey) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "X-API-Key": apiKey },
      signal: controller.signal,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
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

/** 取访客真实 IP：Vercel 会把客户端 IP 写进这些请求头 */
const getClientIp = (headers) => {
  const raw =
    headers["x-vercel-forwarded-for"] || headers["x-forwarded-for"] || headers["x-real-ip"] || "";
  const first = String(raw).split(",")[0].trim();
  if (!first) return "";
  // IPv4 可能带端口，如 1.2.3.4:5678；IPv6 本身含冒号，不能按冒号切
  return /^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(first) ? first.split(":")[0] : first;
};

/** 用访客 IP 反查城市名：国内形如「中国 江苏 南京」，境外形如「德国 Hesse Frankfurt am Main」 */
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
    // 纯国家名（如单一“德国”或“美国”无具体城市）：返回空，避免传给天气接口导致跨国同名小镇误匹配
    if (parts.length <= 1) return "";
    // 境外 IP：若格式为 [国家, 州, 城市...]，提取完整城市名而不是最后一个词（防止 Frankfurt am Main 被切成 Main）
    if (parts[0] !== "中国") {
      return parts.slice(parts.length > 2 ? 2 : 1).join(" ");
    }
    // 国内 IP：提取最后一段（市/区县）
    return parts[parts.length - 1] || "";
  } catch {
    return "";
  }
};

/** 检查是否命中 uapis 上游将国家名/缩写词误匹配到海外冷门村镇的已知异常 */
const isAnomalousWeather = (rawJsonText) => {
  try {
    const data = JSON.parse(rawJsonText);
    if (!data) return false;
    if (data.city === "德国" || data.province === "Comayagua") return true;
    if (data.city === "Main" && data.province === "Uttar Pradesh") return true;
    return false;
  } catch {
    return false;
  }
};

/** 查询天气；city 为空时交给 uapis 按请求来源 IP 定位 */
const requestWeather = async (city, apiKey) => {
  const url = new URL(UAPI_BASE + WEATHER_PATH);
  if (city) url.searchParams.set("city", city);
  return fetchUpstream(url.toString(), apiKey);
};

const respond = (res, result, cacheControl, matchedOrigin) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", result.ok ? cacheControl : "no-store");
  if (matchedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", matchedOrigin);
    res.setHeader("Vary", "Origin");
  }
  return res.status(result.status).send(result.text);
};

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

  // 可选来源校验：防止函数被他人当作免费接口盗刷
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  let matchedOrigin = "";
  if (allowedOrigin) {
    const rawOrigin = req.headers.origin || req.headers.referer || "";
    let isAllowed = false;
    try {
      if (rawOrigin) {
        const originHost = new URL(rawOrigin).origin;
        const allowed = allowedOrigin.split(",").map((item) => {
          try {
            return new URL(item.trim()).origin;
          } catch {
            return item.trim();
          }
        });
        if (allowed.includes(originHost)) {
          isAllowed = true;
          matchedOrigin = originHost;
        }
      }
    } catch {
      isAllowed = false;
    }
    if (!isAllowed) {
      return res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
    }
  }

  const query = req.query || {};
  const explicitCity = typeof query.city === "string" ? query.city.trim() : "";

  // 1) 调用方指定了城市：结果与访客无关，可走 CDN 共享缓存
  if (explicitCity) {
    const result = await requestWeather(explicitCity, apiKey);
    return respond(res, result, PUBLIC_CACHE, matchedOrigin);
  }

  // 2) 未指定城市：用访客真实 IP 反查城市，避免用机房 IP 去定位
  const clientIp = getClientIp(req.headers);
  const ipCity = await resolveCityByIp(clientIp, apiKey);
  if (ipCity) {
    const result = await requestWeather(ipCity, apiKey);
    if (result.ok && !isAnomalousWeather(result.text)) {
      return respond(res, result, PRIVATE_CACHE, matchedOrigin);
    }
  }

  // 3) 兜底：仍不传城市（自建反代等场景下请求来源 IP 即访客 IP 时依然可用）
  const fallback = await requestWeather("", apiKey);
  if (fallback.ok && isAnomalousWeather(fallback.text)) {
    return respond(
      res,
      { ok: false, status: 404, text: JSON.stringify({ error: "LOCATION_ANOMALOUS", message: "异常匹配已拦截" }) },
      PRIVATE_CACHE,
      matchedOrigin,
    );
  }
  return respond(res, fallback, PRIVATE_CACHE, matchedOrigin);
}
