// src/api/index.js

import fetchJsonp from "fetch-jsonp";

/**
 * 获取音乐播放列表（你已有代码，保留即可）
 */
export const getPlayerList = async (server, type, id) => {
  const res = await fetch(
    `${import.meta.env.VITE_SONG_API}?server=${server}&type=${type}&id=${id}`,
  );
  if (!res.ok) {
    throw new Error(`歌曲接口请求失败，状态码：${res.status}`);
  }
  const responseData = await res.json();

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
    const jsonpData = await fetchJsonp(url).then((res) => res.json());
    const domain = (
      jsonpData.req_0.data.sip.find((i) => !i.startsWith("http://ws")) ||
      jsonpData.req_0.data.sip[0]
    ).replace("http://", "https://");

    return data.map((v, i) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: domain + jsonpData.req_0.data.midurlinfo[i].purl,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  } else {
    return data.map((v) => ({
      name: v.name || v.title,
      artist: v.artist || v.author,
      url: v.url,
      cover: v.cover || v.pic,
      lrc: v.lrc,
    }));
  }
};

/**
 * 获取一言数据
 */
export const getHitokoto = async () => {
  const res = await fetch("https://v1.hitokoto.cn");
  if (!res.ok) {
    throw new Error(`一言接口请求失败，状态码：${res.status}`);
  }
  return await res.json();
};

/**
 * 天气相关接口
 */

// 高德API：获取地理位置信息
export const getAdcode = async (key) => {
  const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
  if (!res.ok) {
    throw new Error(`地理位置接口请求失败，状态码：${res.status}`);
  }
  return await res.json();
};

// 高德API：根据城市名获取地理位置编码 (adcode)
export const getAdcodeByCity = async (key, cityName) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/config/district?keywords=${encodeURIComponent(cityName)}&key=${key}&subdistrict=0`
  );
  if (!res.ok) {
    throw new Error(`城市编码接口请求失败，状态码：${res.status}`);
  }
  return await res.json();
};

// 高德API：根据城市编码获取天气信息
export const getWeather = async (key, city) => {
  const res = await fetch(
    `https://restapi.amap.com/v3/weather/weatherInfo?key=${key}&city=${city}`,
    { cache: "no-cache" }
  );
  if (!res.ok) {
    throw new Error(`天气接口请求失败，状态码：${res.status}`);
  }
  return await res.json();
};

// 备用天气接口（wttr.in）
export const getOtherWeather = async (city = "Shanghai") => {
  const res = await fetch(
    `https://wttr.in/${encodeURIComponent(city)}?format=j1&lang=zh`,
    { cache: "no-cache" }
  );
  if (!res.ok) throw new Error("备用天气接口请求失败");
  return await res.json();
};
