<template>
  <div class="weather-badge" @click="togglePanel">
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
      <div v-show="panelShow" class="badge-panel" @click.stop>
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
        <div class="panel-note">位置由 IP 自动识别，仅显示城市级天气</div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { getAdcode, getWeather, getCityByIp, getOtherWeather } from "@/api";
import { showMessage } from "@/utils/message.js";

const mainKey = import.meta.env.VITE_WEATHER_KEY;

const loading = ref(true);
const panelShow = ref(false);
const needScroll = ref(false);
const textWrapRef = ref(null);
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

// wttr.in 天气描述英文转中文
const wttrWeatherZh = (text) => {
  if (!text) return "";
  const map = {
    Sunny: "晴",
    Clear: "晴",
    "Partly cloudy": "多云",
    "Partly Cloudy": "多云",
    Cloudy: "阴",
    Overcast: "阴天",
    Mist: "薄雾",
    Fog: "雾",
    "Freezing fog": "冻雾",
    Haze: "霾",
    "Light rain": "小雨",
    "Light Rain": "小雨",
    "Moderate rain": "中雨",
    "Heavy rain": "大雨",
    "Heavy Rain": "大雨",
    "Light snow": "小雪",
    "Moderate snow": "中雪",
    "Heavy snow": "大雪",
    "Light sleet": "雨夹雪",
    "Moderate or heavy sleet": "中到大雨夹雪",
    "Patchy rain nearby": "局部有雨",
    "Light drizzle": "细雨",
    "Thundery outbreaks possible": "可能有雷雨",
  };
  const key = text.trim();
  if (map[key]) return map[key];
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
    winddirection: cond.winddir16Point || "未知",
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

// 打开 / 关闭面板
const togglePanel = () => {
  if (loading.value) return;
  panelShow.value = !panelShow.value;
};

// 点击外部关闭面板
const handleClickOutside = (e) => {
  const badge = document.querySelector(".weather-badge");
  if (badge && badge.contains(e.target)) return;
  panelShow.value = false;
};

onMounted(() => {
  loadWeather();
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("resize", checkNeedScroll);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("resize", checkNeedScroll);
});
</script>

<style lang="scss" scoped>
.weather-badge {
  position: fixed;
  top: 27px;
  right: 24px;
  z-index: 30;
  display: flex;
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
  top: 69px;
  right: 24px;
  z-index: 30;
  width: 220px;
  padding: 16px;
  border-radius: 14px;
  background: rgb(0 0 0 / 45%);
  backdrop-filter: blur(20px);
  border: 1px solid rgb(255 255 255 / 12%);
  box-shadow: 0 10px 30px rgb(0 0 0 / 30%);
  color: #fff;

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
  .panel-note {
    margin-top: 10px;
    font-size: 0.7rem;
    opacity: 0.45;
  }

  @media (max-width: 720px) {
    top: 61px;
    right: 12px;
    width: 200px;
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
