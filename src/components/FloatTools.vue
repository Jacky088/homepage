<template>
  <!-- 顶栏操作项：壁纸切换按钮（图片壁纸 / 视频背景两态） -->
  <button
    type="button"
    class="action-btn tool-btn glass-pill"
    :title="store.coverType === '4' ? '切换为图片壁纸' : '切换为视频背景'"
    @click="toggleBackground"
  >
    <!-- 图片壁纸图标 (Solid Landscape) -->
    <svg v-if="store.coverType === '4'" class="action-icon" viewBox="2 2 20 20" width="18" height="18">
      <path
        d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
        fill="#ffffff"
      />
    </svg>
    <!-- 视频背景图标 (Solid Video) -->
    <svg v-else class="action-icon" viewBox="2 4 20 16" width="18" height="18">
      <path
        d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
        fill="#ffffff"
      />
    </svg>
  </button>
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
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    background-color 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;

  .action-icon {
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

  @include mobile-viewport {
    width: 34px;
    height: 34px;

    .action-icon {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
