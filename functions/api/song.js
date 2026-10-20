/**
 * 音乐歌单代理（Cloudflare Pages / EdgeOne Pages / Cloudflare Worker 边缘函数）
 *
 * 路由：functions/api/song.js → /api/song
 * 与 Vercel 版（api/song.js）路径保持一致，因此前端在各平台上都填 VITE_SONG_API=/api/song 即可。
 *
 * 环境变量：
 *   SONG_API_UPSTREAM = 你的 Meting 接口地址（可选，未配置时自动使用公共优质源 https://api.injahow.cn/meting）
 * 可选：
 *   ALLOWED_ORIGIN = https://你的域名（限制只有自己的站点能调用，防止被他人盗刷）
 */

// 与前端 SONG_API_TIMEOUT 保持一致：上游挂住时两边都别等太久
const FETCH_TIMEOUT = 8000;

// 默认上游公共 Meting API 源
const DEFAULT_UPSTREAM = "https://api.injahow.cn/meting";

// Meting 协议允许的取值，超出即拒绝，避免函数被当作开放代理
const ALLOWED_SERVER = new Set(["netease", "tencent"]);
const ALLOWED_TYPE = new Set(["song", "playlist", "album", "search", "artist", "lrc", "url", "pic"]);
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

const jsonResponse = (data, status, extraHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders },
  });

/** 取 query 里唯一合法的值，非法或缺失一律返回 null */
const pickParam = (value, pattern) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return pattern instanceof Set
    ? pattern.has(trimmed)
      ? trimmed
      : null
    : pattern.test(trimmed)
      ? trimmed
      : null;
};

export async function onRequest({ request, env }) {
  if (request.method !== "GET") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, 405, { Allow: "GET" });
  }

  // 可选来源校验：防止函数被他人当作免费接口盗刷（与 functions/uapi/weather.js 一致）
  const allowedOrigin = env && env.ALLOWED_ORIGIN;
  let matchedOrigin = "";
  if (allowedOrigin) {
    const rawOrigin = request.headers.get("origin") || request.headers.get("referer") || "";
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
      return jsonResponse({ error: "FORBIDDEN_ORIGIN" }, 403);
    }
  }

  const corsHeaders = matchedOrigin ? { "Access-Control-Allow-Origin": matchedOrigin, Vary: "Origin" } : {};

  // 优先使用用户配置的私有上游，未配置时平滑回退到公共默认源，避免直接 502
  const upstream = ((env && env.SONG_API_UPSTREAM) || DEFAULT_UPSTREAM).trim().replace(/\/+$/, "");

  const url = new URL(request.url);
  const server = pickParam(url.searchParams.get("server"), ALLOWED_SERVER);
  const type = pickParam(url.searchParams.get("type"), ALLOWED_TYPE);
  const id = pickParam(url.searchParams.get("id"), ID_PATTERN);
  if (!server || !type || !id) {
    return jsonResponse({ error: "INVALID_PARAM", message: "server / type / id 参数不合法" }, 400, corsHeaders);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const upstreamUrl = `${upstream}?server=${encodeURIComponent(server)}&type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: { Accept: type === "lrc" ? "text/plain, */*" : "application/json" },
      signal: controller.signal,
      redirect: "manual",
    });

    // 处理 301/302 重定向（如 type=url 返回音乐 CDN 原始跳转），透传给前端播放器
    if (upstreamRes.status >= 300 && upstreamRes.status < 400 && upstreamRes.headers.get("location")) {
      return new Response(null, {
        status: upstreamRes.status,
        headers: {
          Location: upstreamRes.headers.get("location"),
          "Cache-Control": "public, max-age=3600",
          ...corsHeaders,
        },
      });
    }

    const text = await upstreamRes.text();
    const defaultContentType = type === "lrc" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8";
    // 歌单随曲目变化，缓存较短；歌词相对固定，可延长缓存
    return new Response(text, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": upstreamRes.headers.get("content-type") || defaultContentType,
        "Cache-Control": upstreamRes.ok ? (type === "lrc" ? "public, max-age=3600" : "public, max-age=60") : "no-store",
        ...corsHeaders,
      },
    });
  } catch (error) {
    return jsonResponse(
      { error: "UPSTREAM_UNREACHABLE", message: error?.message || "上游接口不可达" },
      502,
      corsHeaders,
    );
  } finally {
    clearTimeout(timer);
  }
}
