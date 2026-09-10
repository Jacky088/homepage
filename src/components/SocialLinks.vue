<template>
  <!-- 社交链接 -->
  <div class="social">
    <div class="link">
      <a
        v-for="item in socialLinks"
        :key="item.name"
        :href="item.url"
        target="_blank"
        rel="noopener noreferrer"
        @mouseenter="socialTip = item.tip"
        @mouseleave="socialTip = '通过这里联系我'"
      >
        <img class="icon" :src="item.icon" height="24" />
      </a>
    </div>
    <span class="tip">{{ socialTip }}</span>
  </div>
</template>

<script setup>
import socialLinks from "@/assets/socialLinks.json";

// 社交链接提示
const socialTip = ref("通过这里联系我");
</script>

<style lang="scss" scoped>
.social {
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 14px;
  background-color: transparent;
  border-radius: 12px;
  backdrop-filter: blur(0);
  animation: fade 0.5s;
  transition:
    background-color 0.3s,
    backdrop-filter 0.3s;

  .link {
    display: flex;
    align-items: center;
    justify-content: center;
    a {
      display: inherit;
      .icon {
        margin: 0 12px;
        transition: transform 0.3s;
        &:hover {
          transform: scale(1.1);
        }
        &:active {
          transform: scale(1);
        }
      }
    }
  }
  .tip {
    display: none;
    margin-left: 12px;
    animation: fade 0.5s;
  }
  @media (min-width: 768px) {
    &:hover {
      background-color: #00000040;
      backdrop-filter: blur(5px);
      .tip {
        display: block;
      }
    }
  }
  @media (max-width: 720px) {
    justify-content: center;
  }
}
</style>
