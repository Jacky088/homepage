<template>
  <!-- 加载 -->
  <Loading />
  <!-- 壁纸 -->
  <Background @loadComplete="loadComplete" />
  <!-- 主界面 -->
  <Transition name="fade" mode="out-in">
    <main id="main" v-if="store.imgLoadStatus">
      <div class="container" v-show="!store.backgroundShow">
        <section :class="['all', { 'mobile-hidden': store.mobileOpenState }]" v-show="!store.setOpenState">
          <MainLeft />
          <MainRight v-show="!store.boxOpenState" />
          <Box v-show="store.boxOpenState" />
        </section>
        <section class="more" v-show="store.setOpenState" @click="store.setOpenState = false">
          <MoreSet />
        </section>
      </div>
      <!-- 顶栏天气徽章 -->
      <WeatherBadge v-show="!store.backgroundShow && !store.setOpenState" />
      <!-- 移动端菜单按钮 -->
      <Transition name="fade">
        <Icon
          class="menu"
          size="24"
          v-show="!store.backgroundShow && store.navCollapsed && !store.mobileOpenState"
          @click="store.mobileOpenState = !store.mobileOpenState"
        >
          <component :is="HamburgerButton" />
        </Icon>
      </Transition>
      <!-- 底部区域：社交 + 备案 -->
      <div :class="['bottom-bar', { 'mobile-hidden': store.mobileOpenState }]" v-show="!store.backgroundShow && !store.setOpenState">
        <SocialLinks />
        <Footer />
      </div>
    </main>
  </Transition>
</template>

<script setup>
import { helloInit, checkDays } from "@/utils/getTime.js";
import { HamburgerButton, CloseSmall } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { Icon } from "@vicons/utils";
import { showMessage } from "@/utils/message.js";
import Loading from "@/components/Loading.vue";
import MainLeft from "@/views/Main/Left.vue";
import MainRight from "@/views/Main/Right.vue";
import Background from "@/components/Background.vue";
import Footer from "@/components/Footer.vue";
import SocialLinks from "@/components/SocialLinks.vue";
import Box from "@/views/Box/index.vue";
import MoreSet from "@/views/MoreSet/index.vue";
import WeatherBadge from "@/components/WeatherBadge.vue";
import cursorInit from "@/utils/cursor.js";
import config from "@/../package.json";

const store = mainStore();

// 页面宽度
const getWidth = () => {
  store.setInnerWidth(window.innerWidth);
};

// 加载完成事件
const loadComplete = () => {
  nextTick(() => {
    // 欢迎提示
    helloInit();
    // 默哀模式
    checkDays();
  });
};

// 监听宽度变化
watch(
  () => store.innerWidth,
  (value) => {
    if (value < 721) {
      store.boxOpenState = false;
      store.setOpenState = false;
    }
  },
);

onMounted(() => {
  // 自定义鼠标
  cursorInit();

  // 屏蔽右键
  document.oncontextmenu = () => {
    showMessage({
      message: "为了浏览体验，本站禁用右键",
      grouping: true,
      duration: 2000,
    });
    return false;
  };

  // 鼠标中键事件
  window.addEventListener("mousedown", (event) => {
    if (event.button == 1) {
      store.backgroundShow = !store.backgroundShow;
      showMessage({
        message: `已${store.backgroundShow ? "开启" : "退出"}壁纸展示状态`,
        grouping: true,
      });
    }
  });

  // 监听当前页面宽度
  getWidth();
  window.addEventListener("resize", getWidth);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", getWidth);
});
</script>

<style lang="scss" scoped>
#main {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transform: scale(1.05);
  will-change: transform, opacity;
  animation: main-enter 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.4s;
  overflow: hidden;
  .container {
    width: 100%;
    height: 100vh;
    margin: 0 auto;
    padding: 0 0.5vw;
    .all {
      width: 100%;
      height: 100%;
      padding: 0 0.75rem;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;

      @media (max-width: 720px) {
        &.mobile-hidden {
          :deep(.hitokoto),
          :deep(.function) {
            opacity: 0;
            transition: opacity 0.15s ease;
            pointer-events: none;
          }
        }
        :deep(.hitokoto),
        :deep(.function) {
          transition: opacity 0.15s ease;
        }
      }
    }
    .more {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #00000080;
      backdrop-filter: blur(20px);
      z-index: 2;
      animation: fade 0.5s;
    }
    @media (max-width: 1200px) {
      padding: 0 2vw;
    }
  }
  .bottom-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    animation: fade 0.5s;

    :deep(.social) {
      padding-left: 24px;
    }

    @media (max-width: 720px) {
      align-items: center;

      :deep(.social) {
        padding-left: 0;
      }

      transition: opacity 0.15s ease;
      &.mobile-hidden {
        opacity: 0;
        pointer-events: none;
      }
    }
  }
  .menu {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 23px; // 与天气胶囊垂直居中对齐（桌面端）
    right: 16px;
    left: auto;
    width: 42px;
    height: 42px;
    background: rgb(0 0 0 / 20%);
    backdrop-filter: blur(10px);
    border-radius: 50%;
    transition: transform 0.3s;
    animation: fade 0.5s;
    z-index: 20;
    &:active {
      transform: scale(0.95);
    }
    .i-icon {
      transform: translateY(2px);
    }
  }
  @media (max-width: 720px) {
    .menu {
      top: 14px; // 移动端保持原对齐
    }
  }
  @media (max-height: 720px) {
    overflow: hidden;
    .container {
      height: 100vh;
    }
    .menu {
      top: 14px;
      right: 16px;
      left: auto;
    }
  }
  @media (max-width: 390px) {
    overflow: hidden;
    .container {
      width: 100%;
    }
    .menu {
      top: 14px;
      right: 16px;
      left: auto;
    }
  }
}
</style>
