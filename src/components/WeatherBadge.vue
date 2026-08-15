<template>
  <div class="weather-badge" :class="{ 'with-menu': store.navCollapsed }" @click="togglePanel">
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

  <!-- 天气详情面板 -->
  <Teleport to="body">
    <Transition name="badge-fade">
      <div v-show="panelShow" class="badge-panel" :style="panelStyle" @click.stop>
        <div class="panel-city">
          <span class="city-name">{{ weather.city || "未知城市" }}</span>
          <span class="city-temp">{{ weather.temperature !== null ? weather.temperature + "℃" : "--" }}</span>
        </div>
        <div class="panel-weather">{{ weather.weather || "暂无天气信息" }}</div>
        <div class="panel-detail" v-if="weather.weather">
          <div class="detail-item">
            <span class="label">风向</span>
            <span class="value">{{ weather.winddirection || "未知" }}</span>
          </div>
          <div class="detail-item">
            <span class="label">风力</span>
            <span class="value">{{ weather.windpower ? weather.windpower + " 级" : "未知" }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { getAdcode, getWeather, getCityByIp, getOtherWeather } from "@/api";
import { showMessage } from "@/utils/message.js";
import { windDirZh } from "@/utils/weather.js";
import { mainStore } from "@/store";

const store = mainStore();

const mainKey = import.meta.env.VITE_WEATHER_KEY;

const loading = ref(true);
const panelShow = ref(false);
const needScroll = ref(false);
const textWrapRef = ref(null);
const panelStyle = ref({});
const weather = ref({
  city: null,
  weather: null,
  temperature: null,
  winddirection: null,
  windpower: null,
});

// 天气图标（根据天气文本匹配 emoji）
const weatherIcon = computed(() => {
  const t = weather.value.weather || "";
  if (t.includes("雷")) return "⛈";
  if (t.includes("雪") || t.includes("雨夹")) return "❄";
  if (t.includes("雨")) return "🌧";
  if (t.includes("雾") || t.includes("霾")) return "🌫";
  if (t.includes("阴")) return "☁";
  if (t.includes("云")) return "⛅";
  if (t.includes("晴")) return "☀";
  return "🌡";
});

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

// 高德 IP 定位 + 天气
const loadByAmap = async () => {
  const adCodeRes = await getAdcode(mainKey);
  if (adCodeRes.infocode !== "10000") throw new Error("地区查询失败");
  const city = adCodeRes.city;
  const adcode = adCodeRes.adcode;

  const result = await getWeather(mainKey, adcode);
  if (result.infocode !== "10000") throw new Error("天气查询失败");
  const live = result.lives[0];
  weather.value = {
    city,
    weather: amapWeatherZh(live.weather),
    temperature: live.temperature,
    winddirection: live.winddirection,
    windpower: live.windpower,
  };
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
  };
};

// 加载天气
const loadWeather = async (silent) => {
  loading.value = true;
  try {
    if (mainKey) {
      await loadByAmap();
    } else {
      await loadByIp();
    }
  } catch (error) {
    console.error("天气加载失败:", error);
    weather.value = { city: null, weather: null, temperature: null, winddirection: null, windpower: null };
    if (!silent) {
      showMessage({ message: "天气信息获取失败", type: "warning", grouping: true });
    }
  } finally {
    loading.value = false;
    checkNeedScroll();
  }
};

// 根据胶囊实时尺寸更新面板位置（始终保持同宽 + 紧贴正下方）
const updatePanelPosition = () => {
  const badge = document.querySelector(".weather-badge");
  if (!badge) return;
  const rect = badge.getBoundingClientRect();
  let left = rect.left;
  const width = rect.width;
  // 边界保护：避免面板超出视口左右边缘
  if (left < 8) left = 8;
  if (left + width > window.innerWidth - 8) left = window.innerWidth - 8 - width;
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

onMounted(() => {
  loadWeather();
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("resize", checkNeedScroll);
  const badge = document.querySelector(".weather-badge");
  if (badge && "ResizeObserver" in window) {
    badgeObserver = new ResizeObserver(() => {
      if (panelShow.value) updatePanelPosition();
    });
    badgeObserver.observe(badge);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("resize", checkNeedScroll);
  if (badgeObserver) badgeObserver.disconnect();
});
</script>

<style lang="scss" scoped>
.weather-badge {
  position: fixed;
  top: 27px;
  right: 24px;
  z-index: 30;
  display: flex;
  justify-content: space-between; // 胶囊内文字均匀分布
  min-width: 180px; // 保证胶囊最小宽度，避免下拉面板文字过挤

  // 顶部导航折叠为汉堡菜单时（横排放不下），胶囊让位汉堡按钮
  &.with-menu {
    right: 66px;
  }

  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border-radius: 17px;
  background: rgb(0 0 0 / 25%);
  backdrop-filter: blur(10px);
  border: 1px solid rgb(255 255 255 / 10%);
  font-size: 0.9rem;
  color: #fff;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s, background 0.2s;

  &:hover {
    transform: scale(1.05);
    background: rgb(0 0 0 / 35%);
  }
  &:active {
    transform: scale(0.95);
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

  @media (max-width: 720px) {
    top: 23px;
    right: 66px; // 避开移动端菜单按钮
    height: 30px;
    padding: 0 12px;
    font-size: 0.82rem;
    min-width: 150px;

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
  z-index: 30;
  // top / left / width 由 JS 根据胶囊实时尺寸动态设置
  padding: 16px;
  border-radius: 14px;
  background: rgb(0 0 0 / 45%);
  backdrop-filter: blur(20px);
  border: 1px solid rgb(255 255 255 / 12%);
  box-shadow: 0 10px 30px rgb(0 0 0 / 30%);
  color: #fff;
  box-sizing: border-box;

  .panel-city {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    .city-name {
      font-size: 1.2rem;
      font-weight: 600;
    }
    .city-temp {
      font-size: 1.6rem;
      font-weight: 600;
    }
  }
  .panel-weather {
    margin-top: 4px;
    font-size: 0.9rem;
    opacity: 0.85;
  }
  .panel-detail {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid rgb(255 255 255 / 12%);
    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 0.82rem;
      .label {
        opacity: 0.6;
      }
    }
  }

  @media (max-width: 720px) {
    padding: 12px;
  }
}

.badge-fade-enter-active,
.badge-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.badge-fade-enter-from,
.badge-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
