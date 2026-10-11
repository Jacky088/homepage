// src/api/index.js

import fetchJsonp from "fetch-jsonp";

/**
 * JSONP 端点域名白名单：仅允许音乐平台官方 CDN，
 * 防止上游 Meting API 被劫持时注入任意脚本执行
 */
const JSONP_ALLOWED_HOSTS = [
  "music.163.com",
  ".music.126.net",
  ".qq.com",
  ".qqmusic.qq.com",
  ".music.tc.qq.com",
  ".ws.stream.qqmusic.qq.com",
  ".dl.stream.qqmusic.qq.com",
  ".isure.stream.qqmusic.qq.com",
];

const isAllowedJsonpUrl = (rawUrl) => {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    return JSONP_ALLOWED_HOSTS.some((pattern) =>
      pattern.startsWith(".")
        ? host === pattern.slice(1) || host.endsWith(pattern)
        : host === pattern || host.endsWith(`.${pattern}`),
    );
  } catch {
    return false;
  }
};

/**
 * 音频地址统一升级为 https
 * 上游 Meting API 经常返回 http:// 的 CDN 地址，而：
 * - 站点部署在 HTTPS 下，浏览器会按混合内容直接拦截；
 * - index.html 的 CSP `media-src 'self' https: blob:` 也会拒绝 http 请求。
 * 两条都会让播放器报 "audio error" 并自动跳到下一首。
 * 音乐 CDN 均支持 https（上方 QQ 分支的 domain 也是这么处理的）。
 */
const toHttps = (url) => (typeof url === "string" ? url.replace(/^http:\/\//, "https://") : url);

/**
 * 内置备用接口：未配置自定义接口时直接使用它，
 * 配置了则先用自定义接口，失败（超时 / 非 2xx / 数据不合规）才降级到这里。
 * 换成别的备用接口时，记得同步放行 index.html 里的 CSP connect-src。
 */
const DEFAULT_SONG_API = "https://api.injahow.cn/meting/";

// 单次歌单请求超时：接口挂起时必须能及时降级，否则播放器会一直转圈
const SONG_API_TIMEOUT = 8000;

/**
 * 请求单个 Meting 接口并整理成播放器可用的结构
 * 任何一步不合规都直接抛错，由 getPlayerList 决定是否降级
 */
const fetchSongList = async (apiBase, server, type, id) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SONG_API_TIMEOUT);
  let res;
  try {
    res = await fetch(`${apiBase}?server=${server}&type=${type}&id=${id}`, {
      signal: controller.signal,
    });
  } catch (err) {
    // 超时与网络错误都归到“接口不可用”，交给上层降级
    throw new Error(err?.name === "AbortError" ? "请求超时" : "网络请求失败");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`歌曲接口请求失败，状态码：${res.status}`);
  }

  // 只放行 JSON：路径在当前平台不存在时（例如只给 Vercel 配了 api/song 却部署到 EdgeOne），
  // 平台会把请求回落到静态资源并返回 index.html，这里要给出可定位的错误，
  // 而不是让 JSON 解析异常带着一行莫名其妙的堆栈冒出去
  let responseData;
  try {
    responseData = await res.json();
  } catch {
    throw new Error(`歌曲接口返回的不是 JSON，检查一下 ${apiBase} 这个路径在当前平台是否生效`);
  }

  // 处理返回数据格式：可能是 { value: [...] } 或直接是 [...]
  let data = Array.isArray(responseData) ? responseData : responseData.value;

  // 校验返回数据的有效性
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("歌曲接口返回数据为空或格式不正确");
  }

  // 检查第一首歌的 URL 格式
  const firstSong = data[0];
  const songUrl = firstSong.url;

  if (!songUrl) {
    throw new Error("歌曲接口返回的 URL 为空");
  }

  if (songUrl.startsWith("@")) {
    // eslint-disable-next-line no-unused-vars
    const [handle, jsonpCallback, jsonpCallbackFunction, url] = songUrl.split("@").slice(1);
    if (!url || !isAllowedJsonpUrl(url)) {
      throw new Error("歌曲接口返回的 JSONP 地址不在允许的域名白名单内，已阻止执行");
    }
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const domain = (
      jsonpData.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
      jsonpData.req_0.data.sip[0]
    ).replace("http://", "https://");

    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: toHttps(domain + jsonpData.req_0.data.midurlinfo[i].purl),
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }

  return data.map((v) => ({
    name: v.name || v.title,
    artist: v.artist || v.author,
    url: toHttps(v.url),
    cover: v.cover || v.pic,
    lrc: v.lrc,
  }));
};

/**
 * 获取音乐播放列表：优先自定义接口，无效则自动降级到内置备用接口
 */
export const getPlayerList = async (server, type, id) => {
  const custom = (import.meta.env.VITE_SONG_API || "").trim().replace(/\/+$/, "");
  const fallback = DEFAULT_SONG_API.replace(/\/+$/, "");
  // 自定义接口没填、或填的和备用接口重复时，只请求一次
  const candidates = [custom, fallback].filter(
    (base, i, arr) => base && arr.indexOf(base) === i,
  );

  const failures = [];
  for (const apiBase of candidates) {
    try {
      return await fetchSongList(apiBase, server, type, id);
    } catch (err) {
      failures.push(`${apiBase} → ${err.message}`);
      console.warn(`[music] 歌单接口不可用，${err.message}`, apiBase);
    }
  }

  throw new Error(`歌单接口全部不可用：${failures.join("；")}`);
};

/**
 * 获取一言数据
 * 三级降级链：
 * 1. uapis 语料（句子最新，无出处字段；部分网络环境 fetch 会被 CDN 拦截）
 * 2. hitokoto 文学分类（ACAO:* 全网可达，语料较新；加防缓存参数避免 CDN 返回重复句）
 * 3. hitokoto 默认分类（终极兜底，语料偏经典）
 */
export const getHitokoto = async () => {
  // 1. uapis：无出处，from 置空，界面隐藏出处行
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://uapis.cn/api/v1/saying", {
      signal: controller.signal,
      referrerPolicy: "no-referrer",
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`一言接口请求失败，状态码：${res.status}`);
    const data = await res.json();
    if (!data || typeof data.text !== "string" || !data.text.trim()) {
      throw new Error("一言接口返回数据为空");
    }
    return { hitokoto: data.text.trim(), from: "", hasFrom: false };
  } catch {
    // 2. hitokoto 文学分类：语料较新（2022-2026），显示出处
    try {
      const res = await fetch(
        `https://v1.hitokoto.cn/?c=d&max_length=40&_n=${Math.random().toString(36).slice(2)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`一言接口请求失败，状态码：${res.status}`);
      const result = await res.json();
      if (!result.hitokoto) throw new Error("一言接口返回数据为空");
      return { hitokoto: result.hitokoto, from: result.from, hasFrom: true };
    } catch {
      // 3. hitokoto 默认：终极兜底
      const res = await fetch("https://v1.hitokoto.cn");
      if (!res.ok) {
        throw new Error(`一言接口请求失败，状态码：${res.status}`);
      }
      const result = await res.json();
      return { hitokoto: result.hitokoto, from: result.from, hasFrom: true };
    }
  }
};

/**
 * 天气相关接口
 */

/**
 * 带超时的 fetch
 * 天气降级链上的服务（尤其境外免费接口）经常出现「连接挂起但不报错」，
 * 不设超时会让组件永久停留在 loading 态，因此统一强制超时。
 */
const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`请求超时（${timeout}ms）：${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

/**
 * uapis 天气接口（主源）
 * 文档：https://uapis.cn/docs/api-reference/get-misc-weather
 * - 前端只请求同域代理 {VITE_UAPI_BASE}/weather，API Key 由服务端注入
 *   （本地开发见 vite.config.js 的 dev proxy，线上见 api/weather.js），
 *   因此 Key 不会出现在前端产物中
 * - 不传 city 时按访客 IP 自动定位，一个请求即可替代 ipinfo / ipapi + wttr.in 整条链路
 * - city 支持中文（北京）与英文（Tokyo）
 */
const UAPI_BASE = (import.meta.env.VITE_UAPI_BASE || "/uapi").replace(/\/+$/, "");

export const getUapiWeather = async (city) => {
  const params = new URLSearchParams();
  if (city) params.set("city", city);

  const res = await fetchWithTimeout(`${UAPI_BASE}/weather?${params.toString()}`, {
    cache: "no-cache",
  });
  const data = await res.json().catch(() => null);

  // 该接口的错误返回形式不统一：既有 4xx/5xx + {code, message}，
  // 也有 HTTP 200 + {error: "LOCATION_NOT_FOUND"}，两者都必须拦截
  if (!res.ok) {
    const reason = data && (data.message || data.error);
    throw new Error(`天气接口请求失败（${res.status}${reason ? "：" + reason : ""}）`);
  }
  if (!data || data.error) {
    throw new Error(`天气接口返回错误：${(data && data.error) || "未知错误"}`);
  }
  if (!data.weather && data.temperature === undefined) {
    throw new Error(`天气接口返回错误：${data.code || "数据为空"}`);
  }
  return data;
};

/**
 * 高德 API 基地址：
 * - 默认直连 restapi.amap.com（key 会暴露在前端产物中，仅测试用）
 * - 配置 VITE_AMAP_BASE 后走自建代理（如 Cloudflare Worker），key 由代理注入，
 *   此时前端不再需要 VITE_WEATHER_KEY
 */
const AMAP_BASE = (import.meta.env.VITE_AMAP_BASE || "https://restapi.amap.com").replace(/\/+$/, "");

// 高德API：获取地理位置信息
export const getAdcode = async (key) => {
  const res = await fetchWithTimeout(`${AMAP_BASE}/v3/ip?key=${key}`);
  if (!res.ok) {
    throw new Error(`地理位置接口请求失败，状态码：${res.status}`);
  }
  return await res.json();
};

// 高德API：根据城市编码获取天气信息
export const getWeather = async (key, city) => {
  const res = await fetchWithTimeout(
    `${AMAP_BASE}/v3/weather/weatherInfo?key=${key}&city=${city}`,
    { cache: "no-cache" }
  );
  if (!res.ok) {
    throw new Error(`天气接口请求失败，状态码：${res.status}`);
  }
  return await res.json();
};

// 备用天气接口（wttr.in）
export const getOtherWeather = async (city = "Shanghai") => {
  const res = await fetchWithTimeout(
    `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=zh`,
    { cache: "no-cache" }
  );
  if (!res.ok) throw new Error("备用天气接口请求失败");
  return await res.json();
};

/**
 * 将城市英文/拼音名转为中文（用于界面展示）
 * 字典数据来自 src/utils/cityDict.json（覆盖国内+全球主要城市+常见别名）
 * 查不到时原样返回，保证不报错、不丢失信息
 */
import cityDict from "@/utils/cityDict.json";

const zhCityName = (name) => {
  if (!name) return "";
  return cityDict[name.trim().toLowerCase()] || name.trim();
};

/**
 * 根据 IP 定位城市（免费接口，无需 key，均支持浏览器 CORS）
 * 多个服务按顺序降级，提高可用性
 * @returns {Promise<{en: string, zh: string}>} en 用于查询 wttr.in，zh 用于界面展示
 */
export const getCityByIp = async () => {
  const services = [
    async () => {
      const res = await fetchWithTimeout("https://ipinfo.io/json", { cache: "no-cache" });
      if (!res.ok) throw new Error("ipinfo.io 请求失败");
      const data = await res.json();
      if (!data.city) throw new Error("ipinfo.io 定位失败");
      return data.city;
    },
    async () => {
      const res = await fetchWithTimeout("https://ipapi.co/json/", { cache: "no-cache" });
      if (!res.ok) throw new Error("ipapi.co 请求失败");
      const data = await res.json();
      if (!data.city) throw new Error("ipapi.co 定位失败");
      return data.city;
    },
  ];

  let lastError = null;
  for (const service of services) {
    try {
      const enCity = await service();
      if (enCity) {
        return {
          en: enCity.trim(),
          zh: zhCityName(enCity),
        };
      }
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("IP 定位失败");
};
