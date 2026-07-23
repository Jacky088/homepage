<template>
  <!-- 基本信息 -->
  <div class="message">
    <!-- Logo -->
    <div class="logo">
      <img class="logo-img" :src="siteLogo" alt="logo" />
      <div :class="{ name: true, 'text-hidden': true, long: siteUrl[0].length >= 6 }">
        <span class="bg">{{ siteUrl[0] }}</span>
        <span class="sm">.{{ siteUrl[1] }}</span>
      </div>
    </div>
    <!-- 简介 (已隐藏) -->
    <!-- <div class="description" @click="changeBox">
      <div class="content">
        <Icon size="16">
          <QuoteLeft />
        </Icon>
        <Transition name="fade" mode="out-in">
          <div :key="descriptionText.hello + descriptionText.text" class="text">
            <p>{{ descriptionText.hello }}</p>
            <p>{{ descriptionText.text }}</p>
          </div>
        </Transition>
        <Icon size="16">
          <QuoteRight />
        </Icon>
      </div>
    </div> -->
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
    .logo-img {
      border-radius: 50%;
      width: 52px;
      height: 52px;
    }
    .name {
      padding-left: 12px;
      font-family: "Pacifico-Regular";
      white-space: nowrap;

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

  .description {
    padding: 1rem;
    margin-top: 1rem;
    max-width: 460px;
    animation: fade 0.5s;

    .content {
      display: flex;
      justify-content: space-between;

      .text {
        margin: 0.75rem 1rem;
        line-height: 2rem;
        margin-right: auto;
        transition: opacity 0.2s;

        p {
          &:nth-of-type(1) {
            font-family: "Pacifico-Regular";
          }
        }
      }

      .xicon:nth-of-type(2) {
        align-self: flex-end;
      }
    }
    @media (max-width: 720px) {
      max-width: 100%;
      pointer-events: none;
    }
  }
}
</style>
