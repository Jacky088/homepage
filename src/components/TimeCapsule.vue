<template>
  <!-- 时光胶囊彩蛋：点击左上角 Logo 触发展示 -->
  <Teleport to="body">
    <!-- 不用 Transition：动画时钟被节流时 transitionend 丢失会导致遮罩永久残留
         （与页脚歌词/一言同根因）。入场动画用 CSS animation 实现，关闭直接移除 -->
    <div v-if="store.capsuleOpenState" class="capsule-mask" @click="store.capsuleOpenState = false">
        <div class="capsule-panel music-glass" @click.stop>
          <div class="panel-header">
            <div class="title">
              <hourglass-full theme="two-tone" size="24" :fill="['#efefef', '#00000020']" />
              <span class="capsule-title">时光胶囊</span>
            </div>
            <div class="capsule-close" @click="store.capsuleOpenState = false">
              <close-one theme="filled" size="18" fill="#ffffffb0" />
            </div>
          </div>
          <div v-if="timeData" class="all-capsule">
            <div v-for="(item, tag, index) in timeData" :key="index" class="capsule-item">
              <div class="item-title">
                <span class="percentage">
                  {{ item.name }}已度过
                  <strong>{{ item.passed }}</strong>
                  {{ tag === "day" ? "小时" : "天" }}
                </span>
                <span class="remaining">
                  剩余&nbsp;{{ item.remaining }}&nbsp;{{ tag === "day" ? "小时" : "天" }}
                </span>
              </div>
              <el-progress :text-inside="true" :stroke-width="20" :percentage="parseFloat(item.percentage)" />
            </div>
            <!-- 建站日期 -->
            <div v-if="store.siteStartShow && startDateText" class="capsule-item start">
              <div class="item-title">{{ startDateText }}</div>
            </div>
          </div>
        </div>
    </div>
  </Teleport>
</template>

<script setup>
import { HourglassFull, CloseOne } from "@icon-park/vue-next";
import { getTimeCapsule, siteDateStatistics } from "@/utils/getTime.js";
import { mainStore } from "@/store";
const store = mainStore();

// 进度条数据
const timeData = ref(getTimeCapsule());
const startDate = ref(import.meta.env.VITE_SITE_START);
const startDateText = ref(null);
const timeInterval = ref(null);

onMounted(() => {
  timeInterval.value = setInterval(() => {
    timeData.value = getTimeCapsule();
    if (startDate.value) startDateText.value = siteDateStatistics(new Date(startDate.value));
  }, 1000);
});

onBeforeUnmount(() => {
  clearInterval(timeInterval.value);
});
</script>

<style lang="scss" scoped>
.capsule-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #00000060;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  // 入场动画（不依赖结束事件）
  animation: fade 0.3s;
}

// 面板容器：与播放列表（music-list-box）同款视觉
// 玻璃材质来自共享的 .music-glass（src/style/style.scss）
.capsule-panel {
  width: 560px;
  max-width: 88vw;
  max-height: 80vh;
  overflow-y: auto;
  border-radius: 28px;
  padding: 20px 26px 18px;
  animation: fade 0.4s;

  @media (max-width: 480px) {
    border-radius: 24px;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 12px;
    border-bottom: 1px solid rgb(255 255 255 / 10%);

    .title {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 6px;
      .i-icon {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .capsule-title {
        font-size: 1.02rem;
        font-weight: 600;
        color: #fff;
        letter-spacing: 0.5px;
        text-shadow: 0 1px 4px rgb(0 0 0 / 30%);
      }
    }

    // 与 .list-close / .panel-close 同规格的圆形关闭按钮
    .capsule-close {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
      background: rgb(255 255 255 / 8%);
      border: 1px solid rgb(255 255 255 / 12%);
      transition: transform 0.2s, background 0.2s;
      // 图标块级化，避免基线偏移导致圆心错位（同音乐面板做法）
      .i-icon,
      svg {
        display: block;
        line-height: 0;
      }
      &:hover {
        transform: scale(1.1);
        background: rgb(255 255 255 / 16%);
      }
      &:active {
        transform: scale(0.92);
      }
    }
  }

  .all-capsule {
    padding-top: 4px;

    .capsule-item {
      margin-bottom: 1rem;
      .item-title {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin: 1rem 0rem 0.5rem 0rem;
        font-size: 0.95rem;
        color: #fff;
        .remaining {
          opacity: 0.6;
          font-size: 0.85rem;
          font-style: oblique;
        }
      }
      &:last-child {
        margin-bottom: 0;
      }
      &.start {
        .item-title {
          justify-content: center;
          opacity: 0.8;
          font-size: 0.85rem;
        }
      }
    }
  }
}
</style>
