<template>
  <!-- 社交链接 -->
  <div class="social">
    <div class="link">
      <a
        v-for="item in socialLinks"
        :key="item.name"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        @mouseenter="socialTip = item.tip"
        @mouseleave="socialTip = '通过这里联系我'"
      >
        <img class="icon" :src="item.icon" height="24" />
      </a>
      <!-- 切换背景 -->
      <a
        style="cursor: pointer"
        @click="toggleBackground"
        @mouseenter="socialTip = store.coverType === '4' ? '切换为图片壁纸' : '切换为视频背景'"
        @mouseleave="socialTip = '通过这里联系我'"
      >
        <!-- 图片壁纸图标 (Solid Landscape) -->
        <svg
          v-if="store.coverType === '4'"
          class="icon"
          viewBox="2 2 20 20"
          width="24"
          height="24"
        >
          <path
            d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
            fill="#ffffff"
          />
        </svg>
        <!-- 视频背景图标 (Solid Video) -->
        <svg
          v-else
          class="icon"
          viewBox="2 4 20 16"
          width="24"
          height="24"
        >
          <path
            d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
            fill="#ffffff"
          />
        </svg>
      </a>
      <!-- 音乐播放器 -->
      <a
        style="cursor: pointer"
        @click="handleMusicClick"
        @mouseenter="socialTip = '来点music听听？'"
        @mouseleave="socialTip = '通过这里联系我'"
      >
        <svg class="icon" viewBox="0 0 24 24" width="24" height="24">
          <circle cx="12" cy="12" r="12" fill="#ffffff" />
          <path d="M10 7.5v6.17a2.5 2.5 0 1 0 1.5 2.33V9.5l4-1v4.67a2.5 2.5 0 1 0 1.5 2.33V7l-7 1.5z" fill="#333" />
        </svg>
      </a>
    </div>
    <span class="tip">{{ socialTip }}</span>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { showMessage } from "@/utils/message.js";
import socialLinks from "@/assets/socialLinks.json";

const store = mainStore();

// 社交链接提示
const socialTip = ref("通过这里联系我");

// 点击音乐按钮
const handleMusicClick = () => {
  if (store.musicIsOk === false) {
    showMessage({
      message: "音乐播放器初始化失败！",
      grouping: true,
    });
    return;
  }
  store.musicOpenState = !store.musicOpenState;
};

// 切换背景类型
const toggleBackground = () => {
  if (store.coverType === "4") {
    store.coverType = "0";
    showMessage({
      message: "已切换为图片壁纸",
      type: "success",
    });
  } else {
    store.coverType = "4";
    showMessage({
      message: "已切换为视频背景",
      type: "success",
    });
  }
};
</script>

<style lang="scss" scoped>
.social {
  display: flex;
  align-items: center;
  height: 42px;
  background-color: transparent;
  border-radius: 12px;
  backdrop-filter: blur(0);
  animation: fade 0.5s;
  transition:
    background-color 0.3s,
    backdrop-filter 0.3s;

  .link {
    display: flex;
    align-items: center;
    justify-content: center;
    a {
      display: inherit;
      .icon {
        margin: 0 12px;
        transition: transform 0.3s;
        &:hover {
          transform: scale(1.1);
        }
        &:active {
          transform: scale(1);
        }
      }
    }
  }
  .tip {
    display: none;
    margin-left: 12px;
    animation: fade 0.5s;
  }
  @media (min-width: 768px) {
    &:hover {
      background-color: #00000040;
      backdrop-filter: blur(5px);
      .tip {
        display: block;
      }
    }
  }
  @media (max-width: 720px) {
    justify-content: center;
  }
}
</style>
