<template>
  <!-- 共享背景遮罩 - 始终不动 -->
  <Teleport to="body">
    <Transition name="music-overlay-fade">
      <div class="music-overlay" v-show="store.musicOpenState" @click="closeAll">
        <!-- 播放器面板 -->
        <Transition name="panel-swap">
          <div class="music-panel music-glass" v-show="!musicListShow" @click.stop>
            <!-- 关闭按钮 -->
            <div class="panel-close" @click="closeAll">
              <close-one theme="filled" size="20" fill="#ffffffb0" />
            </div>
            <!-- 唱片动画（有封面时显示封面唱片） -->
            <div :class="['disc', { spinning: store.playerState }]">
              <img
                v-if="coverUrl"
                :src="coverUrl"
                alt="专辑封面"
                class="disc-cover"
                draggable="false"
                @error="coverUrl = ''"
              />
              <div v-else class="disc-inner">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="1.5">
                  <path d="M9 18V5l12-2v13" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <!-- 玻璃高光 -->
              <div class="disc-sheen"></div>
              <!-- 唱片中心孔 -->
              <div class="disc-center"></div>
            </div>
            <!-- 歌曲信息 -->
            <div class="song-info">
              <span class="song-name text-hidden">{{ store.getPlayerData.name || "未播放音乐" }}</span>
              <span class="song-artist text-hidden">{{ store.getPlayerData.artist || "点击播放" }}</span>
            </div>
            <!-- 进度条 -->
            <div class="progress-bar">
              <span class="time-text">{{ formatTime(currentTime) }}</span>
              <div class="progress-track" ref="progressTrackRef" @mousedown="onProgressSeek" @touchstart="onProgressSeek">
                <div class="progress-filled" :style="{ width: progressPercent + '%' }"></div>
                <div class="progress-thumb" :style="{ left: progressPercent + '%' }"></div>
              </div>
              <span class="time-text">{{ formatTime(duration) }}</span>
            </div>
            <!-- 播放控制 -->
            <div class="controls">
              <div class="ctrl-btn" @click="changeMusicIndex(0)">
                <go-start theme="filled" size="28" fill="#ffffffcc" />
              </div>
              <div class="ctrl-btn play-btn" @click="changePlayState">
                <play-one v-if="!store.playerState" theme="filled" size="34" fill="#fff" />
                <pause v-else theme="filled" size="34" fill="#fff" />
              </div>
              <div class="ctrl-btn" @click="changeMusicIndex(1)">
                <go-end theme="filled" size="28" fill="#ffffffcc" />
              </div>
            </div>
            <!-- 底部：音量 + 列表入口 -->
            <div class="panel-footer">
              <div class="volume-ctrl">
                <component
                  :is="volumeNum > 0 ? VolumeUp : VolumeMute"
                  theme="filled"
                  size="18"
                  fill="#ffffffa0"
                  class="volume-icon"
                  @click="toggleMute"
                />
                <input
                  type="range"
                  class="volume-slider"
                  min="0"
                  max="100"
                  v-model.number="volumePercent"
                  :style="{ '--fill': volumePercent + '%' }"
                  aria-label="音量"
                />
              </div>
              <span class="footer-btn" @click="openMusicList()">
                <PlayOne theme="filled" size="14" fill="#ffffffb0" class="footer-btn-icon" />
                播放列表
              </span>
            </div>
          </div>
        </Transition>

        <!-- 播放列表 -->
        <Transition name="panel-swap">
          <div :class="['music-list-box', 'music-glass', { playing: store.playerState }]" v-show="musicListShow" @click.stop>
            <div class="list-header">
              <span class="list-title">播放列表</span>
              <span class="list-count" v-if="songCount">{{ songCount }} 首</span>
            </div>
            <div class="list-close" @click="closeMusicList()">
              <close-one theme="filled" size="20" fill="#ffffffb0" />
            </div>
            <Player
              ref="playerRef"
              :songServer="playerData.server"
              :songType="playerData.type"
              :songId="playerData.id"
              :volume="volumeNum"
              :listFolded="false"
              :listMaxHeight="480"
            />
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import {
  GoStart,
  PlayOne,
  Pause,
  GoEnd,
  CloseOne,
  VolumeUp,
  VolumeMute,
} from "@icon-park/vue-next";
import Player from "@/components/Player.vue";
import { mainStore } from "@/store";
const store = mainStore();

// 音量条数据
const volumeNum = ref(store.musicVolume ? store.musicVolume : 0.7);
const lastVolume = ref(volumeNum.value);

// 音量滑块（0-100）
const volumePercent = computed({
  get: () => Math.round(volumeNum.value * 100),
  set: (value) => {
    volumeNum.value = Math.min(100, Math.max(0, value)) / 100;
  },
});

// 静音切换
const toggleMute = () => {
  if (volumeNum.value > 0) {
    lastVolume.value = volumeNum.value;
    volumeNum.value = 0;
  } else {
    volumeNum.value = lastVolume.value || 0.7;
  }
};

// 播放列表数据
const musicListShow = ref(false);
const playerRef = ref(null);
const playerData = reactive({
  server: import.meta.env.VITE_SONG_SERVER,
  type: import.meta.env.VITE_SONG_TYPE,
  id: import.meta.env.VITE_SONG_ID,
});

// 当前歌曲封面 / 列表数量（随播放同步）
const coverUrl = ref("");
const songCount = ref(0);

// 进度条相关
const currentTime = ref(0);
const duration = ref(0);
const progressTrackRef = ref(null);
const isSeeking = ref(false);
let progressTimer = null;

const progressPercent = computed(() => {
  if (duration.value <= 0) return 0;
  return Math.min((currentTime.value / duration.value) * 100, 100);
});

// 格式化时间 mm:ss
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
};

// 获取底层 audio 元素
const getAudioElement = () => {
  try {
    return playerRef.value?.player?.audioRef;
  } catch {
    return null;
  }
};

// 同步进度与封面
const syncProgress = () => {
  if (isSeeking.value) return;
  const audio = getAudioElement();
  if (audio) {
    currentTime.value = audio.currentTime || 0;
    duration.value = audio.duration || 0;
  }
  try {
    const aplayer = playerRef.value?.player?.aplayer;
    const item = aplayer?.audio?.[aplayer.index];
    if (item && (item.cover || "") !== coverUrl.value) {
      coverUrl.value = item.cover || "";
    }
    if (aplayer?.audio?.length && aplayer.audio.length !== songCount.value) {
      songCount.value = aplayer.audio.length;
    }
  } catch {
    /* 播放器未就绪时忽略 */
  }
};

const startProgressSync = () => {
  stopProgressSync();
  progressTimer = setInterval(syncProgress, 300);
};

const stopProgressSync = () => {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
};

// 进度条拖动/点击 Seek
const onProgressSeek = (e) => {
  e.preventDefault();
  isSeeking.value = true;
  const track = progressTrackRef.value;
  if (!track) return;

  const seekToPosition = (clientX) => {
    const rect = track.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;
    percent = Math.max(0, Math.min(1, percent));
    currentTime.value = percent * duration.value;
  };

  const applySeek = () => {
    const audio = getAudioElement();
    if (audio && duration.value > 0) {
      audio.currentTime = currentTime.value;
    }
    isSeeking.value = false;
  };

  if (e.type === "touchstart") {
    seekToPosition(e.touches[0].clientX);
    const onTouchMove = (ev) => seekToPosition(ev.touches[0].clientX);
    const onTouchEnd = () => {
      applySeek();
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
    document.addEventListener("touchmove", onTouchMove);
    document.addEventListener("touchend", onTouchEnd);
  } else {
    seekToPosition(e.clientX);
    const onMouseMove = (ev) => seekToPosition(ev.clientX);
    const onMouseUp = () => {
      applySeek();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }
};

// 开启播放列表
const openMusicList = () => {
  musicListShow.value = true;
  // 强制展开 APlayer 列表 DOM（高度由样式控制）
  nextTick(() => {
    const listEl = document.querySelector(".music-list-box .aplayer-list");
    if (listEl) {
      listEl.style.display = "block";
    }
  });
};

// 关闭播放列表（回到播放器面板）
const closeMusicList = () => {
  musicListShow.value = false;
};

// 关闭全部（回到主页）
const closeAll = () => {
  if (musicListShow.value) {
    // 如果列表打开，先关闭列表回到面板
    musicListShow.value = false;
  } else {
    // 面板状态，关闭全部
    store.musicOpenState = false;
  }
};

// 音乐播放暂停
const changePlayState = () => {
  playerRef.value.playToggle();
};

// 音乐上下曲
const changeMusicIndex = (type) => {
  playerRef.value.changeSong(type);
};

// 空格键切换播放（输入框聚焦时忽略，避免打字空格误触）
const onKeydown = (e) => {
  if (!store.musicIsOk) {
    return;
  }
  if (e.code == "Space") {
    const target = e.target;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
    ) {
      return;
    }
    changePlayState();
  }
};

// 音乐列表滚动回弹效果：滚到顶/底时短暂位移再弹回
const onListBoxWheel = (e) => {
  const ol = musicListBoxEl?.querySelector(".aplayer-list ol");
  if (!ol) return;
  // 已经在滚动区域内
  const isAtTop = ol.scrollTop <= 0;
  const isAtBottom = ol.scrollTop + ol.clientHeight >= ol.scrollHeight - 1;
  // 在顶部还想继续下滚 / 在底部还想继续上滚 → 触发回弹
  if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
    const isTopBounce = isAtTop;
    ol.style.transition = "transform 0.18s ease-out";
    ol.style.transform = isTopBounce
      ? `translateY(${-Math.min(Math.abs(e.deltaY) * 0.25, 12)}px)`
      : `translateY(${Math.min(e.deltaY * 0.25, 12)}px)`;
    // 清除之前的计时器
    if (rubberBandTimer) clearTimeout(rubberBandTimer);
    // 150ms 后回弹
    rubberBandTimer = setTimeout(() => {
      ol.style.transition = "transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)";
      ol.style.transform = "translateY(0)";
      // 动画结束后清除 transition 避免影响其他样式
      setTimeout(() => {
        ol.style.transition = "";
      }, 320);
    }, 150);
  }
};

let rubberBandTimer = null;
let musicListBoxEl = null;

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  // 挂载方法至 window
  window.$openList = openMusicList;
  // 启动进度同步
  startProgressSync();

  musicListBoxEl = document.querySelector(".music-list-box");
  if (musicListBoxEl) {
    musicListBoxEl.addEventListener("wheel", onListBoxWheel, { passive: true });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  if (window.$openList === openMusicList) {
    delete window.$openList;
  }
  if (musicListBoxEl) {
    musicListBoxEl.removeEventListener("wheel", onListBoxWheel);
    musicListBoxEl = null;
  }
  if (rubberBandTimer) clearTimeout(rubberBandTimer);
  stopProgressSync();
});

// 监听音量变化
watch(
  () => volumeNum.value,
  (value) => {
    store.musicVolume = value;
    if (playerRef.value) {
      playerRef.value.changeVolume(store.musicVolume);
    }
  },
);
</script>

<style lang="scss" scoped>
// 音乐面板浮层
.music-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgb(0 0 0 / 35%);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative; // 面板/列表绝对定位叠放的定位基准

  // 播放面板与列表绝对定位叠放：
  // 1) 切换动画时两面板同位交叠，横向滑动方向感连贯
  // 2) 避免小屏上两面板同处一行互相挤压变形
  .music-panel,
  .music-list-box {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%; // 用独立 translate 属性居中，不占用动画的 transform
    margin: 0;
  }
}

.music-panel {
  width: 380px;
  max-width: 88vw;
  padding: 34px 30px 24px;
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  .panel-close {
    position: absolute;
    top: 14px;
    right: 14px;
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
    z-index: 5;
    // 图标默认 inline-block + 基线对齐，会被 line-height 撑出偏移，
    // 改为块级并由 flex 完全接管居中，避免 hover 放大时圆心错位
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

  // 唱片
  .disc {
    position: relative;
    width: 104px;
    height: 104px;
    border-radius: 50%;
    background:
      repeating-radial-gradient(circle at center, rgb(255 255 255 / 5%) 0 2px, transparent 2px 5px),
      linear-gradient(135deg, rgb(255 255 255 / 14%) 0%, rgb(255 255 255 / 4%) 100%);
    border: 2px solid rgb(255 255 255 / 18%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 0 28px rgb(255 255 255 / 10%),
      0 10px 28px rgb(0 0 0 / 40%),
      inset 0 1px 0 rgb(255 255 255 / 20%);
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow:
        0 0 36px rgb(255 255 255 / 18%),
        0 10px 30px rgb(0 0 0 / 50%),
        inset 0 1px 0 rgb(255 255 255 / 25%);
    }

    &.spinning {
      animation: disc-spin 8s linear infinite;
    }

    // 封面
    .disc-cover {
      position: absolute;
      inset: 5px;
      width: calc(100% - 10px);
      height: calc(100% - 10px);
      border-radius: 50%;
      object-fit: cover;
      user-select: none;
    }

    // 唱片刻度虚线轨道（无封面时更明显）
    &::after {
      content: "";
      position: absolute;
      inset: 7px;
      border-radius: 50%;
      background: repeating-conic-gradient(rgb(255 255 255 / 10%) 0deg 2deg, transparent 2deg 8deg);
      pointer-events: none;
      opacity: 0.5;
    }

    // 玻璃高光
    .disc-sheen {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: conic-gradient(
        from 210deg,
        transparent 0deg,
        rgb(255 255 255 / 20%) 38deg,
        transparent 85deg,
        transparent 185deg,
        rgb(255 255 255 / 10%) 225deg,
        transparent 275deg
      );
      pointer-events: none;
      z-index: 2;
    }

    // 中心孔
    .disc-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgb(0 0 0 / 55%);
      border: 1px solid rgb(255 255 255 / 25%);
      z-index: 3;
    }

    // 无封面时的中心图标
    .disc-inner {
      position: relative;
      z-index: 1;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: rgb(0 0 0 / 35%);
      border: 1px solid rgb(255 255 255 / 15%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .song-info {
    text-align: center;
    width: 100%;
    .song-name {
      display: block;
      font-size: 1.12rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
      text-shadow: 0 1px 4px rgb(0 0 0 / 30%);
    }
    .song-artist {
      display: block;
      font-size: 0.82rem;
      color: rgb(255 255 255 / 55%);
    }
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 26px;

    .ctrl-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.2s, transform 0.2s;

      &:hover {
        background: rgb(255 255 255 / 10%);
      }
      &:active {
        transform: scale(0.9);
      }

      .i-icon {
        display: flex;
      }
    }

    .play-btn {
      width: 62px;
      height: 62px;
      background: linear-gradient(145deg, rgb(255 255 255 / 26%) 0%, rgb(255 255 255 / 10%) 100%);
      border: 1px solid rgb(255 255 255 / 22%);
      box-shadow:
        0 6px 18px rgb(0 0 0 / 30%),
        inset 0 1px 0 rgb(255 255 255 / 30%);

      &:hover {
        background: linear-gradient(145deg, rgb(255 255 255 / 34%) 0%, rgb(255 255 255 / 16%) 100%);
        box-shadow:
          0 6px 22px rgb(0 0 0 / 35%),
          0 0 16px rgb(255 255 255 / 15%),
          inset 0 1px 0 rgb(255 255 255 / 35%);
      }
    }
  }

  .panel-footer {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 2px;

    .volume-ctrl {
      display: flex;
      align-items: center;
      gap: 8px;

      .volume-icon {
        display: flex;
        cursor: pointer;
        opacity: 0.75;
        transition: opacity 0.2s;
        &:hover {
          opacity: 1;
        }
      }

      .volume-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 86px;
        height: 3px;
        border-radius: 3px;
        outline: none;
        cursor: pointer;
        background: linear-gradient(
          to right,
          rgb(255 255 255 / 85%) var(--fill, 70%),
          rgb(255 255 255 / 18%) var(--fill, 70%)
        );

        &::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 6px rgb(0 0 0 / 40%);
          transition: transform 0.15s;
        }
        &:hover::-webkit-slider-thumb {
          transform: scale(1.25);
        }
        &::-moz-range-thumb {
          width: 11px;
          height: 11px;
          border: none;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 6px rgb(0 0 0 / 40%);
        }
      }
    }

    .footer-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: rgb(255 255 255 / 75%);
      cursor: pointer;
      padding: 7px 16px;
      border-radius: 20px;
      border: 1px solid rgb(255 255 255 / 16%);
      background: rgb(255 255 255 / 6%);
      transition: all 0.2s;

      .footer-btn-icon {
        display: flex;
      }

      &:hover {
        color: #fff;
        background: rgb(255 255 255 / 12%);
        border-color: rgb(255 255 255 / 30%);
      }
      &:active {
        transform: scale(0.96);
      }
    }
  }

  // 进度条样式
  .progress-bar {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 4px;

    .time-text {
      font-size: 0.7rem;
      color: rgb(255 255 255 / 50%);
      min-width: 34px;
      text-align: center;
      user-select: none;
      font-variant-numeric: tabular-nums;
    }

    .progress-track {
      flex: 1;
      height: 20px;
      display: flex;
      align-items: center;
      position: relative;
      cursor: pointer;
      touch-action: none;

      &::before {
        content: "";
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 100%;
        height: 4px;
        border-radius: 4px;
        background: rgb(255 255 255 / 14%);
        box-shadow: inset 0 1px 1px rgb(0 0 0 / 20%);
      }

      .progress-filled {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 4px;
        border-radius: 4px;
        background: linear-gradient(90deg, rgb(255 255 255 / 65%) 0%, rgb(255 255 255 / 95%) 100%);
        pointer-events: none;
      }

      .progress-thumb {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #fff;
        box-shadow:
          0 0 0 3px rgb(255 255 255 / 12%),
          0 0 8px rgb(255 255 255 / 35%);
        pointer-events: none;
        transition: transform 0.1s;
      }

      &:hover .progress-thumb,
      &:active .progress-thumb {
        transform: translate(-50%, -50%) scale(1.25);
      }
    }
  }

  // 移动端自适应
  @media (max-width: 480px) {
    width: 86vw;
    max-width: 86vw;
    padding: 26px 20px 18px;
    gap: 13px;
    border-radius: 24px;

    .disc {
      width: 84px;
      height: 84px;
      &::after {
        inset: 6px;
      }
      .disc-inner {
        width: 40px;
        height: 40px;
        svg {
          width: 22px;
          height: 22px;
        }
      }
      .disc-center {
        width: 16px;
        height: 16px;
      }
    }

    .song-info {
      .song-name {
        font-size: 1rem;
      }
      .song-artist {
        font-size: 0.78rem;
      }
    }

    .controls {
      gap: 22px;
      .ctrl-btn {
        width: 40px;
        height: 40px;
      }
      .play-btn {
        width: 54px;
        height: 54px;
      }
    }

    .panel-footer {
      .volume-ctrl .volume-slider {
        width: 64px;
      }
      .footer-btn {
        padding: 6px 13px;
      }
    }
  }

  @media (max-height: 600px) {
    gap: 10px;
    padding: 22px 20px 14px;

    .disc {
      width: 60px;
      height: 60px;
      .disc-inner {
        width: 34px;
        height: 34px;
      }
      .disc-center {
        width: 13px;
        height: 13px;
      }
    }

    .controls {
      gap: 20px;
      .play-btn {
        width: 48px;
        height: 48px;
      }
    }
  }
}

@keyframes disc-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 遮罩层淡入淡出
.music-overlay-fade-enter-active,
.music-overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}
.music-overlay-fade-enter-from,
.music-overlay-fade-leave-to {
  opacity: 0;
}

// 面板/列表横向滑动切换：一个面板滑出、另一个同侧滑入，方向感连贯不跳变。
// transitionend 与 rAF 双保险，避免后台标签页丢帧导致动画卡住
.panel-swap-enter-active {
  transition:
    opacity 0.32s cubic-bezier(0.33, 1, 0.68, 1),
    transform 0.32s cubic-bezier(0.33, 1, 0.68, 1);
}
.panel-swap-leave-active {
  transition:
    opacity 0.26s cubic-bezier(0.32, 0, 0.67, 0),
    transform 0.26s cubic-bezier(0.32, 0, 0.67, 0);
}
// 进入：从右侧轻滑入并放大到位；离开：向左缩小滑出（类似前后翻页的连贯方向）
.panel-swap-enter-from {
  opacity: 0;
  transform: translateX(48px) scale(0.96);
}
.panel-swap-leave-to {
  opacity: 0;
  transform: translateX(-40px) scale(0.96);
}
// 移动端：位移幅度减半，避免小屏上滑出感过重
@media (max-width: 480px) {
  .panel-swap-enter-from {
    transform: translateX(24px) scale(0.97);
  }
  .panel-swap-leave-to {
    transform: translateX(-20px) scale(0.97);
  }
}
</style>

<style lang="scss">
// ========== 液态玻璃材质（播放面板与列表共用） ==========
.music-glass {
  background:
    linear-gradient(
      155deg,
      rgb(255 255 255 / 14%) 0%,
      rgb(255 255 255 / 5%) 36%,
      rgb(0 0 0 / 24%) 100%
    ),
    rgb(14 16 22 / 38%);
  backdrop-filter: blur(28px) saturate(160%);
  -webkit-backdrop-filter: blur(28px) saturate(160%);
  border: 1px solid rgb(255 255 255 / 16%);
  box-shadow:
    0 24px 60px rgb(0 0 0 / 45%),
    0 4px 16px rgb(0 0 0 / 30%),
    inset 0 1px 0 rgb(255 255 255 / 22%),
    inset 0 -1px 0 rgb(255 255 255 / 4%);

  // 顶部弧面高光
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: radial-gradient(120% 55% at 50% 0%, rgb(255 255 255 / 9%) 0%, transparent 55%);
    pointer-events: none;
  }

  // 内容置于高光之上
  > * {
    position: relative;
    z-index: 1;
  }
  > .panel-close,
  > .list-close {
    position: absolute;
  }
}

// ========== 播放列表面板 ==========
.music-list-box {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 560px;
  max-width: 88vw;
  height: 600px;
  max-height: 80vh;
  border-radius: 28px;
  overflow: hidden;

  @media (max-width: 480px) {
    width: 90vw;
    max-width: 90vw;
    height: 72vh;
    max-height: 540px;
    border-radius: 24px;
  }

  .list-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 20px 60px 12px 26px;

    .list-title {
      font-size: 1.02rem;
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.5px;
      text-shadow: 0 1px 4px rgb(0 0 0 / 30%);
    }
    .list-count {
      font-size: 0.78rem;
      color: rgb(255 255 255 / 45%);
      font-variant-numeric: tabular-nums;
    }
  }

  .list-close {
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    z-index: 10;
    background: rgb(255 255 255 / 8%);
    border: 1px solid rgb(255 255 255 / 12%);
    transition: transform 0.2s, background 0.2s;
    // 同 .panel-close：块级化图标，避免基线偏移导致圆心错位
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

  .aplayer {
    flex: 1;
    min-height: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
  }

  // 列表视图只保留歌单本体，隐藏 APlayer 自带头部（避免文字重叠）
  .aplayer-body {
    display: none !important;
  }

  // 强制展开列表（覆盖 APlayer inline style），高度撑满面板
  .aplayer .aplayer-list,
  .aplayer .aplayer-list[style] {
    display: block !important;
    flex: 1;
    min-height: 0;
    height: auto !important;
    max-height: none !important;
    margin: 0;
    padding: 0 12px 14px;
    background: transparent;
    overflow: hidden;

    ol,
    ol[style] {
      max-height: 100% !important;
      height: 100% !important;
      overflow-y: auto !important;
      display: block !important;
      padding: 2px 2px 6px;
      box-sizing: border-box;
    }
  }

  // ---------- 滚动条：默认隐藏，悬停面板时显现 ----------
  .aplayer .aplayer-list ol {
    scrollbar-width: thin;
    scrollbar-color: transparent transparent;
    overscroll-behavior-y: contain;
    scroll-behavior: smooth;

    &::-webkit-scrollbar {
      width: 5px;
      -webkit-appearance: none;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: transparent;
      border-radius: 3px;
      min-height: 30px;
    }
  }
  .music-list-box:hover .aplayer .aplayer-list ol {
    scrollbar-color: rgb(255 255 255 / 22%) transparent;
    &::-webkit-scrollbar-thumb {
      background: rgb(255 255 255 / 18%);
      &:hover {
        background: rgb(255 255 255 / 32%);
      }
    }
  }

  // ---------- 列表项：圆角玻璃行 ----------
  .aplayer .aplayer-list ol li {
    position: relative;
    display: flex;
    align-items: center;
    margin: 2px 4px;
    padding: 0 14px;
    height: 44px;
    line-height: normal; // flex 布局下交由 align-items 居中，固定行高会压偏伪元素图标
    border: none;
    border-radius: 12px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s ease;
    overflow: hidden;

    &:hover {
      background: rgb(255 255 255 / 8%);
    }

    // 隐藏 APlayer 自带色条（用行样式代替）
    .aplayer-list-cur {
      display: none !important;
    }

    .aplayer-list-index {
      width: 26px;
      margin-right: 14px;
      text-align: right;
      color: rgb(255 255 255 / 32%);
      font-size: 0.8rem;
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }

    .aplayer-list-title {
      flex: 0 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: rgb(255 255 255 / 85%);
      font-size: 0.9rem;
    }

    .aplayer-list-author {
      flex: 1;
      min-width: 0;
      margin-left: 12px;
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: rgb(255 255 255 / 38%);
      font-size: 0.76rem;
    }

    // 当前播放项：玻璃渐变行 + 均衡器动画
    &.aplayer-list-light {
      background: linear-gradient(90deg, rgb(255 255 255 / 16%) 0%, rgb(255 255 255 / 5%) 100%);
      box-shadow: inset 0 1px 0 rgb(255 255 255 / 12%);

      .aplayer-list-index {
        color: transparent;
        font-size: 0;
        text-align: center;
        line-height: 1;
        // 用固定高度的 flex 行内盒子盛放均衡器柱，保证与歌名文字垂直居中
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;

        // 三道跳动的均衡器柱（中间实体，两侧用阴影复制）
        &::before {
          content: "";
          display: block;
          width: 3px;
          height: 13px;
          margin: 0 3px;
          border-radius: 2px;
          background: rgb(255 255 255 / 95%);
          box-shadow:
            -6px 0 0 rgb(255 255 255 / 65%),
            6px 0 0 rgb(255 255 255 / 45%);
          animation: list-eq 0.9s ease-in-out infinite;
          transform-origin: center;
        }
      }

      .aplayer-list-title {
        color: #fff;
        font-weight: 500;
      }
      .aplayer-list-author {
        color: rgb(255 255 255 / 55%);
      }
    }
  }

  // 暂停时均衡器静止
  &:not(.playing) .aplayer-list ol li.aplayer-list-light .aplayer-list-index::before {
    animation-play-state: paused;
    transform: scaleY(0.55);
  }
}

@keyframes list-eq {
  0%,
  100% {
    transform: scaleY(0.35);
  }
  50% {
    transform: scaleY(1);
  }
}
</style>
