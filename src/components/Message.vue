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

const nameRef = ref(null);
let nameObserver = null;

// 动态测量 Logo 站点名称的像素宽度和起始位置，并注入 CSS 变量，
// 供小窗口与移动端下的天气副标题实现严格的“左对齐 + 右对齐”
const updateNameMetrics = () => {
  if (!nameRef.value) return;
  const nameEl = nameRef.value;
  const logoEl = nameEl.closest(".logo");
  const logoImg = logoEl ? logoEl.querySelector(".logo-img") : null;
  const imgWidth = logoImg && logoImg.offsetWidth > 0 ? logoImg.offsetWidth : 38;
  const nameStyle = window.getComputedStyle(nameEl);
  const paddingLeft = parseFloat(nameStyle.paddingLeft) || 10;

  // 1. 文字起始 x 坐标 (图标宽 + paddingLeft)
  const textLeft = imgWidth + paddingLeft;

  // 2. 文本内容的真实精确宽度 (clientWidth - paddingLeft)
  let textWidth = nameEl.clientWidth - paddingLeft;
  if (!textWidth || textWidth <= 0) {
    const bg = nameEl.querySelector(".bg");
    const sm = nameEl.querySelector(".sm");
    textWidth = (bg ? bg.offsetWidth : 0) + (sm ? sm.offsetWidth : 0);
  }

  if (textWidth > 0) {
    document.documentElement.style.setProperty("--logo-text-left", `${Math.round(textLeft)}px`);
    document.documentElement.style.setProperty("--logo-text-width", `${Math.round(textWidth)}px`);
  }
};

onMounted(() => {
  updateNameMetrics();
  if (document.fonts) {
    document.fonts.ready.then(updateNameMetrics);
  }
  window.addEventListener("resize", updateNameMetrics);
  if (nameRef.value && "ResizeObserver" in window) {
    nameObserver = new ResizeObserver(() => {
      updateNameMetrics();
    });
    nameObserver.observe(nameRef.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateNameMetrics);
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
