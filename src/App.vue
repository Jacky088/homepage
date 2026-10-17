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
        <div class="header-brand">
          <Message />
        </div>
        <Links />
        <div class="header-weather">
          <WeatherBadge />
        </div>
        <div class="header-actions">
          <!-- 1. 壁纸切换按钮 -->
          <FloatTools />
          <!-- 2. 音乐按钮 -->
          <button
            v-if="playerHasId"
            type="button"
            class="action-btn music-btn glass-pill"
            :class="{ 'is-playing': store.playerState }"
            title="打开音乐播放器"
            @click="openMusicPanel"
          >
            <svg class="action-icon music-note-icon" viewBox="0 0 24 24" width="18" height="18" fill="#ffffff">
              <path d="M9 18.5V5.5l11-2v12.4a3 3 0 1 1-1.5-2.6V6.3l-8 1.5v10.7a3 3 0 1 1-1.5-2.6z" />
            </svg>
          </button>
          <!-- 3. 菜单按钮 (仅在小窗口/导航折叠时出现) -->
          <button
            v-show="store.navCollapsed"
            type="button"
            class="action-btn menu-btn glass-pill"
            :class="{ 'is-active': store.mobileOpenState }"
            :aria-expanded="store.mobileOpenState"
            aria-controls="mobile-drawer"
            :title="store.mobileOpenState ? '关闭网站列表' : '展开网站列表'"
            @click="store.mobileOpenState = !store.mobileOpenState"
          >
            <div class="burger-icon" :class="{ 'is-active': store.mobileOpenState }">
              <span class="burger-line line-1"></span>
              <span class="burger-line line-2"></span>
              <span class="burger-line line-3"></span>
            </div>
          </button>
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
      <TimeCapsule />
      <Music v-if="playerHasId" />

      <!-- 5. 底部区域：页脚（包含社交、版权、歌词） -->
      <div
        :class="['bottom-bar', { 'mobile-hidden': store.mobileOpenState }]"
        v-show="!store.backgroundShow && !store.setOpenState"
      >
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
import MoreSet from "@/views/MoreSet/index.vue";
import WeatherBadge from "@/components/WeatherBadge.vue";
import FloatTools from "@/components/FloatTools.vue";
import TimeCapsule from "@/components/TimeCapsule.vue";
import Music from "@/components/Music.vue";
import cursorInit from "@/utils/cursor.js";
import { isMobileWidth } from "@/constants/breakpoint";

const store = mainStore();

// 自定义鼠标实例的清理函数（仅在精确指针设备上会被赋值）
let cursorCleanup = null;

// 播放器 ID
const playerHasId = import.meta.env.VITE_SONG_ID;

// 打开音乐播放面板
const openMusicPanel = () => {
  if (!store.musicIsOk) {
    showMessage({
      message: "音乐播放器正在加载中或初始化失败！",
      type: "warning",
      grouping: true,
    });
    return;
  }
  store.musicOpenState = true;
};

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
    // 与 SCSS 的 max-width: 720px 同口径：720px 归移动端
    if (isMobileWidth(value)) {
      store.setOpenState = false;
    }
  },
);

// 鼠标中键事件
const onMiddleMouseDown = (event) => {
  if (event.button === 1) {
    // 阻止浏览器默认的中键自动滚动，否则切换壁纸的同时页面会滚一下
    event.preventDefault();
    store.backgroundShow = !store.backgroundShow;
    showMessage({
      message: `已${store.backgroundShow ? "开启" : "退出"}壁纸展示状态`,
      grouping: true,
    });
  }
};

// 屏蔽右键（用 addEventListener 注册，避免属性赋值覆盖其他处理器）
const onContextMenu = (event) => {
  showMessage({
    message: "为了浏览体验，本站禁用右键",
    grouping: true,
    duration: 2000,
  });
  event.preventDefault();
};

onMounted(() => {
  // 自定义鼠标（返回清理函数，卸载时还原光标样式）
  cursorCleanup = cursorInit();

  document.addEventListener("contextmenu", onContextMenu);

  window.addEventListener("mousedown", onMiddleMouseDown);

  // 监听当前页面宽度
  getWidth();
  window.addEventListener("resize", getWidth);
});

onBeforeUnmount(() => {
  if (cursorCleanup) {
    cursorCleanup();
    cursorCleanup = null;
  }
  document.removeEventListener("contextmenu", onContextMenu);
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
    justify-content: flex-start;
    z-index: 20;
    animation: header-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
    transition:
      min-height 0.3s cubic-bezier(0.16, 1, 0.3, 1),
      padding 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    &.drawer-open {
      z-index: 101; // 抽屉菜单打开时，顶栏提升至抽屉遮罩层 (z-index 100) 上方
      pointer-events: none; // 空白处点击事件透传给下方的遮罩层以关闭抽屉

      .action-btn.menu-btn {
        pointer-events: auto; // 关闭按钮保持独立可点击
      }
    }

    .header-brand {
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    :deep(.links) {
      margin-left: 12px;
    }

    .header-weather {
      margin-left: auto;
      flex-shrink: 0;
      display: flex;
      align-items: center;
    }

    .header-actions {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      margin-left: 10px;
      flex-shrink: 0;
    }

    .action-btn {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: inline-flex;
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

      .action-icon {
        width: 18px;
        height: 18px;
        display: inline-flex;
      }

      &:hover {
        transform: translateY(-1px) scale(1.05);
      }
      &:active {
        transform: translateY(0) scale(0.92);
      }

      &.menu-btn.is-active {
        background: rgba(255, 255, 255, 0.22);
        border-color: rgba(255, 255, 255, 0.35);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
      }

      &.music-btn.is-playing .music-note-icon {
        animation: music-note-beat 1.8s ease-in-out infinite;
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

    // 小窗口与移动端布局：
    // 第 1 行：左侧网站标题 (brand)，右侧壁纸/音乐/菜单 (actions) 横向对齐；
    // 第 2 行：天气信息作为副标题 (weather) 位于网站标题正下方，靠左贴齐。
    @mixin header-compact-layout {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-rows: auto auto;
      grid-template-areas:
        "brand actions"
        "weather weather";
      row-gap: 2px;
      column-gap: 12px;
      align-items: center;
      min-height: 68px;
      height: auto;
      padding: 10px 16px;

      :deep(.links) {
        display: none !important;
      }

      .header-brand {
        grid-area: brand;
        justify-self: start;
        display: flex;
        align-items: center;
      }

      .header-actions {
        grid-area: actions;
        justify-self: end;
        margin-left: 0;
        gap: 8px;

        .action-btn {
          width: 34px;
          height: 34px;

          .action-icon {
            width: 16px;
            height: 16px;
          }

          .burger-icon {
            width: 18px;
            height: 18px;

            .burger-line {
              left: 1px;
              width: 16px;
              &.line-1 {
                transform: translateY(-4.8px);
              }
              &.line-3 {
                transform: translateY(4.8px);
              }
            }

            &.is-active {
              .burger-line {
                &.line-1 {
                  transform: translateY(0) rotate(45deg);
                }
                &.line-3 {
                  transform: translateY(0) rotate(-45deg);
                }
              }
            }
          }
        }
      }

      .header-weather {
        grid-area: weather;
        justify-self: start;
        margin-left: 0;
        padding-left: 4px; // 视觉微调：适当右移 4px，与 Logo 图标主体图形视觉对齐
        display: flex;
        align-items: center;
      }
    }

    @media (max-width: $bp-md) {
      @include header-compact-layout;
    }
  }

  @keyframes music-note-beat {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.12);
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

    @media (max-width: $bp-md) {
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
    align-items: center;
    padding: 0;
    animation: footer-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both;

    @media (max-width: $bp-md) {
      transition: opacity 0.2s ease;
      &.mobile-hidden {
        opacity: 0;
        pointer-events: none;
      }
    }
  }
}
</style>
