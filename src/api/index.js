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

/**
 * 将城市英文/拼音名转为中文（用于界面展示）
 */
const zhCityName = (name) => {
  if (!name) return "";
  const map = {
    beijing: "北京",
    shanghai: "上海",
    guangzhou: "广州",
    shenzhen: "深圳",
    chengdu: "成都",
    hangzhou: "杭州",
    wuhan: "武汉",
    nanjing: "南京",
    suzhou: "苏州",
    tianjin: "天津",
    chongqing: "重庆",
    xian: "西安",
    qingdao: "青岛",
    shenyang: "沈阳",
    dalian: "大连",
    zhengzhou: "郑州",
    changsha: "长沙",
    xiamen: "厦门",
    fuzhou: "福州",
    kunming: "昆明",
    nanning: "南宁",
    haerbin: "哈尔滨",
    changchun: "长春",
    jinan: "济南",
    taiyuan: "太原",
    hefei: "合肥",
    nanchang: "南昌",
    guiyang: "贵阳",
    lanzhou: "兰州",
    yinchuan: "银川",
    huhehaote: "呼和浩特",
    urumqi: "乌鲁木齐",
    lasa: "拉萨",
    xining: "西宁",
    shijiazhuang: "石家庄",
    hongkong: "香港",
    "hong kong": "香港",
    kowloon: "九龙",
    "tsuen wan": "荃湾",
    "tseung kwan o": "将军澳",
    "sha tin": "沙田",
    "tuen mun": "屯门",
    "yuen long": "元朗",
    "tai po": "大埔",
    "sham shui po": "深水埗",
    macau: "澳门",
    taipei: "台北",
    "new taipei": "新北",
    taichung: "台中",
    kaohsiung: "高雄",
    tainan: "台南",
    taoyuan: "桃园",
  };
  return map[name.trim().toLowerCase()] || name;
};

/**
 * 根据 IP 定位城市（免费接口，无需 key，均支持浏览器 CORS）
 * 多个服务按顺序降级，提高可用性
 * @returns {Promise<{en: string, zh: string}>} en 用于查询 wttr.in，zh 用于界面展示
 */
export const getCityByIp = async () => {
  const services = [
    async () => {
      const res = await fetch("https://ipinfo.io/json", { cache: "no-cache" });
      if (!res.ok) throw new Error("ipinfo.io 请求失败");
      const data = await res.json();
      if (!data.city) throw new Error("ipinfo.io 定位失败");
      return data.city;
    },
    async () => {
      const res = await fetch("https://ipapi.co/json/", { cache: "no-cache" });
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
