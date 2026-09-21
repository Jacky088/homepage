<template>
  <!-- 加载 -->
  <Loading />
  <!-- 壁纸 -->
  <Background @loadComplete="loadComplete" />
  <!-- 主界面 -->
  <Transition name="fade" mode="out-in">
    <main id="main" v-if="store.imgLoadStatus">
      <!-- 1. 顶栏：Logo + 网站链接 + 天气/菜单按钮 -->
      <header
        class="site-header"
        v-show="!store.backgroundShow && !store.setOpenState"
      >
        <Message />
        <Links />
        <div class="header-right">
          <WeatherBadge />
          <Transition name="fade">
            <div
              class="menu-btn glass-pill"
              v-show="store.navCollapsed && !store.mobileOpenState"
              @click="store.mobileOpenState = !store.mobileOpenState"
            >
              <component :is="HamburgerButton" size="20" />
            </div>
          </Transition>
        </div>
      </header>

      <!-- 2. 中间英雄区：一言 -->
      <section
        :class="['hero-section', { 'mobile-hidden': store.mobileOpenState }]"
        v-show="!store.backgroundShow && !store.setOpenState"
      >
        <Hitokoto />
      </section>

      <!-- 3. 设置面板弹层 -->
      <section class="more" v-show="store.setOpenState" @click="store.setOpenState = false">
        <MoreSet />
      </section>

      <!-- 4. 浮动部件 -->
      <FloatTools />
      <TimeCapsule />
      <Music v-if="playerHasId" />

      <!-- 5. 底部区域：社交 + 备案/歌词 -->
      <div
        :class="['bottom-bar', { 'mobile-hidden': store.mobileOpenState }]"
        v-show="!store.backgroundShow && !store.setOpenState"
      >
        <SocialLinks />
        <Footer />
      </div>
    </main>
  </Transition>
</template>

<script setup>
import { helloInit, checkDays } from "@/utils/getTime.js";
import { HamburgerButton } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import { showMessage } from "@/utils/message.js";
import Loading from "@/components/Loading.vue";
import Message from "@/components/Message.vue";
import Links from "@/components/Links.vue";
import Hitokoto from "@/components/Hitokoto.vue";
import Background from "@/components/Background.vue";
import Footer from "@/components/Footer.vue";
import SocialLinks from "@/components/SocialLinks.vue";
import MoreSet from "@/views/MoreSet/index.vue";
import WeatherBadge from "@/components/WeatherBadge.vue";
import FloatTools from "@/components/FloatTools.vue";
import TimeCapsule from "@/components/TimeCapsule.vue";
import Music from "@/components/Music.vue";
import cursorInit from "@/utils/cursor.js";

const store = mainStore();

// 播放器 ID
const playerHasId = import.meta.env.VITE_SONG_ID;

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
      store.setOpenState = false;
    }
  },
);

  // 鼠标中键事件
  const onMiddleMouseDown = (event) => {
    if (event.button == 1) {
      store.backgroundShow = !store.backgroundShow;
      showMessage({
        message: `已${store.backgroundShow ? "开启" : "退出"}壁纸展示状态`,
        grouping: true,
      });
    }
  };

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

  window.addEventListener("mousedown", onMiddleMouseDown);

  // 监听当前页面宽度
  getWidth();
  window.addEventListener("resize", getWidth);
});

onBeforeUnmount(() => {
  window.removeEventListener("mousedown", onMiddleMouseDown);
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .site-header {
    width: 100%;
    height: 72px;
    padding: 0 24px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    z-index: 20;
    animation: header-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
      z-index: 20;

      .menu-btn {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        cursor: pointer;
        user-select: none;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);

        :deep(.i-icon) {
          display: inline-flex;
          line-height: 0;
        }

        &:hover {
          transform: translateY(-1px) scale(1.05);
        }
        &:active {
          transform: translateY(0) scale(0.92);
        }
      }
    }

    @media (max-width: 720px) {
      height: 60px;
      padding: 0 16px;
      .header-right {
        gap: 8px;
      }
    }
  }

  .hero-section {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 0;
    z-index: 10;
    animation: hero-enter 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;

    @media (max-width: 720px) {
      transition: opacity 0.2s ease;
      &.mobile-hidden {
        opacity: 0;
        pointer-events: none;
      }
    }
  }

  .more {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    z-index: 50;
    animation: fade 0.3s;
  }

  .bottom-bar {
    width: 100%;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    animation: footer-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both;

    :deep(.social) {
      padding-left: 24px;
    }

    @media (max-width: 720px) {
      align-items: center;

      :deep(.social) {
        padding-left: 0;
      }

      transition: opacity 0.2s ease;
      &.mobile-hidden {
        opacity: 0;
        pointer-events: none;
      }
    }
  }
}
</style>
