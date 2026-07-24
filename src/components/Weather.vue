<template>
  <!-- 当天气面板未开启时，显示普通的天气文字 -->
  <div
    class="weather"
    v-if="!store.weatherOpenState"
    @click="store.weatherOpenState = true"
  >
    <div
      v-if="weatherData.adCode.city && weatherData.weather.weather"
      class="weather-marquee"
      :class="{ scrolling: needScroll }"
      ref="marqueeRef"
    >
      <div class="marquee-track" :class="{ 'is-scrolling': needScroll }">
        <span class="marquee-text">
          {{ weatherData.adCode.city }}&nbsp;{{ weatherData.weather.weather }}&nbsp;{{ weatherData.weather.temperature }}℃
        </span>
        <span class="marquee-text clone" v-if="needScroll" aria-hidden="true">
          {{ weatherData.adCode.city }}&nbsp;{{ weatherData.weather.weather }}&nbsp;{{ weatherData.weather.temperature }}℃
        </span>
      </div>
    </div>
    <div v-else>
      <span>天气数据获取失败</span>
    </div>
  </div>

  <!-- 当天气面板开启时，显示天气设置 -->
  <div class="weather-settings" v-else>
    <div class="title">城市天气设置</div>
    <el-input
      v-model="inputCity"
      placeholder="请输入城市 (如: 北京)"
      size="small"
      clearable
      @keyup.enter="saveCity"
    />
    <div class="btns">
      <span @click="saveCity">保存设置</span>
      <span @click="store.weatherOpenState = false">返回时间</span>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, onBeforeUnmount, h, ref, watch, nextTick } from "vue";
import { getAdcode, getWeather, getOtherWeather, getAdcodeByCity } from "@/api";
import { Error } from "@icon-park/vue-next";
import { showMessage } from "@/utils/message.js";
import { mainStore } from "@/store";

const store = mainStore();
const mainKey = import.meta.env.VITE_WEATHER_KEY;

// 输入的城市名
const inputCity = ref("");

// 滚动相关
const marqueeRef = ref(null);
const needScroll = ref(false);

// 监听开启状态，初始化输入框
watch(
  () => store.weatherOpenState,
  (val) => {
    if (val) {
      inputCity.value = weatherData.adCode.city || "";
    }
  }
);

// 检查文字是否需要滚动
const checkNeedScroll = () => {
  nextTick(() => {
    if (marqueeRef.value) {
      const container = marqueeRef.value;
      const track = container.querySelector('.marquee-track');
      const text = track?.querySelector('.marquee-text');

      if (text) {
        // 文字宽度超过容器宽度时需要滚动
        needScroll.value = text.scrollWidth > container.clientWidth;
      }
    }
  });
};

// WWO (wttr.in) 天气描述翻译字典
const weatherTranslation = {
  // 晴 / 多云 / 阴
  "Sunny": "晴",
  "Clear": "晴",
  "Partly cloudy": "多云",
  "Partly Cloudy": "多云",
  "Cloudy": "阴",
  "Overcast": "阴天",
  // 雾 / 霾
  "Mist": "薄雾",
  "Fog": "雾",
  "Freezing fog": "冻雾",
  "Haze": "霾",
  // 局部降雨（可能）
  "Patchy rain nearby": "局部有雨",
  "Patchy rain possible": "局部有雨",
  "Patchy light rain": "局部小雨",
  "Patchy light drizzle": "局部细雨",
  // 毛毛雨 / 细雨
  "Light drizzle": "细雨",
  "Freezing drizzle": "冻细雨",
  "Heavy freezing drizzle": "强冻细雨",
  "Patchy freezing drizzle nearby": "局部冻细雨",
  "Patchy freezing drizzle possible": "局部冻细雨",
  // 小雨
  "Light rain": "小雨",
  "Light Rain": "小雨",
  "Light rain shower": "小阵雨",
  "Patchy light rain shower": "局部小阵雨",
  // 中雨
  "Moderate rain": "中雨",
  "Moderate rain at times": "时有中雨",
  "Moderate or heavy rain shower": "中到大阵雨",
  // 大雨 / 暴雨
  "Heavy rain": "大雨",
  "Heavy Rain": "大雨",
  "Heavy rain at times": "时有大雨",
  "Torrential rain shower": "暴雨",
  // 冻雨
  "Light freezing rain": "小冻雨",
  "Moderate or heavy freezing rain": "中到大冻雨",
  // 雨夹雪
  "Light sleet": "小雨夹雪",
  "Moderate or heavy sleet": "中到大雨夹雪",
  "Light sleet showers": "小雨夹雪阵雨",
  "Moderate or heavy sleet showers": "中到大雨夹雪阵雨",
  "Patchy sleet nearby": "局部雨夹雪",
  "Patchy sleet possible": "局部雨夹雪",
  // 局部降雪（可能）
  "Patchy snow nearby": "局部小雪",
  "Patchy snow possible": "局部小雪",
  "Patchy light snow": "局部小雪",
  "Patchy moderate snow": "局部中雪",
  "Patchy heavy snow": "局部大雪",
  // 雪
  "Light snow": "小雪",
  "Light snow showers": "小阵雪",
  "Moderate snow": "中雪",
  "Heavy snow": "大雪",
  "Moderate or heavy snow showers": "中到大阵雪",
  "Blowing snow": "吹雪",
  "Blizzard": "暴风雪",
  // 冰粒
  "Ice pellets": "冰粒",
  "Light showers of ice pellets": "小冰粒阵",
  "Moderate or heavy showers of ice pellets": "中到大冰粒阵",
  // 雷阵雨（附近 / 可能）
  "Thundery outbreaks nearby": "附近有雷雨",
  "Thundery outbreaks in nearby": "附近有雷雨",
  "Thundery outbreaks possible": "可能有雷雨",
  // 雷雨
  "Patchy light rain with thunder": "局部雷阵雨",
  "Patchy light rain in area with thunder": "局部雷阵雨",
  "Moderate or heavy rain with thunder": "强雷阵雨",
  "Moderate or heavy rain in area with thunder": "强雷阵雨",
  // 雷雪
  "Patchy light snow with thunder": "局部雷雪",
  "Patchy light snow in area with thunder": "局部雷雪",
  "Moderate or heavy snow with thunder": "强雷雪",
  "Moderate or heavy snow in area with thunder": "强雷雪"
};

const translateWeather = (text) => {
  if (!text) return "未知";
  const trimmed = text.trim();
  if (weatherTranslation[trimmed]) {
    return weatherTranslation[trimmed];
  }
  for (const key in weatherTranslation) {
    if (trimmed.toLowerCase() === key.toLowerCase()) {
      return weatherTranslation[key];
    }
  }
  return trimmed;
};

// Cookie 辅助函数
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(";").shift());
  return null;
};

const setCookie = (name, value, days) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const secure = location.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Strict${secure}`;
};

const weatherData = reactive({
  adCode: {
    city: null,
    adcode: null,
  },
  weather: {
    weather: null,
    temperature: null,
    winddirection: null,
    windpower: null,
  },
});

const onError = (message) => {
  showMessage({
    message,
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  console.error(message);
};

// 获取天气数据
const getWeatherData = async (cityName) => {
  try {
    if (!mainKey) {
      // 备用接口请求 (wttr.in)
      const result = await getOtherWeather(cityName);

      if (!result || !result.current_condition || result.current_condition.length === 0) {
        throw new Error("备用天气接口返回错误");
      }

      const cond = result.current_condition[0];
      weatherData.adCode.city = cityName;

      // 获取天气状况（优先使用 lang_zh 的 value，若无或为英文则尝试翻译）
      let weatherText = "";
      if (cond.lang_zh && cond.lang_zh[0] && cond.lang_zh[0].value) {
        weatherText = cond.lang_zh[0].value;
      } else if (cond.weatherDesc && cond.weatherDesc[0] && cond.weatherDesc[0].value) {
        weatherText = cond.weatherDesc[0].value;
      }
      weatherData.weather.weather = translateWeather(weatherText);

      // 温度
      weatherData.weather.temperature = cond.temp_C || "0";

      // 风向与风力
      weatherData.weather.winddirection = cond.winddir16Point || "未知";
      weatherData.weather.windpower = cond.windspeedKmph ? `${Math.round(Number(cond.windspeedKmph) / 5)}` : "0";
    } else {
      // 高德接口请求流程
      let adcode = "";
      let finalCityName = cityName;

      if (cityName) {
        // 用户指定了城市，先查 adcode
        const districtRes = await getAdcodeByCity(mainKey, cityName);
        if (districtRes.status !== "1" || !districtRes.districts || districtRes.districts.length === 0) {
          throw new Error("未找到该城市编码");
        }
        adcode = districtRes.districts[0].adcode;
        finalCityName = districtRes.districts[0].name;
      } else {
        // 未指定城市，按 IP 定位
        const adCodeRes = await getAdcode(mainKey);
        if (adCodeRes.infocode !== "10000") {
          throw new Error("地区查询失败");
        }
        adcode = adCodeRes.adcode;
        finalCityName = adCodeRes.city;
      }

      weatherData.adCode.city = finalCityName;
      weatherData.adCode.adcode = adcode;

      const result = await getWeather(mainKey, adcode);
      if (result.infocode !== "10000") {
        throw new Error("天气查询失败");
      }

      const live = result.lives[0];
      weatherData.weather.weather = live.weather;
      weatherData.weather.temperature = live.temperature;
      weatherData.weather.winddirection = live.winddirection;
      weatherData.weather.windpower = live.windpower;
    }

    // 数据更新后检查是否需要滚动
    checkNeedScroll();
  } catch (error) {
    console.error("天气信息获取失败:", error);
    onError("天气信息获取失败");
  }
};

// 保存设置好的城市
const saveCity = async () => {
  const trimmedCity = inputCity.value.trim();
  if (!trimmedCity) {
    showMessage.warning("城市名称不能为空");
    return;
  }
  
  // 临时保存原城市，以防请求失败后需要回滚
  const oldCity = getCookie("weather_city") || "上海";
  
  showMessage.info("正在查询并保存天气信息...");
  await getWeatherData(trimmedCity);
  
  // 检查是否获取成功
  const successCityName = weatherData.adCode.city;
  if (successCityName && (
      successCityName.toLowerCase() === trimmedCity.toLowerCase() ||
      successCityName.includes(trimmedCity) ||
      trimmedCity.includes(successCityName)
  )) {
    // 成功，保存至 cookie，过期时间 30 天
    setCookie("weather_city", successCityName, 30);
    showMessage.success(`城市成功切换为：${successCityName}`);
    store.weatherOpenState = false; // 返回时间卡片显示
  } else {
    // 失败，回滚
    await getWeatherData(oldCity);
    showMessage.error("获取该城市天气失败，已回退");
  }
};

onMounted(() => {
  const savedCity = getCookie('weather_city') || '上海';
  getWeatherData(savedCity);
  window.addEventListener('resize', checkNeedScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkNeedScroll);
});
</script>

<style lang="scss" scoped>
.weather {
  font-size: 14px;
  color: #efefefb3;
  cursor: pointer;
  transition: color 0.3s, transform 0.3s;
  user-select: none;

  &:hover {
    color: #efefef;
    transform: scale(1.05);
  }
  &:active {
    transform: scale(0.98);
  }

  // 天气文字滚动容器
  .weather-marquee {
    width: 100%;
    overflow: hidden;
    position: relative;

    .marquee-track {
      display: inline-flex;
      white-space: nowrap;

      &.is-scrolling {
        animation: marquee 15s linear infinite;
      }

      // 悬停时暂停滚动，方便阅读
      &.is-scrolling:hover {
        animation-play-state: paused;
      }

      .marquee-text {
        display: inline-block;

        &.clone {
          padding-left: 2em; // 两段文字之间的间距
        }
      }
    }
  }
}

// 滚动动画
@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.weather-settings {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  animation: fade 0.3s;
  
  .title {
    font-size: 1.05rem;
    font-weight: bold;
    letter-spacing: 1px;
    color: #fff;
    margin-bottom: 4px;
  }
  
  :deep(.el-input) {
    width: 100%;
    margin: 8px 0;
  }
  
  :deep(.el-input__wrapper) {
    background-color: #ffffff26 !important;
    box-shadow: none !important;
    border: 1px solid #ffffff33;
    border-radius: 8px;
    
    .el-input__inner {
      color: #fff !important;
      text-align: center;
      font-size: 0.9rem;
      &::placeholder {
        color: #ffffffb3;
      }
    }
  }
  
  .btns {
    display: flex;
    align-items: center;
    margin-top: 4px;
    
    span {
      background: #ffffff26;
      padding: 4px 12px;
      border-radius: 8px;
      margin: 0px 6px;
      font-size: 0.85rem;
      color: #fff;
      cursor: pointer;
      transition: background 0.3s, transform 0.1s;
      white-space: nowrap;
      
      &:hover {
        background: #ffffff4d;
      }
      &:active {
        transform: scale(0.95);
      }
    }
  }
}

// Transition 动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
