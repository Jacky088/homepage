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
        :class="['site-header', { 'drawer-open': store.mobileOpenState }]"
        v-show="!store.backgroundShow && !store.setOpenState"
      >
        <Message />
        <Links />
        <div class="header-right">
          <WeatherBadge />
          <div class="menu-btn-slot">
            <Transition name="fade">
              <div
                class="menu-btn glass-pill"
                :class="{ 'is-active': store.mobileOpenState }"
                v-show="store.navCollapsed"
                :title="store.mobileOpenState ? '关闭网站列表' : '展开网站列表'"
                @click="store.mobileOpenState = !store.mobileOpenState"
              >
                <div class="burger-icon" :class="{ 'is-active': store.mobileOpenState }">
                  <span class="burger-line line-1"></span>
                  <span class="burger-line line-2"></span>
                  <span class="burger-line line-3"></span>
                </div>
              </div>
            </Transition>
          </div>
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
      <Transition name="modal-fade">
        <section class="more" v-show="store.setOpenState" @click="store.setOpenState = false">
          <MoreSet />
        </section>
      </Transition>

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
    transition:
      height 0.3s cubic-bezier(0.16, 1, 0.3, 1),
      padding 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    &.drawer-open {
      z-index: 101; // 抽屉菜单打开时，顶栏提升至抽屉遮罩层 (z-index 100) 上方
      pointer-events: none; // 空白处点击事件透传给下方的遮罩层以关闭抽屉

      .menu-btn {
        pointer-events: auto; // 关闭按钮保持独立可点击
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
      z-index: 20;
      transition: gap 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      .menu-btn-slot {
        width: 38px;
        height: 38px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }

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
        pointer-events: auto;
        transition:
          transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
          background-color 0.25s ease,
          border-color 0.25s ease,
          box-shadow 0.25s ease;

        &:hover {
          transform: translateY(-1px) scale(1.05);
        }
        &:active {
          transform: translateY(0) scale(0.92);
        }

        &.is-active {
          background: rgba(255, 255, 255, 0.22);
          border-color: rgba(255, 255, 255, 0.35);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        }

        .burger-icon {
          width: 20px;
          height: 20px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;

          .burger-line {
            position: absolute;
            left: 1px;
            width: 18px;
            height: 2px;
            background-color: #ffffff;
            border-radius: 2px;
            transform-origin: center;
            transition:
              transform 0.32s cubic-bezier(0.16, 1, 0.3, 1),
              opacity 0.22s ease;
            will-change: transform, opacity;

            &.line-1 {
              transform: translateY(-5.5px);
            }

            &.line-2 {
              transform: translateY(0);
              opacity: 1;
            }

            &.line-3 {
              transform: translateY(5.5px);
            }
          }

          &.is-active {
            .burger-line {
              &.line-1 {
                transform: translateY(0) rotate(45deg);
              }

              &.line-2 {
                opacity: 0;
                transform: scaleX(0);
              }

              &.line-3 {
                transform: translateY(0) rotate(-45deg);
              }
            }
          }
        }
      }
    }

    @media (max-width: 720px) and (hover: none) and (pointer: coarse), (max-width: 480px) {
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
    display: flex;
    align-items: center;
    justify-content: center;
  }

  // 统一设置弹窗与遮罩过渡动画
  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    :deep(.set) {
      transition:
        transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
  }

  .modal-fade-leave-active {
    transition-duration: 0.25s;

    :deep(.set) {
      transition-duration: 0.25s;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .modal-fade-enter-from,
  .modal-fade-leave-to {
    opacity: 0;

    :deep(.set) {
      opacity: 0;
      transform: scale(0.94) translateY(16px);
    }
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
