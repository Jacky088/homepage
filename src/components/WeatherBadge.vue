<template>
  <!-- 显隐由组件内部响应 store 状态（壁纸展示 / 设置页时隐藏），避免在多根组件上继承 v-show 指令 -->
  <div
    v-show="!store.backgroundShow && !store.setOpenState"
    class="weather-badge glass-pill"
    :style="badgeStyle"
    @click="togglePanel"
  >
    <!-- 加载中 -->
    <span v-if="loading" class="badge-loading">定位中…</span>
    <!-- 天气数据 -->
    <template v-else-if="weather.city && weather.temperature !== null">
      <span class="badge-icon">{{ weatherIcon }}</span>
      <!-- 可滚动文字区（城市 + 天气），过长时跑马灯 -->
      <span class="badge-text-wrap" ref="textWrapRef">
        <span class="badge-text" :class="{ 'is-marquee': needScroll }">
          <span class="badge-text-inner">
            <span class="badge-city">{{ weather.city }}</span>
            <span class="badge-weather">{{ weather.weather }}</span>
          </span>
          <span class="badge-text-inner clone" aria-hidden="true" v-if="needScroll">
            <span class="badge-city">{{ weather.city }}</span>
            <span class="badge-weather">{{ weather.weather }}</span>
          </span>
        </span>
      </span>
      <span class="badge-temp">{{ weather.temperature }}℃</span>
    </template>
    <!-- 获取失败 -->
    <span v-else class="badge-error" @click.stop="loadWeather(true)">天气获取失败</span>
  </div>

  <!-- 天气详情面板（最近三天天气预报） -->
  <Teleport to="body">
    <Transition name="badge-fade">
      <div v-show="panelShow" class="badge-panel" :style="panelStyle" @click.stop>
        <!-- 面板头部：当前城市与实时天气概览 -->
        <div class="panel-header">
          <div class="header-main">
            <div class="city-line">
              <span class="city-name">{{ weather.city || "未知城市" }}</span>
              <span class="forecast-tag">3天预报</span>
            </div>
            <div class="weather-sub">
              <span class="weather-cond">{{ weather.weather || "暂无信息" }}</span>
              <span class="dot">·</span>
              <span class="wind-info">{{ weather.winddirection }} {{ weather.windpower ? weather.windpower + "级" : "" }}</span>
            </div>
          </div>
          <div class="temp-now">
            {{ weather.temperature !== null ? weather.temperature : "--" }}<span class="unit">℃</span>
          </div>
        </div>

        <!-- 最近三天预报列表 -->
        <div class="forecast-list" v-if="forecastList && forecastList.length">
          <div
            v-for="(item, index) in forecastList"
            :key="item.date + index"
            class="forecast-card"
            :class="{ 'is-today': index === 0 }"
          >
            <!-- 日期 -->
            <div class="date-col">
              <span class="day-name">{{ item.dayName }}</span>
              <span class="date-detail">{{ item.weekday }} {{ item.date }}</span>
            </div>

            <!-- 天气状况与图标 -->
            <div class="weather-col">
              <span class="emoji">{{ item.icon }}</span>
              <span class="desc">{{ item.weather }}</span>
            </div>

            <!-- 温度区间与视觉条 -->
            <div class="temp-col">
              <span class="t-min">{{ item.tempMin }}°</span>
              <div class="t-bar-box">
                <div class="t-bar"></div>
              </div>
              <span class="t-max">{{ item.tempMax }}°</span>
            </div>
          </div>
        </div>

        <!-- 面板底部状态与刷新 -->
        <div class="panel-footer">
          <span class="footer-tip">
            <span v-if="weather.humidity">湿度 {{ weather.humidity }}% · </span>
            {{ weather.city }}气象数据
          </span>
          <span class="refresh-action" @click="loadWeather(true)" title="重新获取天气">
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            刷新
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { getUapiWeather, getAdcode, getWeather, getCityByIp, getOtherWeather } from "@/api";
import { showMessage } from "@/utils/message.js";
import { windDirZh, normalizeWindPower } from "@/utils/weather.js";
import { isCompactViewport } from "@/constants/breakpoint";
import { mainStore } from "@/store";

const store = mainStore();

const mainKey = import.meta.env.VITE_WEATHER_KEY;

const loading = ref(true);
const panelShow = ref(false);
const needScroll = ref(false);
const textWrapRef = ref(null);
const panelStyle = ref({});
const badgeStyle = ref({}); // 动态最大宽度（移动端），避免与左侧 logo 网址重叠
const forecastList = ref([]); // 最近三天预报列表

const weather = ref({
  city: null,
  weather: null,
  temperature: null,
  winddirection: null,
  windpower: null,
  humidity: null,
});

// 天气图标（根据天气文本匹配 emoji）
const getWeatherEmoji = (text) => {
  const t = text || "";
  if (t.includes("雷")) return "⛈";
  if (t.includes("雨夹雪")) return "🌨";
  if (t.includes("暴雪") || t.includes("大雪")) return "❄";
  if (t.includes("雪")) return "🌨";
  if (t.includes("暴雨") || t.includes("大雨")) return "🌧";
  if (t.includes("雨")) return "🌦";
  if (t.includes("雾") || t.includes("霾") || t.includes("沙") || t.includes("尘")) return "🌫";
  if (t.includes("阴")) return "☁";
  if (t.includes("云")) return "⛅";
  if (t.includes("晴")) return "☀";
  return "🌡";
};

const weatherIcon = computed(() => getWeatherEmoji(weather.value.weather));

// 高德天气描述转中文（高德本身就返回中文，这里兜底处理）
const amapWeatherZh = (weather) => {
  if (!weather) return "";
  const map = {
    晴: "晴",
    多云: "多云",
    少云: "少云",
    晴间多云: "晴间多云",
    阴: "阴",
    小雨: "小雨",
    中雨: "中雨",
    大雨: "大雨",
    暴雨: "暴雨",
    雷阵雨: "雷阵雨",
    冰雹: "冰雹",
    雨夹雪: "雨夹雪",
    小雪: "小雪",
    中雪: "中雪",
    大雪: "大雪",
    暴雪: "暴雪",
    雾: "雾",
    霾: "霾",
    冻雨: "冻雨",
    阵雨: "阵雨",
    阵雪: "阵雪",
    浮尘: "浮尘",
    扬沙: "扬沙",
    沙尘暴: "沙尘暴",
  };
  return map[weather] || weather;
};

// wttr.in 天气描述英文转中文（基于 WorldWeatherOnline 天气代码表）
const wttrWeatherZh = (text) => {
  if (!text) return "";
  const map = {
    Sunny: "晴",
    Clear: "晴",
    "Partly Cloudy": "局部多云",
    Cloudy: "多云",
    Overcast: "阴",
    Mist: "薄雾",
    "Patchy rain nearby": "附近有零星降雨",
    "Patchy snow nearby": "附近有零星降雪",
    "Patchy sleet nearby": "附近有零星雨夹雪",
    "Patchy freezing drizzle nearby": "附近有零星冻毛毛雨",
    "Thundery outbreaks in nearby": "附近有雷暴",
    "Blowing snow": "吹雪",
    Blizzard: "暴风雪",
    Fog: "雾",
    "Freezing fog": "冻雾",
    "Patchy light drizzle": "零星小毛毛雨",
    "Light drizzle": "小毛毛雨",
    "Freezing drizzle": "冻毛毛雨",
    "Heavy freezing drizzle": "强冻毛毛雨",
    "Patchy light rain": "零星小雨",
    "Light rain": "小雨",
    "Moderate rain at times": "时有中雨",
    "Moderate rain": "中雨",
    "Heavy rain at times": "时有大雨",
    "Heavy rain": "大雨",
    "Light freezing rain": "小冻雨",
    "Moderate or heavy freezing rain": "中到大冻雨",
    "Light sleet": "小雨夹雪",
    "Moderate or heavy sleet": "中到大雨夹雪",
    "Patchy light snow": "零星小雪",
    "Light snow": "小雪",
    "Patchy moderate snow": "零星中雪",
    "Moderate snow": "中雪",
    "Patchy heavy snow": "零星大雪",
    "Heavy snow": "大雪",
    "Ice pellets": "冰粒",
    "Light rain shower": "小阵雨",
    "Moderate or heavy rain shower": "中到大阵雨",
    "Torrential rain shower": "特大阵雨",
    "Light sleet showers": "小阵雨夹雪",
    "Moderate or heavy sleet showers": "中到大阵雨夹雪",
    "Light snow showers": "小阵雪",
    "Moderate or heavy snow showers": "中到大阵雪",
    "Light showers of ice pellets": "小阵冰粒",
    "Moderate or heavy showers of ice pellets": "中到大阵冰粒",
    "Patchy light rain in area with thunder": "附近有零星雷雨",
    "Moderate or heavy rain in area with thunder": "附近有中到大雷雨",
    "Patchy light snow in area with thunder": "附近有零星雷雪",
    "Moderate or heavy snow in area with thunder": "附近有中到大雷雪",
    Haze: "霾",
    "Smoky haze": "烟雾",
  };
  const key = text.trim();
  if (map[key]) return map[key];
  // 大小写不敏感匹配（wttr.in 不同地区可能返回不同大小写）
  for (const k in map) {
    if (key.toLowerCase() === k.toLowerCase()) return map[k];
  }
  return key;
};

// 检测文字是否需要滚动
const checkNeedScroll = () => {
  nextTick(() => {
    const wrap = textWrapRef.value;
    if (!wrap) return;
    const inner = wrap.querySelector(".badge-text-inner");
    if (!inner) return;
    needScroll.value = inner.scrollWidth > wrap.clientWidth;
  });
};

// 判断是否处于紧凑移动端模式（真正触屏移动设备且 ≤$bp-md，或任意设备极窄视口 ≤$bp-sm）
const isCompactHeader = () => {
  const isTouchMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  return isCompactViewport(window.innerWidth, isTouchMobile);
};

// 移动端：按 logo 旁网址的实际宽度动态限制胶囊最大宽度，避免与网址重叠
const updateBadgeWidth = () => {
  if (!isCompactHeader()) {
    badgeStyle.value = {};
    return;
  }
  const logo = document.querySelector(".message .logo");
  if (!logo) {
    badgeStyle.value = {};
    return;
  }
  const logoRect = logo.getBoundingClientRect();
  // 胶囊可用宽度 = 视口宽度 - logo 网址右边界 - 菜单按钮(~46px) - 边距
  const available = window.innerWidth - logoRect.right - 62;
  const maxW = Math.max(90, Math.min(available, 200));
  badgeStyle.value = { maxWidth: `${maxW}px` };
  checkNeedScroll();
};

// 解析 wttr.in 的未来 3 天预报
const parseWttrForecast = (wttrData) => {
  if (!wttrData || !Array.isArray(wttrData.weather)) return [];
  const dayNames = ["今天", "明天", "后天"];
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  return wttrData.weather.slice(0, 3).map((w, i) => {
    const noon = (w.hourly && (w.hourly[4] || w.hourly[3] || w.hourly[0])) || {};
    const rawDesc =
      (noon.lang_zh && noon.lang_zh[0] && noon.lang_zh[0].value) ||
      (noon.weatherDesc && noon.weatherDesc[0] && noon.weatherDesc[0].value) ||
      "晴";
    const desc = wttrWeatherZh(rawDesc);
    const dateObj = new Date(w.date);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekday = weekdays[dateObj.getDay()] || "";

    const windDir = noon.winddir16Point ? windDirZh(noon.winddir16Point) : "微风";
    const windPower = noon.windspeedKmph ? `${Math.round(Number(noon.windspeedKmph) / 5)}级` : "";

    return {
      date: `${month}月${day}日`,
      weekday,
      dayName: dayNames[i] || `${i}天后`,
      weather: desc,
      icon: getWeatherEmoji(desc),
      tempMin: Math.round(Number(w.mintempC || 0)),
      tempMax: Math.round(Number(w.maxtempC || 0)),
      wind: `${windDir} ${windPower}`.trim(),
    };
  });
};

// 解析高德天气预报 (casts)
const parseAmapForecast = (casts) => {
  if (!Array.isArray(casts)) return [];
  const dayNames = ["今天", "明天", "后天"];
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  return casts.slice(0, 3).map((c, i) => {
    const desc = amapWeatherZh(c.dayweather || c.nightweather || "晴");
    const dateObj = new Date(c.date);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const weekday = weekdays[dateObj.getDay()] || (c.week ? `周${c.week}` : "");

    const power = normalizeWindPower(c.daypower);
    const windText = `${c.daywind || "微风"}${power ? " " + power + "级" : ""}`.trim();

    return {
      date: `${month}月${day}日`,
      weekday,
      dayName: dayNames[i] || `${i}天后`,
      weather: desc,
      icon: getWeatherEmoji(desc),
      tempMin: Math.round(Number(c.nighttemp || c.daytemp || 0)),
      tempMax: Math.round(Number(c.daytemp || c.nighttemp || 0)),
      wind: windText,
    };
  });
};

// 预报兜底生成器（保证任何离线或异常情况下均有平滑三天预报）
const generateFallbackForecast = (currentWeather, currentTemp) => {
  const dayNames = ["今天", "明天", "后天"];
  const baseTemp = Number(currentTemp) || 20;
  const now = new Date();
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weathers = [currentWeather || "晴", "多云", "晴"];

  return [0, 1, 2].map((i) => {
    const d = new Date(now.getTime() + i * 24 * 3600 * 1000);
    const desc = weathers[i];
    return {
      date: `${d.getMonth() + 1}月${d.getDate()}日`,
      weekday: weekdays[d.getDay()],
      dayName: dayNames[i],
      weather: desc,
      icon: getWeatherEmoji(desc),
      tempMin: baseTemp - (i === 0 ? 3 : i === 1 ? 4 : 2),
      tempMax: baseTemp + (i === 0 ? 3 : i === 1 ? 2 : 4),
      wind: "微风 2级",
    };
  });
};

// 主源：uapis 天气（不传城市时按访客 IP 自动定位，无需额外定位接口）
const loadByUapis = async () => {
  const data = await getUapiWeather();
  const city = data.city || data.province || "未知城市";
  const desc = amapWeatherZh(data.weather);
  const currentTemp = data.temperature;

  weather.value = {
    city,
    weather: desc,
    temperature: currentTemp,
    winddirection: data.wind_direction || "未知",
    windpower: normalizeWindPower(data.wind_power),
    humidity: data.humidity || null,
  };

  // 尝试拉取未来三天预报（通过备用源 wttr.in），失败时平滑兜底
  try {
    const wttrData = await getOtherWeather(city);
    const parsed = parseWttrForecast(wttrData);
    if (parsed.length >= 3) {
      forecastList.value = parsed;
      return;
    }
  } catch (err) {
    console.warn("预报数据获取稍候重试，启用兜底预报:", err);
  }
  forecastList.value = generateFallbackForecast(desc, currentTemp);
};

// 高德 IP 定位 + 天气
const loadByAmap = async () => {
  const adCodeRes = await getAdcode(mainKey);
  if (adCodeRes.infocode !== "10000") throw new Error("地区查询失败");
  const city = adCodeRes.city;
  const adcode = adCodeRes.adcode;

  const [liveRes, forecastRes] = await Promise.all([
    getWeather(mainKey, adcode, "base"),
    getWeather(mainKey, adcode, "all").catch(() => null),
  ]);

  if (liveRes.infocode !== "10000") throw new Error("天气查询失败");
  const live = liveRes.lives[0];
  const desc = amapWeatherZh(live.weather);
  const currentTemp = live.temperature;

  weather.value = {
    city,
    weather: desc,
    temperature: currentTemp,
    winddirection: live.winddirection,
    windpower: normalizeWindPower(live.windpower),
    humidity: live.humidity || null,
  };

  if (forecastRes && forecastRes.forecasts && forecastRes.forecasts[0]?.casts) {
    const parsed = parseAmapForecast(forecastRes.forecasts[0].casts);
    if (parsed.length >= 3) {
      forecastList.value = parsed;
      return;
    }
  }
  forecastList.value = generateFallbackForecast(desc, currentTemp);
};

// IP 定位 + wttr.in
const loadByIp = async () => {
  const cityInfo = await getCityByIp();
  if (!cityInfo || !cityInfo.en) throw new Error("定位城市为空");

  // 用英文城市名查询 wttr.in（更准确），中文名展示
  const result = await getOtherWeather(cityInfo.en);
  if (!result || !result.current_condition || result.current_condition.length === 0) {
    throw new Error("备用天气接口返回错误");
  }
  const cond = result.current_condition[0];
  let weatherText = "";
  const zhValue = cond.lang_zh && cond.lang_zh[0] && cond.lang_zh[0].value;
  const enValue = cond.weatherDesc && cond.weatherDesc[0] && cond.weatherDesc[0].value;
  if (zhValue && !/^[a-zA-Z\s]+$/.test(zhValue)) {
    weatherText = zhValue;
  } else {
    const source = zhValue || enValue || "";
    weatherText = wttrWeatherZh(source);
  }
  weather.value = {
    city: cityInfo.zh || cityInfo.en,
    weather: weatherText,
    temperature: cond.temp_C || "0",
    winddirection: windDirZh(cond.winddir16Point) || "未知",
    windpower: cond.windspeedKmph ? `${Math.round(Number(cond.windspeedKmph) / 5)}` : "0",
    humidity: cond.humidity || null,
  };

  const parsed = parseWttrForecast(result);
  if (parsed.length >= 3) {
    forecastList.value = parsed;
  } else {
    forecastList.value = generateFallbackForecast(weatherText, cond.temp_C);
  }
};

// 加载天气
const loadWeather = async (silent) => {
  loading.value = true;
  try {
    // 降级链：uapis（主源，国内稳定）→ 高德（需自配 Key）→ ipinfo/ipapi + wttr.in（境外兜底）
    const sources = [{ name: "uapis", run: loadByUapis }];
    if (mainKey) sources.push({ name: "高德", run: loadByAmap });
    sources.push({ name: "境外 IP + wttr.in", run: loadByIp });

    let lastError = null;
    for (const source of sources) {
      try {
        await source.run();
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        console.warn(`天气源「${source.name}」获取失败，尝试降级：`, error);
      }
    }
    if (lastError) throw lastError;
  } catch (error) {
    console.error("天气加载失败:", error);
    weather.value = {
      city: null,
      weather: null,
      temperature: null,
      winddirection: null,
      windpower: null,
      humidity: null,
    };
    forecastList.value = [];
    if (!silent) {
      showMessage({ message: "天气信息获取失败", type: "warning", grouping: true });
    }
  } finally {
    loading.value = false;
    updateBadgeWidth();
    checkNeedScroll();
  }
};

// 根据胶囊实时尺寸更新面板位置，做好各尺寸屏幕的安全边界适配
const updatePanelPosition = () => {
  const badge = document.querySelector(".weather-badge");
  if (!badge) return;
  const rect = badge.getBoundingClientRect();
  const screenWidth = window.innerWidth;
  const isMobile = screenWidth <= 480;
  // 移动端：自适应宽度（最大不超过 330px，两侧至少留 12px 间距）
  const width = isMobile ? Math.min(screenWidth - 24, 330) : 320;
  // 面板默认右边缘对齐胶囊右边缘
  let left = rect.right - width;
  // 边界保护：避免面板超出视口左右边缘
  if (left < 12) left = 12;
  if (left + width > screenWidth - 12) {
    left = screenWidth - 12 - width;
  }
  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${left}px`,
    width: `${width}px`,
  };
};

// 打开 / 关闭面板
const togglePanel = () => {
  if (loading.value) return;
  panelShow.value = !panelShow.value;
  if (panelShow.value) updatePanelPosition();
};

// 点击外部关闭面板
const handleClickOutside = (e) => {
  const badge = document.querySelector(".weather-badge");
  if (badge && badge.contains(e.target)) return;
  panelShow.value = false;
};

// 监听胶囊尺寸变化，面板打开时实时同步宽度与位置
let badgeObserver = null;
let logoObserver = null;

// 窗口尺寸变化：重新计算胶囊上限 + 跑马灯
const onResize = () => {
  updateBadgeWidth();
  checkNeedScroll();
};

onMounted(() => {
  loadWeather();
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("resize", onResize);
  updateBadgeWidth();
  const badge = document.querySelector(".weather-badge");
  if (badge && "ResizeObserver" in window) {
    badgeObserver = new ResizeObserver(() => {
      if (panelShow.value) updatePanelPosition();
    });
    badgeObserver.observe(badge);
  }
  // 监听 logo 元素尺寸变化（如字体/图片加载完成），同步胶囊上限
  const logo = document.querySelector(".message .logo");
  if (logo && "ResizeObserver" in window) {
    logoObserver = new ResizeObserver(() => updateBadgeWidth());
    logoObserver.observe(logo);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("resize", onResize);
  if (badgeObserver) badgeObserver.disconnect();
  if (logoObserver) logoObserver.disconnect();
});
</script>

<style lang="scss" scoped>
.weather-badge {
  position: relative;
  display: inline-flex;
  justify-content: space-between;
  min-width: 160px;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border-radius: 19px;
  font-size: 0.9rem;
  color: #fff;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  transition:
    padding 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    font-size 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    min-width 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-1px) scale(1.02);
  }
  &:active {
    transform: translateY(0) scale(0.96);
  }

  .badge-icon {
    font-size: 1rem;
    line-height: 1;
    flex-shrink: 0;
  }
  // 文字滚动容器：限制最大宽度
  .badge-text-wrap {
    display: block;
    max-width: 140px;
    overflow: hidden;
    white-space: nowrap;
    flex-shrink: 1;
    transition: max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .badge-text {
    display: inline-flex;
    white-space: nowrap;
    opacity: 0.85;

    &.is-marquee {
      display: flex;
      animation: badge-marquee 8s linear infinite;
    }
    &.is-marquee:hover {
      animation-play-state: paused;
    }

    .badge-text-inner {
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      &.clone {
        padding-left: 1.5em; // 两段文字间距
      }
    }
  }
  .badge-city {
    margin-right: 6px;
  }
  .badge-temp {
    font-weight: 600;
    flex-shrink: 0;
  }
  .badge-loading {
    opacity: 0.7;
  }
  .badge-error {
    opacity: 0.7;
    font-size: 0.8rem;
  }

  @include mobile-viewport {
    padding: 0 12px;
    font-size: 0.85rem;
    min-width: 0; // 允许 maxWidth 收窄生效，避免与 logo 网址重叠

    .badge-text-wrap {
      max-width: 100px;
    }
  }
}

// 跑马灯动画
@keyframes badge-marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

// 天气详情面板
.badge-panel {
  position: fixed;
  z-index: 105;
  padding: 16px 18px 14px;
  border-radius: 20px;
  background:
    linear-gradient(
      155deg,
      rgba(255, 255, 255, 0.14) 0%,
      rgba(255, 255, 255, 0.04) 40%,
      rgba(0, 0, 0, 0.42) 100%
    ),
    rgba(14, 16, 22, 0.78);
  backdrop-filter: blur(28px) saturate(170%);
  -webkit-backdrop-filter: blur(28px) saturate(170%);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.55),
    0 4px 16px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  color: #fff;
  box-sizing: border-box;
  transform-origin: top right;

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;

    .header-main {
      display: flex;
      flex-direction: column;
      gap: 3px;

      .city-line {
        display: flex;
        align-items: center;
        gap: 8px;

        .city-name {
          font-size: 1.15rem;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.3px;
        }

        .forecast-tag {
          font-size: 0.68rem;
          padding: 1px 7px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.14);
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.3px;
          line-height: 1.4;
        }
      }

      .weather-sub {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.82rem;
        color: rgba(255, 255, 255, 0.68);

        .dot {
          opacity: 0.5;
        }
      }
    }

    .temp-now {
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      color: #fff;
      display: flex;
      align-items: baseline;

      .unit {
        font-size: 0.95rem;
        font-weight: 400;
        margin-left: 2px;
        opacity: 0.85;
      }
    }
  }

  .forecast-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);

    .forecast-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 10px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition:
        background 0.2s,
        border-color 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      &.is-today {
        background: rgba(255, 255, 255, 0.09);
        border-color: rgba(255, 255, 255, 0.15);

        .date-col .day-name {
          color: #fff;
        }
      }

      .date-col {
        display: flex;
        flex-direction: column;
        width: 68px;
        flex-shrink: 0;

        .day-name {
          font-size: 0.86rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.92);
        }

        .date-detail {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.48);
          margin-top: 1px;
          white-space: nowrap;
        }
      }

      .weather-col {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1;
        padding: 0 8px;

        .emoji {
          font-size: 1.15rem;
          line-height: 1;
        }

        .desc {
          font-size: 0.84rem;
          color: rgba(255, 255, 255, 0.85);
          white-space: nowrap;
        }
      }

      .temp-col {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;

        .t-min {
          font-size: 0.82rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.52);
          width: 22px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .t-bar-box {
          width: 32px;
          height: 4px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 2px;
          overflow: hidden;

          .t-bar {
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, #4facfe 0%, #00f2fe 55%, #f6d365 100%);
            border-radius: 2px;
          }
        }

        .t-max {
          font-size: 0.86rem;
          font-weight: 600;
          color: #fff;
          width: 24px;
          text-align: left;
          font-variant-numeric: tabular-nums;
        }
      }
    }
  }

  .panel-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    .footer-tip {
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.42);
    }

    .refresh-action {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.65);
      cursor: pointer;
      user-select: none;
      transition: color 0.2s;

      &:hover {
        color: #fff;
      }
    }
  }

  @include mobile-viewport {
    padding: 14px 14px 12px;
    border-radius: 18px;

    .forecast-list .forecast-card {
      padding: 6px 8px;

      .date-col {
        width: 60px;
      }

      .temp-col .t-bar-box {
        width: 24px;
      }
    }
  }
}

// 统一气泡面板过渡动画
.badge-fade-enter-active,
.badge-fade-leave-active {
  transition:
    opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.badge-fade-leave-active {
  transition-duration: 0.25s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.badge-fade-enter-from,
.badge-fade-leave-to {
  opacity: 0;
  transform: scale(0.94) translateY(-10px);
}
</style>
