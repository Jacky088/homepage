<template>
  <div id="loader-wrapper" :class="store.imgLoadStatus ? 'loaded' : null">
    <div class="loader">
      <!-- Logo 呼吸光环 -->
      <div class="logo-wrapper">
        <div class="ring ring-outer" />
        <div class="ring ring-inner" />
        <img class="logo-img" :src="siteLogo" alt="logo" />
      </div>
      <!-- 文字区域 -->
      <div class="loader-text">
        <span class="name">欢迎进入{{ siteName }}</span>
        <div class="progress-bar">
          <div class="progress-glow" />
        </div>
      </div>
    </div>
    <div class="loader-backdrop" />
  </div>
</template>

<script setup>
import { mainStore } from "@/store";

const store = mainStore();

// 配置
const siteName = import.meta.env.VITE_SITE_NAME;
const siteLogo = import.meta.env.VITE_SITE_MAIN_LOGO;
</script>

<style lang="scss" scoped>
#loader-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  overflow: hidden;

  .loader {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2;

    .logo-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;

      .ring {
        position: absolute;
        border-radius: 50%;
        border: 1.5px solid transparent;
      }

      .ring-outer {
        width: 120px;
        height: 120px;
        border-top-color: rgba(255, 255, 255, 0.8);
        border-right-color: rgba(255, 255, 255, 0.2);
        border-bottom-color: rgba(255, 255, 255, 0.05);
        border-left-color: rgba(255, 255, 255, 0.4);
        animation: spin-smooth 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }

      .ring-inner {
        width: 100px;
        height: 100px;
        border-top-color: rgba(255, 255, 255, 0.05);
        border-right-color: rgba(255, 255, 255, 0.6);
        border-bottom-color: rgba(255, 255, 255, 0.8);
        border-left-color: rgba(255, 255, 255, 0.1);
        animation: spin-smooth 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse;
      }

      .logo-img {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        z-index: 1;
        animation: breathe 2s ease-in-out infinite;
      }
    }

    .loader-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #fff;
      margin-top: 36px;

      .name {
        font-size: 1.4rem;
        letter-spacing: 4px;
        opacity: 0;
        animation: text-reveal 0.8s ease-out 0.3s forwards;
      }

      .progress-bar {
        margin-top: 16px;
        width: 100%;
        height: 3px;
        background: rgba(255, 255, 255, 0.12);
        border-radius: 3px;
        overflow: hidden;
        opacity: 0;
        animation: text-reveal 0.8s ease-out 0.6s forwards;

        .progress-glow {
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 1), transparent);
          border-radius: 3px;
          animation: progress-slide 1.5s ease-in-out infinite;
        }
      }
    }
  }

  .loader-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    background:
      // 噪点纹理层
      url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"),
      // 星云光斑
      radial-gradient(ellipse at 20% 30%, rgba(90, 60, 150, 0.2) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(40, 80, 160, 0.15) 0%, transparent 45%),
      radial-gradient(ellipse at 60% 75%, rgba(100, 50, 120, 0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 35% 80%, rgba(30, 60, 130, 0.1) 0%, transparent 40%),
      // 星空渐变底色
      linear-gradient(
        180deg,
        #0a0a1a 0%,
        #0f1528 20%,
        #141e3a 45%,
        #1a1230 65%,
        #0d0d1f 85%,
        #050510 100%
      );
    box-shadow: inset 0 0 150px rgba(10, 10, 40, 0.5);
  }

  // 加载完成动画
  &.loaded {
    visibility: hidden;
    transition: visibility 0s 1.2s;

    .loader {
      .logo-wrapper {
        transform: scale(0.8);
        opacity: 0;
        transition: all 0.4s ease-out;
      }
      .loader-text {
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s 0.1s ease-out;
      }
    }

    .loader-backdrop {
      opacity: 0;
      transition: opacity 0.6s 0.4s ease-out;
    }
  }
}

// 平滑旋转
@keyframes spin-smooth {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// Logo 呼吸效果
@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}

// 文字渐入
@keyframes text-reveal {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

// 进度条滑动
@keyframes progress-slide {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(350%);
  }
}
</style>
