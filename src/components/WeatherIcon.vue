<template>
  <span
    class="weather-icon-svg"
    :style="{
      width: iconSize + 'px',
      height: iconSize + 'px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }"
    :aria-label="weatherType"
  >
    <!-- 晴 (Sunny / Clear) -->
    <svg
      v-if="iconType === 'sunny'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <circle cx="12" cy="12" r="4.5" />
      <line x1="12" y1="2" x2="12" y2="4.5" />
      <line x1="12" y1="19.5" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.99" y2="5.99" />
      <line x1="18.01" y1="18.01" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4.5" y2="12" />
      <line x1="19.5" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.99" y2="18.01" />
      <line x1="18.01" y1="5.99" x2="19.78" y2="4.22" />
    </svg>

    <!-- 多云 / 晴间多云 (Partly Cloudy / Cloudy) -->
    <svg
      v-else-if="iconType === 'cloudy'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <path d="M12 4V2M4.93 6.93L3.51 5.51M20 12h2M17.07 6.93l1.42-1.42M15.5 8.5A4.5 4.5 0 0 0 8.5 12" />
      <path d="M17.5 19H7a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17.5 11 3.5 3.5 0 0 1 17.5 19z" />
    </svg>

    <!-- 阴 (Overcast) -->
    <svg
      v-else-if="iconType === 'overcast'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <path d="M17.5 19H7a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17.5 11 3.5 3.5 0 0 1 17.5 19z" />
      <path d="M7 11a4.5 4.5 0 0 1 7.8-2.6" opacity="0.6" />
    </svg>

    <!-- 雷阵雨 / 雷暴 (Thunderstorm) -->
    <svg
      v-else-if="iconType === 'thunder'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <path d="M17.5 14H7a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17.5 6 3.5 3.5 0 0 1 17.5 14z" />
      <polygon points="12 14 9.5 18 12.5 18 11.5 22 15.5 17 12.5 17 13.5 14" fill="currentColor" stroke="none" />
    </svg>

    <!-- 雨夹雪 / 冻雨 (Sleet) -->
    <svg
      v-else-if="iconType === 'sleet'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <path d="M17.5 14H7a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17.5 6 3.5 3.5 0 0 1 17.5 14z" />
      <line x1="8" y1="17" x2="7" y2="20" />
      <circle cx="15" cy="18.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>

    <!-- 雪 / 暴雪 (Snow) -->
    <svg
      v-else-if="iconType === 'snow'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <path d="M17.5 14H7a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17.5 6 3.5 3.5 0 0 1 17.5 14z" />
      <circle cx="8" cy="18" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="16" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>

    <!-- 大雨 / 暴雨 (Heavy Rain) -->
    <svg
      v-else-if="iconType === 'heavy-rain'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <path d="M17.5 13H7a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17.5 5 3.5 3.5 0 0 1 17.5 13z" />
      <line x1="7" y1="16" x2="5.5" y2="20" />
      <line x1="11" y1="16" x2="9.5" y2="20" />
      <line x1="15" y1="16" x2="13.5" y2="20" />
      <line x1="19" y1="16" x2="17.5" y2="20" />
    </svg>

    <!-- 小雨 / 阵雨 / 雨 (Rain) -->
    <svg
      v-else-if="iconType === 'rain'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <path d="M17.5 14H7a4.5 4.5 0 0 1-.5-8.97A5.5 5.5 0 0 1 17.5 6 3.5 3.5 0 0 1 17.5 14z" />
      <line x1="8" y1="17" x2="7" y2="20" />
      <line x1="12" y1="17" x2="11" y2="20" />
      <line x1="16" y1="17" x2="15" y2="20" />
    </svg>

    <!-- 霾 / 烟雾 / 烟霾 (Haze / Smoke) -->
    <!-- 极简高雅的大气微粒流线：上层悬浮微粒层次与平滑渐变呼吸流线，彻底替代粗糙灰色方块 -->
    <svg
      v-else-if="iconType === 'haze'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <path d="M6 6.5A4.5 4.5 0 0 1 14.5 5a3.5 3.5 0 0 1 3.5 3.5" opacity="0.65" />
      <line x1="3" y1="11" x2="21" y2="11" />
      <line x1="5" y1="15" x2="19" y2="15" />
      <line x1="7" y1="19" x2="17" y2="19" />
    </svg>

    <!-- 雾 / 轻雾 / 大雾 (Fog / Mist) -->
    <svg
      v-else-if="iconType === 'fog'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <line x1="6" y1="20" x2="18" y2="20" />
    </svg>

    <!-- 沙尘 / 扬沙 / 浮尘 (Sand / Dust) -->
    <svg
      v-else-if="iconType === 'dust'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <path d="M4 8h12a3 3 0 1 0-3-3" />
      <path d="M3 13h15a3 3 0 1 1-3 3" />
      <circle cx="6" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="18" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>

    <!-- 大风 (Wind) -->
    <svg
      v-else-if="iconType === 'wind'"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
    </svg>

    <!-- 默认 / 温度计 (Default / Unknown) -->
    <svg
      v-else
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon-svg"
    >
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  name: {
    type: String,
    default: "",
  },
  size: {
    type: [Number, String],
    default: 18,
  },
});

const iconSize = computed(() => Number(props.size) || 18);
const weatherType = computed(() => props.name || "");

// 根据天气文本匹配对应的极简矢量图标
const iconType = computed(() => {
  const t = (props.name || "").trim();
  if (!t) return "unknown";

  if (t.includes("雷")) return "thunder";
  if (t.includes("雨夹雪") || t.includes("冻雨")) return "sleet";
  if (t.includes("雪") || t.includes("冰粒") || t.includes("冰雹")) return "snow";
  if (t.includes("暴雨") || t.includes("大雨") || t.includes("特大")) return "heavy-rain";
  if (t.includes("雨")) return "rain";
  if (t.includes("霾") || t.includes("烟")) return "haze"; // 烟雾、霾、烟霾
  if (t.includes("雾")) return "fog";
  if (t.includes("沙") || t.includes("尘")) return "dust";
  if (t.includes("风")) return "wind";
  if (t.includes("阴")) return "overcast";
  if (t.includes("云")) return "cloudy";
  if (t.includes("晴")) return "sunny";

  return "unknown";
});
</script>

<style scoped>
.weather-icon-svg {
  flex-shrink: 0;
  vertical-align: middle;
  line-height: 1;
}

.icon-svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
</style>
