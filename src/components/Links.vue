<template>
  <div v-if="siteLinks[0]" :class="['links', { 'mobile-open': store.mobileOpenState }]">
    <a
      v-for="item in siteLinks"
      :key="item.name"
      class="link-item"
      @click="jumpLink(item)"
    >
      {{ item.name }}
    </a>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import siteLinks from "@/assets/siteLinks.json";

const store = mainStore();

// 链接跳转
const jumpLink = (data) => {
  if (data.name === "音乐" && store.musicClick) {
    if (typeof $openList === "function") $openList();
  } else {
    try {
      const url = new URL(data.link);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        window.open(data.link, "_blank", "noopener,noreferrer");
      } else {
        console.warn('不安全的链接协议:', url.protocol);
      }
    } catch (e) {
      console.error('无效的链接格式:', data.link);
    }
  }
};
</script>

<style lang="scss" scoped>
.links {
  position: absolute;
  top: 18px;
  left: 210px;
  height: 52px;
  z-index: 10;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 32px;
  animation: fade 0.5s;

  .link-item {
    font-size: 1.05rem;
    color: #fff;
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
    position: relative;
    transition: opacity 0.3s, transform 0.3s, text-shadow 0.3s;
    opacity: 0.85;
    padding-bottom: 6px;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 2px;
      background: #fff;
      border-radius: 2px;
      transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), left 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    &:hover {
      opacity: 1;
      text-decoration: none;
      color: #fff;
      transform: translateY(-2px);
      text-shadow: 0 0 8px rgba(255, 255, 255, 0.6), 0 0 16px rgba(255, 255, 255, 0.3);

      &::after {
        width: 100%;
        left: 0;
      }
    }

    &:active {
      transform: scale(0.95);
    }
  }

  @media (max-width: 1100px) {
    gap: 20px;
    .link-item {
      font-size: 0.95rem;
    }
  }

  @media (max-width: 720px) {
    position: fixed;
    top: 0;
    right: 0;
    left: auto;
    height: 100vh;
    width: 260px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 24px;
    padding: 80px 30px 40px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(20px);
    transform: translateX(100%);
    transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
    z-index: 15;
    flex-wrap: nowrap;
    max-width: none;

    &.mobile-open {
      transform: translateX(0);
    }

    .link-item {
      font-size: 1.1rem;
      opacity: 1;
      padding-bottom: 8px;
    }
  }
}
</style>
