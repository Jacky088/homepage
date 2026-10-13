/**
 * 音乐歌单代理（Vercel Serverless Function）
 *
 * 为什么需要它：
 * 1. 前端直接请求私人 Meting 接口，必须把它的域名写进 index.html 的 CSP connect-src，
 *    等于把私人地址提交进仓库（这正是要避免的）；
 * 2. VITE_ 前缀的变量会被打进前端产物，同样会暴露地址。
 * 因此把上游地址放在服务端变量 SONG_API_UPSTREAM 里，前端只请求同源的 /api/song。
 *
 * 为什么不是「随便转发」：
 * 这个函数挂在公网，若接受任意 URL 就成了免费的开放代理，会被拿去刷你的私人接口。
 * 所以这里只放行 server / type / id 三个参数，并对取值做白名单校验。
 *
 * 部署（Vercel）：
 * 1. Settings → Environment Variables 添加 SONG_API_UPSTREAM（**不要**加 VITE_ 前缀），
 *    值为你的 Meting 接口地址，例如 https://你的接口地址/api
 * 2. 再添加 VITE_SONG_API = /api/song（这个是前端变量，必须以 VITE_ 开头）
 * 3. 无需改 vercel.json：/api/song 会自动路由到本文件
 *
 * 与前端降级的关系：
 * 本函数返回 5xx（未配置上游、上游超时等）时，前端 getPlayerList 会捕获并自动降级到
 * 内置备用接口，页面不会白屏或报错，降级原因可在浏览器控制台的 [music] 日志里看到。
 */

// 与前端 SONG_API_TIMEOUT 保持一致：上游挂住时两边都别等太久
const FETCH_TIMEOUT = 8000;

// Meting 协议允许的取值，超出即拒绝，避免函数被当作开放代理
const ALLOWED_SERVER = new Set(["netease", "tencent"]);
const ALLOWED_TYPE = new Set(["song", "playlist", "album", "search", "artist", "lrc"]);
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** 取 query 里唯一合法的值，非法或缺失一律返回 null */
const pickParam = (value, pattern) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return pattern instanceof Set ? (pattern.has(trimmed) ? trimmed : null) : pattern.test(trimmed) ? trimmed : null;
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  // 可选来源校验：防止函数被他人当作免费接口盗刷（与 api/weather.js 保持一致）
  // 可选来源校验：防止函数被他人当作免费接口盗刷（与 api/weather.js 保持一致）
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin) {
    const rawOrigin = req.headers.origin || req.headers.referer || "";
    let isAllowed = false;
    let matchedOrigin = "";
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
    if (matchedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", matchedOrigin);
      res.setHeader("Vary", "Origin");
    }
  }

  const upstream = (process.env.SONG_API_UPSTREAM || "").trim().replace(/\/+$/, "");
  if (!upstream) {
    // 返回 5xx 让前端走内置备用接口，而不是让播放器直接报错
    return res.status(502).json({
      error: "SONG_API_UPSTREAM_NOT_CONFIGURED",
      message: "服务端未配置 SONG_API_UPSTREAM，请在部署平台的 Environment Variables 中添加",
    });
  }

  const query = req.query || {};
  const server = pickParam(query.server, ALLOWED_SERVER);
  const type = pickParam(query.type, ALLOWED_TYPE);
  const id = pickParam(query.id, ID_PATTERN);
  if (!server || !type || !id) {
    return res.status(400).json({ error: "INVALID_PARAM", message: "server / type / id 参数不合法" });
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
    res.setHeader("Content-Type", upstreamRes.headers.get("content-type") || defaultContentType);
    // 歌单随曲目变化，缓存较短；歌词相对固定，可延长缓存
    res.setHeader("Cache-Control", upstreamRes.ok ? (type === "lrc" ? "public, max-age=3600" : "public, max-age=60") : "no-store");
    return res.status(upstreamRes.status).send(text);
  } catch (error) {
    return res.status(502).json({
      error: "UPSTREAM_UNREACHABLE",
      message: error?.message || "上游接口不可达",
    });
  } finally {
    clearTimeout(timer);
  }
}
