<template>
  <!-- 基本信息 -->
  <div class="message">
    <!-- Logo（点击打开时光胶囊彩蛋） -->
    <div class="logo" @click="store.capsuleOpenState = !store.capsuleOpenState">
      <img class="logo-img" :src="siteLogo" alt="logo" />
      <div :class="{ name: true, 'text-hidden': true, long: siteUrl[0].length >= 6 }">
        <span class="bg">{{ siteUrl[0] }}</span>
        <span class="sm">.{{ siteUrl[1] }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
const store = mainStore();

// 主页站点logo
const siteLogo = import.meta.env.VITE_SITE_MAIN_LOGO;
// 站点链接
const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url) return "huzz.cn".split(".");
  // 判断协议前缀
  if (url.startsWith("http://") || url.startsWith("https://")) {
    const urlFormat = url.replace(/^(https?:\/\/)/, "");
    return urlFormat.split(".");
  }
  return url.split(".");
});
</script>

<style lang="scss" scoped>
.message {
  .logo {
    position: absolute;
    top: 18px;
    left: 24px;
    z-index: 10;
    display: flex;
    flex-direction: row;
    align-items: center;
    animation: fade 0.5s;
    // 彩蛋入口：可点击，悬停时 Logo 轻微放大提示
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    .logo-img {
      border-radius: 50%;
      width: 52px;
      height: 52px;
      transition: transform 0.3s;
    }
    &:hover .logo-img {
      transform: scale(1.06);
    }
    &:active .logo-img {
      transform: scale(0.98);
    }
    .name {
      padding-left: 12px;
      font-family: "Pacifico-Regular";
      white-space: nowrap;
      transform: translateY(-6px);

      .bg {
        font-size: 2rem;
      }

      .sm {
        margin-left: 3px;
        font-size: 1.1rem;
      }
    }
    @media (max-width: 720px) {
      top: 14px;
      left: 16px;
      .logo-img {
        width: 42px;
        height: 42px;
      }
      .name {
        .bg {
          font-size: 1.6rem;
        }
        .sm {
          font-size: 0.9rem;
        }
      }
    }
  }
}
</style>
