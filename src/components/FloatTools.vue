<template>
  <!-- 右上角浮动工具列：壁纸切换按钮。
       桌面端无汉堡菜单时占据汉堡菜单位置 (top: 17px)，有汉堡菜单时自动下移 (top: 65px)；
       显隐由组件内部响应 store 状态（音乐面板 / 壁纸展示 / 设置页时隐藏），避免在多根组件上继承 v-show 指令 -->
  <div
    v-show="!store.musicOpenState && !store.backgroundShow && !store.setOpenState"
    :class="['float-tools', { 'has-nav-btn': store.navCollapsed }]"
  >
    <!-- 切换壁纸：图片壁纸 / 视频背景两态 -->
    <button
      class="tool-btn glass-pill"
      :title="store.coverType === '4' ? '切换为图片壁纸' : '切换为视频背景'"
      @click="toggleBackground"
    >
      <!-- 图片壁纸图标 (Solid Landscape) -->
      <svg v-if="store.coverType === '4'" class="tool-icon" viewBox="2 2 20 20" width="18" height="18">
        <path
          d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
          fill="#ffffff"
        />
      </svg>
      <!-- 视频背景图标 (Solid Video) -->
      <svg v-else class="tool-icon" viewBox="2 4 20 16" width="18" height="18">
        <path
          d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
          fill="#ffffff"
        />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { showMessage } from "@/utils/message.js";

const store = mainStore();

// 切换背景类型
const toggleBackground = () => {
  if (store.coverType === "4") {
    store.coverType = "0";
    showMessage({
      message: "已切换为图片壁纸",
      type: "success",
    });
  } else {
    store.coverType = "4";
    showMessage({
      message: "已切换为视频背景",
      type: "success",
    });
  }
};
</script>

<style lang="scss" scoped>
.float-tools {
  position: fixed;
  right: 24px;
  top: 17px; // 无汉堡菜单时：占据汉堡菜单位置 (top 17px)
  z-index: 21;
  display: flex;
  flex-direction: column;
  animation: fade 0.4s;
  transition:
    top 0.3s cubic-bezier(0.16, 1, 0.3, 1),
    right 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  // 有汉堡菜单时：自动下移到汉堡菜单下方 (top 17px + 38px + 10px = 65px)
  &.has-nav-btn {
    top: 65px;
  }

  .tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    cursor: pointer;
    user-select: none;
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);

    .tool-icon {
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
  }

  @media (max-width: 720px) and (hover: none) and (pointer: coarse), (max-width: 480px) {
    right: 16px;
    top: 11px; // 移动端无汉堡菜单时兜底居中

    &.has-nav-btn {
      top: 59px; // 移动端有汉堡菜单时：位于汉堡菜单下方 (top 11px + 38px + 10px = 59px)
    }
  }
}
</style>
