<template>
  <div v-if="siteLinks[0]" :class="['links', { 'mobile-open': store.mobileOpenState }]">
    <!-- PC: 横排文字链接 -->
    <a
      v-for="item in siteLinks"
      :key="item.name"
      class="link-item"
      @click="jumpLink(item)"
    >
      {{ item.name }}
    </a>
  </div>

  <!-- 移动端: 底部抽屉面板 -->
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="store.mobileOpenState" class="mobile-drawer-mask" @click="store.mobileOpenState = false">
        <div class="mobile-drawer" @click.stop>
          <div class="drawer-header">
            <span class="drawer-title">网站列表</span>
            <span class="drawer-close" @click="store.mobileOpenState = false">&times;</span>
          </div>
          <div class="drawer-grid">
            <a
              v-for="item in siteLinks"
              :key="item.name"
              class="grid-item"
              @click="jumpLink(item)"
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
import { Blog, Terminal, Cloud, Compass, Book, Fire, LaptopCode, StickyNote, Staylinked, AddressCard, Toolbox, Github, Image, Info } from "@vicons/fa";
import { mainStore } from "@/store";
import siteLinks from "@/assets/siteLinks.json";

const store = mainStore();

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
// PC 端横排样式
.links {
  position: absolute;
  top: 18px;
  left: 195px;
  height: 52px;
  z-index: 10;
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  padding-bottom: 8px;
  gap: 28px;
  animation: fade 0.5s;

  .link-item {
    font-size: 1.15rem;
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

  // 移动端隐藏 PC 版横排
  @media (max-width: 720px) {
    display: none;
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

  @media (min-width: 721px) {
    display: none;
  }

  .mobile-drawer {
    width: 100%;
    max-height: 70vh;
    background: rgba(30, 30, 40, 0.92);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border-radius: 20px 20px 0 0;
    padding: 0 20px 30px;
    overflow-y: auto;

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
        font-size: 1.6rem;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;

        &:active {
          background: rgba(255, 255, 255, 0.1);
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
        background: rgba(255, 255, 255, 0.05);
        cursor: pointer;
        transition: background 0.2s, transform 0.2s;
        text-decoration: none;

        &:active {
          transform: scale(0.95);
          background: rgba(255, 255, 255, 0.12);
        }

        .grid-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
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
        }
      }
    }
  }
}

// 抽屉动画
.drawer-enter-active {
  transition: opacity 0.3s ease;
  .mobile-drawer {
    transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
}
.drawer-leave-active {
  transition: opacity 0.25s ease;
  .mobile-drawer {
    transition: transform 0.3s cubic-bezier(0.4, 0, 1, 1);
  }
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  .mobile-drawer {
    transform: translateY(100%);
  }
}
</style>
