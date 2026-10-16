<template>
  <!-- 社交链接 -->
  <div class="social" :class="{ 'is-expanded': isExpanded, 'is-overflow': isOverflow }">
    <div class="link-list">
      <!-- 常驻展示的社交链接 -->
      <a
        v-for="item in visibleLinks"
        :key="item.name"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        :title="item.tip || item.name"
        class="social-item"
      >
        <img class="icon" :src="item.icon" :alt="item.name" />
      </a>

      <!-- 判定重叠时折叠的额外社交链接（支持平滑横向展开） -->
      <div v-if="isOverflow" class="overflow-wrap" :class="{ 'is-open': isExpanded }">
        <a
          v-for="item in overflowLinks"
          :key="item.name"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          :title="item.tip || item.name"
          class="social-item overflow-item"
        >
          <img class="icon" :src="item.icon" :alt="item.name" />
        </a>
      </div>

      <!-- 展开 / 收起折叠按钮 -->
      <button
        v-if="isOverflow"
        type="button"
        class="toggle-btn"
        :class="{ 'is-active': isExpanded }"
        :title="isExpanded ? '收起社交平台' : '展开更多社交平台'"
        :aria-expanded="isExpanded"
        @click.stop="emit('toggleExpand')"
      >
        <svg
          class="arrow-icon"
          viewBox="0 0 24 24"
          width="12"
          height="12"
          stroke="currentColor"
          stroke-width="2.4"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import socialLinks from "@/assets/socialLinks.json";

const props = defineProps({
  isOverflow: {
    type: Boolean,
    default: false,
  },
  isExpanded: {
    type: Boolean,
    default: false,
  },
  visibleCount: {
    type: Number,
    default: 3,
  },
});

const emit = defineEmits(["toggleExpand"]);

const visibleLinks = computed(() => {
  if (!props.isOverflow) return socialLinks;
  return socialLinks.slice(0, props.visibleCount);
});

const overflowLinks = computed(() => {
  if (!props.isOverflow) return [];
  return socialLinks.slice(props.visibleCount);
});
</script>

<style lang="scss" scoped>
.social {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0;
  background: transparent;
  animation: fade 0.5s;
  user-select: none;

  .link-list {
    display: flex;
    align-items: center;
    gap: 14px; // 宽敞呼吸间距，图标不再紧贴
  }

  .social-item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    flex-shrink: 0;

    .icon {
      height: 22px;
      width: auto;
      opacity: 0.9;
      transition:
        transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
        opacity 0.2s ease;

      &:hover {
        transform: scale(1.15);
        opacity: 1;
      }
      &:active {
        transform: scale(0.95);
      }
    }
  }

  // 折叠项横向平滑展开容器
  .overflow-wrap {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    max-width: 0;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    transition:
      max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1),
      opacity 0.25s ease;

    &.is-open {
      max-width: 320px;
      opacity: 1;
      pointer-events: auto;
    }

    .overflow-item {
      transform: translateX(-8px);
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    &.is-open .overflow-item {
      transform: translateX(0);
    }
  }

  // 展开 / 收起微型按钮
  .toggle-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition:
      background-color 0.25s ease,
      border-color 0.25s ease,
      transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
      color 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.22);
      border-color: rgba(255, 255, 255, 0.35);
      color: #fff;
      transform: scale(1.08);
    }
    &:active {
      transform: scale(0.94);
    }

    .arrow-icon {
      transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    &.is-active .arrow-icon {
      transform: rotate(180deg);
    }
  }

  @media (max-width: $bp-md) {
    .link-list,
    .overflow-wrap {
      gap: 12px;
    }

    .social-item .icon {
      height: 20px;
    }

    .toggle-btn {
      width: 22px;
      height: 22px;
    }
  }

  @media (max-width: $bp-sm) {
    .link-list,
    .overflow-wrap {
      gap: 10px; // 移动端保证舒适间隙，不再紧贴
    }

    .social-item .icon {
      height: 19px;
    }

    .toggle-btn {
      width: 20px;
      height: 20px;

      .arrow-icon {
        width: 10px;
        height: 10px;
      }
    }
  }
}
</style>
