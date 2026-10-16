<template>
  <div
    v-if="siteLinks[0]"
    ref="linksRef"
    :class="['links', { 'nav-collapsed': store.navCollapsed }]"
  >
    <!-- PC: 横排文字链接（支持左键直接跳转、鼠标中键新标签页打开与复制真实链接） -->
    <a
      v-for="item in siteLinks"
      :key="item.name"
      class="link-item"
      :href="item.name === '音乐' && store.musicClick ? '#' : item.link"
      :target="item.name === '音乐' && store.musicClick ? '_self' : '_blank'"
      rel="noopener noreferrer"
      @click="handleLinkClick($event, item)"
    >
      {{ item.name }}
    </a>
  </div>

  <!-- 网站链接总长度测量标尺（脱离文档流，不受 nav-collapsed 影响，用于实时准确测量网站链接所需真实总宽度） -->
  <div v-if="siteLinks[0]" ref="rulerRef" class="links-ruler" aria-hidden="true">
    <span v-for="item in siteLinks" :key="item.name" class="link-item">{{ item.name }}</span>
  </div>

  <!-- 移动端 / 折叠时: 底部抽屉面板 -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-show="store.navCollapsed && store.mobileOpenState" id="mobile-drawer" class="mobile-drawer-mask" @click="store.mobileOpenState = false">
        <div class="mobile-drawer" @click.stop>
          <div class="drawer-header">
            <span class="drawer-title">网站列表</span>
            <button
              type="button"
              class="drawer-close"
              aria-label="关闭网站列表"
              @click="store.mobileOpenState = false"
            >
              <close-one theme="filled" size="24" fill="#ffffff80" />
            </button>
          </div>
          <div class="drawer-grid">
            <a
              v-for="item in siteLinks"
              :key="item.name"
              class="grid-item"
              :href="item.name === '音乐' && store.musicClick ? '#' : item.link"
              :target="item.name === '音乐' && store.musicClick ? '_self' : '_blank'"
              rel="noopener noreferrer"
              @click="handleLinkClick($event, item)"
            >
              <div class="grid-icon">
                <Icon size="22">
                  <component :is="siteIcon[item.icon]" />
                </Icon>
              </div>
              <span class="grid-name">{{ item.name }}</span>
            </a>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Icon } from "@vicons/utils";
import { CloseOne } from "@icon-park/vue-next";
import { Blog, Terminal, Cloud, Compass, Book, Fire, LaptopCode, StickyNote, Staylinked, AddressCard, Toolbox, Github, Image, Info } from "@vicons/fa";
import { mainStore } from "@/store";
import siteLinks from "@/assets/siteLinks.json";
import debounce from "@/utils/debounce.js";
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { BP_MD, isMobileWidth } from "@/constants/breakpoint";

const store = mainStore();
const linksRef = ref(null);
const rulerRef = ref(null);
let resizeObserver = null;

// 网站链接图标
const siteIcon = {
  Blog,
  Cloud,
  Github,
  Compass,
  Book,
  Fire,
  LaptopCode,
  StickyNote,
  Staylinked,
  AddressCard,
  Toolbox,
  Terminal,
  Info,
  Image,
};

// 链接跳转处理
const handleLinkClick = (event, data) => {
  if (data.name === "音乐" && store.musicClick) {
    event.preventDefault();
    if (typeof $openList === "function") $openList();
    store.mobileOpenState = false;
    return;
  }
  // 普通外部链接：浏览器原生按 href 和 target 跳转，并在移动端收起抽屉
  store.mobileOpenState = false;
};

// 测量横排导航是否放得下所有网站标题，并根据网站列表真实长度动态计算折叠断点
const checkNavFit = () => {
  // 若顶栏处于隐藏状态（如设置页 / 壁纸展示），跳过测量避免计算偏差
  if (store.backgroundShow || store.setOpenState) return;

  const currentWidth = window.innerWidth;

  // 1. 移动端尺寸（<= 720px）保持移动端折叠抽屉逻辑
  if (isMobileWidth(currentWidth)) {
    store.setNavCollapsed(true);
    return;
  }

  // 2. 桌面端：基于实际网站列表标尺测量宽度动态计算所需断点
  const ruler = rulerRef.value;
  if (!ruler) return;

  // 测量所有网站链接横排所需总宽度（含内边距与元素间距）
  const linksWidth = ruler.scrollWidth || ruler.offsetWidth || 0;

  // 获取桌面顶栏其他元素的实际占据宽度
  const brandEl = document.querySelector(".site-header .header-brand");
  const brandWidth = brandEl && brandEl.offsetWidth > 0 ? brandEl.offsetWidth : 190;

  const weatherEl = document.querySelector(".site-header .header-weather");
  const weatherWidth = weatherEl && weatherEl.offsetWidth > 0 ? weatherEl.offsetWidth : 180;

  // 桌面端顶栏操作按钮组常驻宽度（壁纸 38px + 音乐 38px + gap 10px = 86px）
  const actionsEl = document.querySelector(".site-header .header-actions");
  let actionsWidth = 86;
  if (actionsEl) {
    actionsWidth = store.navCollapsed
      ? Math.max(86, actionsEl.offsetWidth - 48)
      : Math.max(86, actionsEl.offsetWidth);
  }

  // 顶栏左右内边距 (padding: 0 24px = 48px) 与链接左边距 (margin-left: 12px)
  const headerPadding = 48;
  const linksMarginLeft = 12;

  // 保持舒适呼吸感的安全缓冲间距（避免链接紧挨着天气胶囊）
  const safeMargin = 36;

  // 动态所需断点：根据网站列表真实总长度精确计算
  const requiredBreakpoint = Math.max(
    BP_MD,
    Math.ceil(brandWidth + linksMarginLeft + linksWidth + weatherWidth + actionsWidth + headerPadding + safeMargin)
  );

  // 当窗口宽度小于动态断点时折叠到汉堡菜单；大于等于动态断点时展开完整显示
  const shouldCollapse = currentWidth < requiredBreakpoint;
  store.setNavCollapsed(shouldCollapse);
  if (!shouldCollapse) {
    store.mobileOpenState = false;
  }
};

// 极速防抖版测量（20ms 既防止过载，又能保证拖拽窗口时如丝般顺滑响应）
const scheduleNavFit = debounce(checkNavFit, 20);

// 监听背景展示与设置页面关闭，及时重新测量
watch(
  () => [store.backgroundShow, store.setOpenState],
  ([bg, set]) => {
    if (!bg && !set) {
      nextTick(checkNavFit);
    }
  },
);

onMounted(() => {
  checkNavFit();
  if (document.fonts) {
    document.fonts.ready.then(checkNavFit);
  }
  window.addEventListener("resize", scheduleNavFit);
  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      scheduleNavFit();
    });
    resizeObserver.observe(document.body);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", scheduleNavFit);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});
</script>

<style lang="scss" scoped>
// PC 端横排样式
.links {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  z-index: 10;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
  padding: 0 16px 0 28px;

  .link-item {
    font-size: 1.15rem;
    color: #fff;
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
    position: relative;
    transition: opacity 0.3s, transform 0.3s, text-shadow 0.3s;
    opacity: 0.85;

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

  // 横排放不下时（由 JS 判定 navCollapsed）隐藏 PC 横排
  &.nav-collapsed {
    display: none;
  }
}

// 脱离文档流的测量标尺：不受 nav-collapsed 影响，精准读取实际字体与文字宽度
.links-ruler {
  position: absolute;
  top: -9999px;
  left: -9999px;
  visibility: hidden;
  pointer-events: none;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  padding: 0 16px 0 28px;
  white-space: nowrap;

  .link-item {
    font-size: 1.15rem;
    white-space: nowrap;
  }
}

// 移动端底部抽屉
.mobile-drawer-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  .mobile-drawer {
    width: 100%;
    max-width: 620px;
    max-height: 70vh;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(30px) saturate(1.3);
    -webkit-backdrop-filter: blur(30px) saturate(1.3);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: none;
    border-radius: 20px 20px 0 0;
    padding: 0 20px 30px;
    overflow-y: auto;
    will-change: transform;

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 4px 14px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 16px;

      .drawer-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #fff;
        letter-spacing: 1px;
      }

      .drawer-close {
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none; // 由 <span> 改为 <button>，重置默认边框
        padding: 0;
        border-radius: 50%;
        background: transparent;
        transition: transform 0.2s, opacity 0.2s;
        opacity: 0.5;

        &:hover {
          transform: scale(1.2);
          opacity: 1;
        }
        &:active {
          transform: scale(0.9);
        }
      }
    }

    .drawer-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;

      .grid-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 16px 8px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.06);
        cursor: pointer;
        transition: background 0.2s, transform 0.2s;
        text-decoration: none;

        &:active {
          transform: scale(0.95);
          background: rgba(255, 255, 255, 0.18);
        }

        .grid-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          color: #fff;
        }

        .grid-name {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.85);
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
      }
    }
  }
}

// 抽屉动画
.drawer-enter-active {
  transition: opacity 0.2s ease;
  .mobile-drawer {
    transition: transform 0.35s 0.12s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
}
.drawer-leave-active {
  transition: opacity 0.2s 0.1s ease;
  .mobile-drawer {
    transition: transform 0.25s cubic-bezier(0.4, 0, 1, 1);
  }
}
.drawer-enter-from {
  opacity: 0;
  .mobile-drawer {
    transform: translateY(100%);
  }
}
.drawer-leave-to {
  opacity: 0;
  .mobile-drawer {
    transform: translateY(100%);
  }
}
</style>
