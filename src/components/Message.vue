<template>
  <!-- 基本信息 -->
  <div class="message">
    <!-- Logo（点击打开时光胶囊彩蛋） -->
    <div
      class="logo"
      title="点击探索时光胶囊 ⏳"
      @click="store.capsuleOpenState = !store.capsuleOpenState"
    >
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
  display: flex;
  align-items: center;
  flex-shrink: 0;
  z-index: 10;

  .logo {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

    .logo-img {
      border-radius: 50%;
      width: 48px;
      height: 48px;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
    }

    &:hover {
      transform: translateY(-1px);
      .logo-img {
        transform: scale(1.08) rotate(5deg);
        box-shadow: 0 0 16px rgba(255, 255, 255, 0.45);
      }
    }

    &:active {
      transform: translateY(0);
      .logo-img {
        transform: scale(0.96);
      }
    }

    .name {
      padding-left: 10px;
      font-family: "Pacifico-Regular";
      white-space: nowrap;
      transform: translateY(-4px);

      .bg {
        font-size: 1.85rem;
      }

      .sm {
        margin-left: 2px;
        font-size: 1.05rem;
      }
    }

    @media (max-width: 720px) {
      .logo-img {
        width: 38px;
        height: 38px;
      }
      .name {
        .bg {
          font-size: 1.5rem;
        }
        .sm {
          font-size: 0.85rem;
        }
      }
    }
  }
}
</style>
