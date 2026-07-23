<template>
  <!-- 功能区域 -->
  <div :class="store.mobileFuncState ? 'function mobile' : 'function'">
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="left">
          <Music v-if="playerHasId" />
        </div>
      </el-col>
      <el-col :span="12" style="display: none;">
        <div
          class="right"
          @mouseenter="openWeatherShow = true"
          @mouseleave="openWeatherShow = false"
        >
          <!-- 打开天气设置提示 -->
          <Transition name="el-fade-in-linear">
            <div
              class="open-weather"
              v-show="openWeatherShow && !store.weatherOpenState"
              @click="store.weatherOpenState = true"
            >
              <setting-two theme="filled" size="18" fill="#efefef" />
              <span>打开天气设置</span>
            </div>
          </Transition>
          <Transition name="fade" mode="out-in">
            <div class="right-content" v-if="!store.weatherOpenState" key="normal">
              <div class="time">
                <div class="date">
                  <span>{{ currentTime.year }}&nbsp;年&nbsp;</span>
                  <span>{{ currentTime.month }}&nbsp;月&nbsp;</span>
                  <span>{{ currentTime.day }}&nbsp;日&nbsp;</span>
                  <span class="sm-hidden">{{ currentTime.weekday }}</span>
                </div>
                <div class="text">
                  <span> {{ currentTime.hour }}:{{ currentTime.minute }}:{{ currentTime.second }}</span>
                </div>
              </div>
              <Weather />
            </div>
            <div class="right-content-settings" v-else key="settings">
              <Weather />
            </div>
          </Transition>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { SettingTwo } from "@icon-park/vue-next";
import { getCurrentTime } from "@/utils/getTime";
import { mainStore } from "@/store";
import Music from "@/components/Music.vue";
import Weather from "@/components/Weather.vue";

const store = mainStore();

// 打开天气设置提示
const openWeatherShow = ref(false);

// 当前时间
const currentTime = ref({});
const timeInterval = ref(null);

// 播放器 id
const playerHasId = import.meta.env.VITE_SONG_ID;

// 更新时间
const updateTimeData = () => {
  currentTime.value = getCurrentTime();
};

onMounted(() => {
  updateTimeData();
  timeInterval.value = setInterval(updateTimeData, 1000);
});

onBeforeUnmount(() => {
  clearInterval(timeInterval.value);
});
</script>

<style lang="scss" scoped>
.function {
  height: 165px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  overflow: visible;
  &.mobile {
    .el-row {
      .el-col {
        &:nth-of-type(1) {
          display: contents;
        }
        &:nth-of-type(2) {
          display: none;
        }
      }
    }
  }
  .el-row {
    height: 100%;
    width: 100%;
    margin: 0 !important;
    .el-col {
      &:nth-of-type(1) {
        padding-left: 0 !important;
      }
      &:nth-of-type(2) {
        padding-right: 0 !important;
      }
      @media (max-width: 910px) {
        &:nth-of-type(1) {
          display: none;
        }
        &:nth-of-type(2) {
          padding: 0 !important;
          flex: none;
          max-width: none;
          width: 100%;
        }
      }
    }
    .left,
    .right {
      width: 100%;
      height: 100%;
    }
    .right {
      position: relative;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      animation: fade 0.5s;
      .open-weather {
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #00000026;
        padding: 4px 0;
        border-radius: 16px 16px 0 0;
        z-index: 1;
        cursor: pointer;
        .i-icon {
          width: 18px;
          height: 18px;
          display: block;
          margin-right: 8px;
        }
        span {
          font-size: 0.95rem;
        }
      }
      .right-content,
      .right-content-settings {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
      }
      .time {
        font-size: 1.1rem;
        text-align: center;
        .date {
          text-overflow: ellipsis;
          overflow-x: hidden;
          white-space: nowrap;
        }
        .text {
          margin-top: 10px;
          font-size: 3.25rem;
          letter-spacing: 2px;
          font-family: "UnidreamLED";
        }
        @media (min-width: 1201px) and (max-width: 1280px) {
          font-size: 1rem;
        }
        @media (min-width: 911px) and (max-width: 992px) {
          font-size: 1rem;
          .text {
            font-size: 2.75rem;
          }
        }
      }
      .weather {
        text-align: center;
        width: 100%;
        text-overflow: ellipsis;
        overflow-x: hidden;
        white-space: nowrap;
      }
    }
  }
}
</style>
