<template>
  <!-- 显隐由组件内部响应 store 状态（壁纸展示 / 设置页时隐藏），避免在多根组件上继承 v-show 指令 -->
  <div
    v-show="!store.backgroundShow && !store.setOpenState"
    class="weather-badge glass-pill"
    :style="badgeStyle"
    title="点击查看天气详情"
    @click="togglePanel"
  >
    <!-- 加载中 -->
    <span v-if="loading" class="badge-loading">定位中…</span>
    <!-- 天气数据（城市、天气、温度同等间隙排列，超宽时自动跑马灯） -->
    <template v-else-if="weather.city && weather.temperature !== null">
      <WeatherIcon :name="weather.weather" :size="16" class="badge-icon-svg" />
      <span class="badge-content-wrap" ref="contentWrapRef">
        <span class="badge-content" :class="{ 'is-marquee': needScroll }">
          <span class="badge-content-inner">
            <span class="badge-city">{{ weather.city }}</span>
            <span class="badge-weather">{{ weather.weather }}</span>
            <span class="badge-temp">{{ weather.temperature }}℃</span>
          </span>
          <span class="badge-content-inner clone" aria-hidden="true" v-if="needScroll">
            <span class="badge-city">{{ weather.city }}</span>
            <span class="badge-weather">{{ weather.weather }}</span>
            <span class="badge-temp">{{ weather.temperature }}℃</span>
          </span>
        </span>
      </span>
    </template>
    <!-- 获取失败 -->
    <span v-else class="badge-error" @click.stop="loadWeather(true)">天气获取失败</span>
  </div>

  <!-- 天气详情弹窗（居中弹窗，视觉样式与时光胶囊保持一致） -->
  <Teleport to="body">
    <Transition name="weather-fade">
      <div v-if="panelShow" class="weather-mask" @click="closePanel">
        <div class="weather-panel music-glass" @click.stop>
          <!-- 弹窗顶栏 -->
          <div class="panel-header">
            <div class="title">
              <WeatherIcon :name="weather.weather" :size="20" class="panel-title-icon" />
              <span class="weather-title">{{ weather.city ? weather.city + '天气' : '实时天气' }}</span>
              <span class="forecast-tag" v-if="forecastList && forecastList.length">3天预报</span>
            </div>
            <button
              type="button"
              class="weather-close"
              aria-label="关闭天气详情"
              @click="closePanel"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                stroke-linejoin="round"
                fill="none"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- 弹窗主体内容 -->
          <div class="all-weather">
            <!-- 实时天气看板 -->
            <div class="current-card">
              <div class="current-left">
                <div class="temp-display">
                  <span class="temp-num">{{ weather.temperature !== null ? weather.temperature : "--" }}</span>
                  <span class="temp-unit">℃</span>
                </div>
                <div class="current-details">
                  <span class="detail-item cond">{{ weather.weather || "未知天气" }}</span>
                  <span class="sep">·</span>
                  <span class="detail-item wind">{{ weather.winddirection }} {{ weather.windpower ? weather.windpower + "级" : "" }}</span>
                  <template v-if="weather.humidity">
                    <span class="sep">·</span>
                    <span class="detail-item humidity">湿度 {{ weather.humidity }}%</span>
                  </template>
                </div>
              </div>
              <div class="current-right">
                <WeatherIcon :name="weather.weather" :size="48" class="big-weather-icon" />
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
                <!-- 日期：充足宽度，防止与天气重叠 -->
                <div class="date-col">
                  <span class="day-name">{{ item.dayName }}</span>
                  <span class="date-detail">{{ item.weekday }} {{ item.date }}</span>
                </div>

                <!-- 天气状况与矢量图标 -->
                <div class="weather-col">
                  <WeatherIcon :name="item.weather" :size="19" class="forecast-icon" />
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
          </div>

          <!-- 弹窗底部 -->
          <div class="panel-footer">
            <span class="footer-tip">
              气象数据来源 · {{ weather.city || "本地" }}
            </span>
            <button type="button" class="refresh-action" @click="loadWeather(true)" title="重新获取天气">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>刷新</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import WeatherIcon from "@/components/WeatherIcon.vue";
import { getUapiWeather, getAdcode, getWeather, getCityByIp, getOtherWeather } from "@/api";
import { showMessage } from "@/utils/message.js";
import {
  windDirZh,
  normalizeWindPower,
  normalizeWeatherZh,
  wttrWeatherZh,
  amapWeatherZh,
} from "@/utils/weather.js";
import { mainStore } from "@/store";

const store = mainStore();
const mainKey = import.meta.env.VITE_WEATHER_KEY;

const loading = ref(true);
const panelShow = ref(false);
const needScroll = ref(false);
const contentWrapRef = ref(null);
const badgeStyle = ref({});
const forecastList = ref([]); // 最近三天预报列表

const weather = ref({
  city: null,
  weather: null,
  temperature: null,
  winddirection: null,
  windpower: null,
  humidity: null,
});

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
    const desc = normalizeWeatherZh(wttrWeatherZh(rawDesc));
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
    const rawDesc = c.dayweather || c.nightweather || "晴";
    const desc = normalizeWeatherZh(amapWeatherZh(rawDesc));
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
    const desc = normalizeWeatherZh(weathers[i]);
    return {
      date: `${d.getMonth() + 1}月${d.getDate()}日`,
      weekday: weekdays[d.getDay()],
      dayName: dayNames[i],
      weather: desc,
      tempMin: baseTemp - (i === 0 ? 3 : i === 1 ? 4 : 2),
      tempMax: baseTemp + (i === 0 ? 3 : i === 1 ? 2 : 4),
      wind: "微风 2级",
    };
  });
};

// 检测文字是否需要滚动（自动判断城市、天气、温度总长度是否超出可用空间）
const checkNeedScroll = () => {
  nextTick(() => {
    const wrap = contentWrapRef.value;
    if (!wrap) return;
    const inner = wrap.querySelector(".badge-content-inner");
    if (!inner) return;
    needScroll.value = inner.scrollWidth > wrap.clientWidth;
  });
};

const updateBadgeWidth = () => {
  badgeStyle.value = {};
  checkNeedScroll();
};

// 主源：uapis 天气（不传城市时按访客 IP 自动定位）
const loadByUapis = async () => {
  const data = await getUapiWeather();
  const city = data.city || data.province || "未知城市";
  const desc = normalizeWeatherZh(amapWeatherZh(data.weather));
  const currentTemp = data.temperature;

  weather.value = {
    city,
    weather: desc,
    temperature: currentTemp,
    winddirection: data.wind_direction || "未知",
    windpower: normalizeWindPower(data.wind_power),
    humidity: data.humidity || null,
  };

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
  const desc = normalizeWeatherZh(amapWeatherZh(live.weather));
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

// IP 定位 + wttr.in（境外兜底源）
const loadByIp = async () => {
  const cityInfo = await getCityByIp();
  if (!cityInfo || !cityInfo.en) throw new Error("定位城市为空");

  const result = await getOtherWeather(cityInfo.en);
  if (!result || !result.current_condition || result.current_condition.length === 0) {
    throw new Error("备用天气接口返回错误");
  }
  const cond = result.current_condition[0];
  let weatherText = "";
  const zhValue = cond.lang_zh && cond.lang_zh[0] && cond.lang_zh[0].value;
  const enValue = cond.weatherDesc && cond.weatherDesc[0] && cond.weatherDesc[0].value;
  if (zhValue && !/^[a-zA-Z\s]+$/.test(zhValue)) {
    weatherText = normalizeWeatherZh(zhValue);
  } else {
    const source = zhValue || enValue || "";
    weatherText = normalizeWeatherZh(wttrWeatherZh(source));
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

const togglePanel = () => {
  if (loading.value) return;
  panelShow.value = !panelShow.value;
};

const closePanel = () => {
  panelShow.value = false;
};

const onKeydown = (e) => {
  if (e.key === "Escape" && panelShow.value) {
    closePanel();
  }
};

let logoObserver = null;

const onResize = () => {
  updateBadgeWidth();
  checkNeedScroll();
};

onMounted(() => {
  loadWeather();
  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", onKeydown);
  updateBadgeWidth();

  const logo = document.querySelector(".message .logo");
  if (logo && "ResizeObserver" in window) {
    logoObserver = new ResizeObserver(() => updateBadgeWidth());
    logoObserver.observe(logo);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  window.removeEventListener("keydown", onKeydown);
  if (logoObserver) {
    logoObserver.disconnect();
    logoObserver = null;
  }
});
</script>

<style lang="scss" scoped>
.weather-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 150px;
  height: 38px;
  padding: 0 14px;
  border-radius: 19px;
  font-family: "HarmonyOS_Regular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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

  .badge-icon-svg {
    flex-shrink: 0;
    line-height: 1;
    color: #fff;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.75));
  }

  // 文字滚动容器：限制最大宽度
  .badge-content-wrap {
    display: block;
    max-width: 160px;
    overflow: hidden;
    white-space: nowrap;
    flex-shrink: 1;
    transition: max-width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .badge-content {
    display: inline-flex;
    white-space: nowrap;

    &.is-marquee {
      display: flex;
      animation: badge-marquee 8s linear infinite;
    }
    &.is-marquee:hover {
      animation-play-state: paused;
    }

    .badge-content-inner {
      display: inline-flex;
      align-items: center;
      gap: 5px; // 城市、天气、温度间距完全一致！
      flex-shrink: 0;

      &.clone {
        padding-left: 1.5em;
      }
    }
  }

  // 统一字体样式：字重、字号、颜色、投影完全一致
  .badge-city,
  .badge-weather,
  .badge-temp {
    font-family: inherit;
    font-size: 0.88rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.95);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
    line-height: 1.2;
    letter-spacing: 0.2px;
    white-space: nowrap;
  }

  .badge-loading {
    opacity: 0.8;
    font-size: 0.84rem;
  }

  .badge-error {
    opacity: 0.8;
    font-size: 0.82rem;
  }

  @media (max-width: $bp-md) {
    // 移动端/小窗口副标题模式：
    // 1. 去除胶囊底色、边框与投影
    // 2. 宽度自然随内容展开，上限由 --logo-full-width 严格约束
    // 3. 城市、天气、温度保持同等 5px 间隙紧凑展示，超长时由内部自动跑马灯滚动
    background: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    border: none !important;
    box-shadow: none !important;
    height: auto !important;
    min-height: 0 !important;
    min-width: 0 !important;
    width: auto !important;
    max-width: var(--logo-full-width, 100%) !important;
    box-sizing: border-box !important;
    display: inline-flex !important;
    align-items: center !important;
    padding: 2px 0 !important;
    margin: 0 !important;
    border-radius: 0 !important;
    opacity: 1 !important;
    transform: none !important;

    &:hover {
      transform: none !important;
      opacity: 1;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
    }
    &:active {
      transform: scale(0.98) !important;
      opacity: 0.85;
    }

    .badge-icon-svg {
      margin-right: 5px;
      flex-shrink: 0;
    }

    .badge-content-wrap {
      max-width: 100%;
      overflow: hidden;
      white-space: nowrap;
    }

    .badge-content-inner {
      gap: 5px; // 保持 5px 均匀呼吸间距，杜绝温度被甩开的巨大间隙
    }

    .badge-city,
    .badge-weather,
    .badge-temp {
      font-size: 0.84rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
      margin: 0 !important;
      padding: 0 !important;
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

// 天气弹窗遮罩层（与时光胶囊 capsule-mask 视觉规范完全一致）
.weather-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  cursor: pointer;
  padding: 16px;
  box-sizing: border-box;
}

// 居中弹窗主体（与时光胶囊 .capsule-modal 尺寸、质感、毛玻璃完全一致）
.weather-panel {
  position: relative;
  width: 100%;
  max-width: 480px;
  box-sizing: border-box;
  padding: 22px 24px 20px;
  border-radius: 24px;
  color: #fff;
  cursor: default;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 24px 48px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;

  // 顶栏
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    .title {
      display: flex;
      align-items: center;
      gap: 8px;

      .panel-title-icon {
        color: #fff;
        flex-shrink: 0;
      }

      .weather-title {
        font-size: 1.15rem;
        font-weight: 600;
        letter-spacing: 0.5px;
      }

      .forecast-tag {
        font-size: 0.72rem;
        padding: 2px 7px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.14);
        color: rgba(255, 255, 255, 0.85);
        letter-spacing: 0.3px;
      }
    }

    // 关闭按钮：纯矢量 X 符号居中对齐圆心，彻底消除偏心双重圆
    .weather-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      padding: 0;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 50%;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.85);
      line-height: 0;
      outline: none;
      box-sizing: border-box;
      transition:
        background-color 0.2s,
        transform 0.2s,
        color 0.2s;

      svg {
        display: block;
        width: 14px;
        height: 14px;
        margin: auto;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
        transform: scale(1.06);
      }
      &:active {
        transform: scale(0.92);
      }
    }
  }

  // 弹窗主体看板
  .all-weather {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 14px;

    // 当日实时天气大卡片
    .current-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);

      .current-left {
        display: flex;
        flex-direction: column;
        gap: 6px;

        .temp-display {
          display: flex;
          align-items: baseline;
          color: #fff;
          font-variant-numeric: tabular-nums;

          .temp-num {
            font-size: 2.2rem;
            font-weight: 700;
            line-height: 1;
          }
          .temp-unit {
            font-size: 1.1rem;
            font-weight: 400;
            margin-left: 2px;
            opacity: 0.85;
          }
        }

        .current-details {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          font-size: 0.86rem;
          color: rgba(255, 255, 255, 0.72);

          .sep {
            opacity: 0.45;
          }
        }
      }

      .current-right {
        display: flex;
        align-items: center;
        justify-content: center;
        .big-weather-icon {
          color: #fff;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.35));
        }
      }
    }

    // 预报列表
    .forecast-list {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .forecast-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 14px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition: background 0.2s, border-color 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        &.is-today {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.16);

          .date-col .day-name {
            color: #fff;
          }
        }

        // 日期列：充裕宽度（96px），避免任何与天气状况的文本重叠
        .date-col {
          display: flex;
          flex-direction: column;
          width: 96px;
          min-width: 96px;
          flex-shrink: 0;

          .day-name {
            font-size: 0.9rem;
            font-weight: 600;
            color: rgba(255, 255, 255, 0.95);
          }
          .date-detail {
            font-size: 0.72rem;
            color: rgba(255, 255, 255, 0.48);
            margin-top: 1px;
            white-space: nowrap;
          }
        }

        .weather-col {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1 1 auto;
          min-width: 0;
          padding: 0 8px;

          .forecast-icon {
            color: rgba(255, 255, 255, 0.95);
            flex-shrink: 0;
          }

          .desc {
            font-size: 0.88rem;
            color: rgba(255, 255, 255, 0.88);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .temp-col {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;

          .t-min {
            font-size: 0.86rem;
            font-weight: 500;
            color: rgba(255, 255, 255, 0.52);
            width: 24px;
            text-align: right;
            font-variant-numeric: tabular-nums;
          }

          .t-bar-box {
            width: 44px;
            height: 5px;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 3px;
            overflow: hidden;

            .t-bar {
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, #4facfe 0%, #00f2fe 55%, #f6d365 100%);
              border-radius: 3px;
            }
          }

          .t-max {
            font-size: 0.9rem;
            font-weight: 600;
            color: #fff;
            width: 26px;
            text-align: left;
            font-variant-numeric: tabular-nums;
          }
        }
      }
    }
  }

  // 弹窗底部
  .panel-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    .footer-tip {
      font-size: 0.74rem;
      color: rgba(255, 255, 255, 0.45);
    }

    .refresh-action {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.74rem;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      background: transparent;
      border: none;
      user-select: none;
      transition: color 0.2s, transform 0.2s;

      svg {
        display: block;
      }

      &:hover {
        color: #fff;
        transform: scale(1.04);
      }
      &:active {
        transform: scale(0.96);
      }
    }
  }

  @media (max-width: $bp-sm) {
    .all-weather {
      gap: 10px;
      padding-top: 10px;

      .current-card {
        padding: 10px 14px;
        .current-left {
          .temp-display .temp-num {
            font-size: 1.85rem;
          }
          .current-details {
            font-size: 0.8rem;
          }
        }
        .current-right .big-weather-icon {
          width: 40px !important;
          height: 40px !important;
        }
      }

      .forecast-list .forecast-card {
        padding: 7px 10px;

        .date-col {
          width: 88px;
          min-width: 88px;
          .day-name {
            font-size: 0.84rem;
          }
          .date-detail {
            font-size: 0.68rem;
          }
        }

        .weather-col {
          padding: 0 4px;
          gap: 6px;
          .desc {
            font-size: 0.82rem;
          }
        }

        .temp-col {
          gap: 5px;
          .t-min,
          .t-max {
            font-size: 0.8rem;
          }
          .t-bar-box {
            width: 26px;
          }
        }
      }
    }
  }
}

// 统一弹窗过渡动画（与时光胶囊 capsule-fade 完全一致）
.weather-fade-enter-active,
.weather-fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  .weather-panel {
    transition:
      transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

.weather-fade-leave-active {
  transition-duration: 0.25s;

  .weather-panel {
    transition-duration: 0.25s;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.weather-fade-enter-from,
.weather-fade-leave-to {
  opacity: 0;

  .weather-panel {
    opacity: 0;
    transform: scale(0.94) translateY(16px);
  }
}
</style>
