<template>
  <!-- 右下角浮动工具列：壁纸切换按钮（音乐入口由迷你播放器悬停展开承担，见 Music.vue）。
       显隐由组件内部响应 store 状态（音乐面板 / 壁纸展示 / 设置页时隐藏），避免在多根组件上继承 v-show 指令 -->
  <div v-show="!store.musicOpenState && !store.backgroundShow && !store.setOpenState" class="float-tools">
    <!-- 切换壁纸：图片壁纸 / 视频背景两态 -->
    <button
      class="tool-btn music-glass"
      :title="store.coverType === '4' ? '切换为图片壁纸' : '切换为视频背景'"
      @click="toggleBackground"
    >
      <!-- 图片壁纸图标 (Solid Landscape) -->
      <svg v-if="store.coverType === '4'" class="tool-icon" viewBox="2 2 20 20" width="20" height="20">
        <path
          d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
          fill="#ffffff"
        />
      </svg>
      <!-- 视频背景图标 (Solid Video) -->
      <svg v-else class="tool-icon" viewBox="2 4 20 16" width="20" height="20">
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
  bottom: 164px; // 右下角工具列：底栏(46px) + 社交栏(42px)之上再多留空隙，与迷你播放器同列
  z-index: 20; // 低于音乐面板遮罩(50)，高于底栏(1)
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: fade 0.4s;

  .tool-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    cursor: pointer;
    user-select: none;
    transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1), box-shadow 0.3s;

    &:hover {
      transform: translateY(-2px);
    }
    &:active {
      transform: translateY(0) scale(0.95);
    }
  }

  // 移动端：按钮缩小到 38px、图标 18px，与社交栏裸图标的视觉重量对齐
  @media (max-width: 720px) {
    right: 27px; // (44 - 38) / 2，保持与桌面端同轴
    bottom: 158px; // 移动端同步抬高：社交栏(42px) + 底栏(46px)之上留出更多空隙

    .tool-btn {
      width: 38px;
      height: 38px;

      .tool-icon {
        width: 18px;
        height: 18px;
      }
    }
  }
}
</style>
