/**
 * 音乐歌单代理（Vercel Serverless Function）
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

  // 优先使用用户配置的私有上游，未配置时平滑回退到公共默认源，避免直接 502
  const upstream = (process.env.SONG_API_UPSTREAM || DEFAULT_UPSTREAM).trim().replace(/\/+$/, "");

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
      redirect: "manual",
    });

    if (upstreamRes.status >= 300 && upstreamRes.status < 400 && upstreamRes.headers.get("location")) {
      return res.redirect(upstreamRes.status, upstreamRes.headers.get("location"));
    }

    const text = await upstreamRes.text();
    const defaultContentType = type === "lrc" ? "text/plain; charset=utf-8" : "application/json; charset=utf-8";
    res.setHeader("Content-Type", upstreamRes.headers.get("content-type") || defaultContentType);
    res.setHeader("Cache-Control", upstreamRes.ok ? (type === "lrc" ? "public, max-age=3600" : "public, max-age=60") : "no-store");
    return res.status(upstreamRes.status).send(text);
  } catch (error) {
    return res.status(502).json({ error: "UPSTREAM_UNREACHABLE", message: error?.message || "上游接口不可达" });
  } finally {
    clearTimeout(timer);
  }
}
