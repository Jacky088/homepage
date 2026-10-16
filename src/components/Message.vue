<template>
  <!-- 基本信息 -->
  <div class="message">
    <!-- Logo（点击打开时光胶囊彩蛋） -->
    <div
      ref="logoRef"
      class="logo"
      title="点击探索时光胶囊 ⏳"
      @click="store.capsuleOpenState = !store.capsuleOpenState"
    >
      <img class="logo-img" :src="siteLogo" alt="logo" />
      <div
        ref="nameRef"
        :class="{ name: true, 'text-hidden': true, long: siteUrl.main.length >= 6 }"
      >
        <span class="bg">{{ siteUrl.main }}</span>
        <span class="sm">{{ siteUrl.ext }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { mainStore } from "@/store";
const store = mainStore();

const logoRef = ref(null);
const nameRef = ref(null);
let logoObserver = null;
let nameObserver = null;

// 动态测量 Logo 整体（图标左边缘至网址右边缘）与文字宽，
// 注入 CSS 变量供天气副标题实现严格的“左贴图标、右贴网址”
const updateNameMetrics = () => {
  const logoEl = logoRef.value || (nameRef.value && nameRef.value.closest(".logo"));
  if (!logoEl) return;

  const logoImg = logoEl.querySelector(".logo-img");
  const imgWidth = logoImg && logoImg.offsetWidth > 0 ? logoImg.offsetWidth : 38;

  let textLeft = imgWidth;
  let textWidth = 0;

  if (nameRef.value) {
    const nameEl = nameRef.value;
    const nameStyle = window.getComputedStyle(nameEl);
    const paddingLeft = parseFloat(nameStyle.paddingLeft) || 10;
    textLeft = imgWidth + paddingLeft;

    textWidth = nameEl.clientWidth - paddingLeft;
    if (!textWidth || textWidth <= 0) {
      const bg = nameEl.querySelector(".bg");
      const sm = nameEl.querySelector(".sm");
      textWidth = (bg ? bg.offsetWidth : 0) + (sm ? sm.offsetWidth : 0);
    }
  }

  // Logo 整体精确宽度 (从图标最左边缘到网址最右边缘)
  const fullWidth = Math.round(logoEl.getBoundingClientRect().width || logoEl.offsetWidth);

  if (textWidth > 0) {
    document.documentElement.style.setProperty("--logo-text-left", `${Math.round(textLeft)}px`);
    document.documentElement.style.setProperty("--logo-text-width", `${Math.round(textWidth)}px`);
  }
  if (fullWidth > 0) {
    document.documentElement.style.setProperty("--logo-full-width", `${fullWidth}px`);
  }
};

onMounted(() => {
  updateNameMetrics();
  if (document.fonts) {
    document.fonts.ready.then(updateNameMetrics);
  }
  window.addEventListener("resize", updateNameMetrics);

  if ("ResizeObserver" in window) {
    if (logoRef.value) {
      logoObserver = new ResizeObserver(() => updateNameMetrics());
      logoObserver.observe(logoRef.value);
    }
    if (nameRef.value) {
      nameObserver = new ResizeObserver(() => updateNameMetrics());
      nameObserver.observe(nameRef.value);
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateNameMetrics);
  if (logoObserver) {
    logoObserver.disconnect();
    logoObserver = null;
  }
  if (nameObserver) {
    nameObserver.disconnect();
    nameObserver = null;
  }
});

// 主页站点logo
const siteLogo = import.meta.env.VITE_SITE_MAIN_LOGO;
// 站点链接
const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url) return { main: "example", ext: ".com" };
  const urlFormat = url.replace(/^(https?:\/\/)/, "").split("/")[0].trim();
  const firstDot = urlFormat.indexOf(".");
  if (firstDot === -1) {
    return { main: urlFormat, ext: "" };
  }
  return {
    main: urlFormat.slice(0, firstDot),
    ext: urlFormat.slice(firstDot),
  };
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
      transition:
        width 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        height 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.3s ease;
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
        transition: font-size 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .sm {
        margin-left: 2px;
        font-size: 1.05rem;
        transition: font-size 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
    }

    @media (max-width: $bp-md) {
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
