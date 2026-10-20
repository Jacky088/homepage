/**
 * 音乐歌单代理（Cloudflare Pages / EdgeOne Pages 边缘函数）
 *
 * 路由：functions/api/song.js → /api/song
 * 与 Vercel 版（api/song.js）路径保持一致，因此前端在两个平台上都填 VITE_SONG_API=/api/song 即可。
 *
 * 为什么每个平台都要单独放一份：
 * - Vercel 识别的是项目根目录的 api/ 目录；
 * - EdgeOne Pages 识别的是 functions/ 目录（文件即路由）。
 *   两者互不通用：只部署 Vercel 版时，EdgeOne 上不存在 /api/song 这个处理器，
 *   请求会回落到静态资源并返回 index.html，前端解析 JSON 失败，表现为播放器初始化失败。
 *
 * 为什么需要代理：
 * 私人 Meting 接口若由前端直连，必须把域名写进 index.html 的 CSP connect-src，
 * 等于把地址提交进仓库；改成同源代理后，地址只放在服务端变量里，CSP 也不用改。
 *
 * 环境变量（Cloudflare Pages / EdgeOne Pages 项目设置 → 环境变量）：
 *   SONG_API_UPSTREAM = 你的 Meting 接口地址（**不要**加 VITE_ 前缀，否则会被打进前端产物）
 * 可选：
 *   ALLOWED_ORIGIN = https://你的域名（限制只有自己的站点能调用，防止被他人盗刷）
 *
 * 与前端降级的关系：
 * 本函数返回 5xx（未配置上游、上游超时等）时，前端 getPlayerList 会捕获并自动降级到
 * 内置备用接口，播放器不会直接报错，降级原因见浏览器控制台的 [music] 日志。
 */

// 与前端 SONG_API_TIMEOUT 保持一致：上游挂住时两边都别等太久
const FETCH_TIMEOUT = 8000;

// Meting 协议允许的取值，超出即拒绝，避免函数被当作开放代理
const ALLOWED_SERVER = new Set(["netease", "tencent"]);
const ALLOWED_TYPE = new Set(["song", "playlist", "album", "search", "artist", "lrc"]);
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
  const allowedOrigin = env.ALLOWED_ORIGIN;
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

  const upstream = (env.SONG_API_UPSTREAM || "").trim().replace(/\/+$/, "");
  if (!upstream) {
    // 返回 5xx 让前端走内置备用接口，而不是让播放器直接报错
    return jsonResponse(
      {
        error: "SONG_API_UPSTREAM_NOT_CONFIGURED",
        message: "未配置环境变量 SONG_API_UPSTREAM，请在 Cloudflare Pages / EdgeOne Pages 项目设置中添加",
      },
      502,
      corsHeaders,
    );
  }

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
    });
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
