<template>
  <!-- 共享背景遮罩 - 始终不动 -->
  <Teleport to="body">
    <Transition name="music-overlay-fade">
      <div class="music-overlay" v-show="store.musicOpenState" @click="closeAll">
        <!-- 播放器面板 -->
        <Transition name="panel-fade">
          <div class="music-panel" v-show="!musicListShow" @click.stop>
            <!-- 关闭按钮 -->
            <div class="panel-close" @click="closeAll">
              <close-one theme="filled" size="24" fill="#ffffff80" />
            </div>
            <!-- 唱片动画 -->
            <div :class="['disc', { spinning: store.playerState }]">
              <div class="disc-inner">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="1.5">
                  <path d="M9 18V5l12-2v13" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
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
                <go-start theme="filled" size="30" fill="#ffffffcc" />
              </div>
              <div class="ctrl-btn play-btn" @click="changePlayState">
                <play-one v-if="!store.playerState" theme="filled" size="36" fill="#fff" />
                <pause v-else theme="filled" size="36" fill="#fff" />
              </div>
              <div class="ctrl-btn" @click="changeMusicIndex(1)">
                <go-end theme="filled" size="30" fill="#ffffffcc" />
              </div>
            </div>
            <!-- 底部按钮 -->
            <div class="panel-footer">
              <span class="footer-btn" @click="openMusicList()">打开列表</span>
            </div>
          </div>
        </Transition>

        <!-- 播放列表 -->
        <Transition name="panel-fade">
          <div class="music-list-box" v-show="musicListShow" @click.stop>
            <div class="list-close" @click="closeMusicList()">
              <close-one theme="filled" size="24" fill="#ffffff80" />
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
} from "@icon-park/vue-next";
import Player from "@/components/Player.vue";
import { mainStore } from "@/store";
const store = mainStore();

// 音量条数据
const volumeNum = ref(store.musicVolume ? store.musicVolume : 0.7);

// 播放列表数据
const musicListShow = ref(false);
const playerRef = ref(null);
const playerData = reactive({
  server: import.meta.env.VITE_SONG_SERVER,
  type: import.meta.env.VITE_SONG_TYPE,
  id: import.meta.env.VITE_SONG_ID,
});

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

// 同步进度
const syncProgress = () => {
  if (isSeeking.value) return;
  const audio = getAudioElement();
  if (audio) {
    currentTime.value = audio.currentTime || 0;
    duration.value = audio.duration || 0;
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
  // 强制展开 APlayer 列表 DOM
  nextTick(() => {
    const listEl = document.querySelector('.music-list-box .aplayer-list');
    if (listEl) {
      listEl.style.display = 'block';
      listEl.style.height = '480px';
      const ol = listEl.querySelector('ol');
      if (ol) {
        ol.style.maxHeight = '480px';
        ol.style.overflow = 'auto';
      }
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

onMounted(() => {
  // 空格键事件
  window.addEventListener("keydown", (e) => {
    if (!store.musicIsOk) {
      return;
    }
    if (e.code == "Space") {
      changePlayState();
    }
  });
  // 挂载方法至 window
  window.$openList = openMusicList;
  // 启动进度同步
  startProgressSync();

  // 音乐列表滚动回弹效果：滚到顶/底时短暂位移再弹回
  const musicListBox = document.querySelector(".music-list-box");
  if (musicListBox) {
    let rubberBandTimer = null;
    musicListBox.addEventListener(
      "wheel",
      (e) => {
        const ol = musicListBox.querySelector(".aplayer-list ol");
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
      },
      { passive: true },
    );
  }
});

onBeforeUnmount(() => {
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
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.music-panel {
  position: relative;
  width: 380px;
  max-width: 88vw;
  padding: 36px 32px 26px;
  border-radius: 28px;
  background: rgb(0 0 0 / 45%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgb(255 255 255 / 12%);
  box-shadow: 0 10px 30px rgb(0 0 0 / 30%), inset 0 1px 0 rgb(255 255 255 / 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;

  .panel-close {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    cursor: pointer;
    background: transparent;
    transition: transform 0.2s, opacity 0.2s;
    opacity: 0.5;
    z-index: 5;
    &:hover {
      transform: scale(1.2);
      opacity: 1;
    }
    &:active {
      transform: scale(0.9);
    }
  }

  .disc {
    position: relative;
    width: 92px;
    height: 92px;
    border-radius: 50%;
    background:
      repeating-radial-gradient(circle at center, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 2px, transparent 2px, transparent 5px),
      linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.04) 100%);
    border: 2px solid rgba(255, 255, 255, 0.18);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 24px rgba(255, 255, 255, 0.12), 0 8px 24px rgba(0, 0, 0, 0.4);
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      transform: scale(1.04);
      box-shadow: 0 0 32px rgba(255, 255, 255, 0.2), 0 8px 28px rgba(0, 0, 0, 0.5);
    }

    &.spinning {
      animation: disc-spin 6s linear infinite;
    }

    // 唱片刻度虚线轨道
    &::after {
      content: "";
      position: absolute;
      inset: 7px;
      border-radius: 50%;
      background: repeating-conic-gradient(rgba(255,255,255,0.1) 0deg 2deg, transparent 2deg 8deg);
      pointer-events: none;
      opacity: 0.6;
    }

    .disc-inner {
      position: relative;
      z-index: 1;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.15);
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
      font-size: 1.15rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 4px;
    }
    .song-artist {
      display: block;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;

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
        background: rgba(255, 255, 255, 0.1);
      }
      &:active {
        transform: scale(0.9);
      }

      .i-icon {
        display: flex;
      }
    }

    .play-btn {
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.15);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .panel-footer {
    .footer-btn {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      padding: 4px 16px;
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      transition: all 0.2s;

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.3);
      }
    }
  }

  // 进度条样式
  .progress-bar {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 4px;

    .time-text {
      font-size: 0.7rem;
      color: rgba(255, 255, 255, 0.5);
      min-width: 32px;
      text-align: center;
      user-select: none;
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
        height: 3px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.15);
      }

      .progress-filled {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 3px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.8);
        pointer-events: none;
      }

      .progress-thumb {
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        transition: transform 0.1s;
      }

      &:hover .progress-thumb,
      &:active .progress-thumb {
        transform: translate(-50%, -50%) scale(1.3);
      }
    }
  }

  // 移动端自适应
  @media (max-width: 480px) {
    width: 78vw;
    max-width: 78vw;
    padding: 28px 20px 20px;
    gap: 14px;
    border-radius: 22px;

    .disc {
      width: 76px;
      height: 76px;
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
    }

    .song-info {
      .song-name { font-size: 1rem; }
      .song-artist { font-size: 0.8rem; }
    }

    .controls {
      gap: 24px;
      .ctrl-btn { width: 40px; height: 40px; }
      .play-btn { width: 52px; height: 52px; }
    }
  }

  @media (max-height: 600px) {
    gap: 10px;
    padding: 24px 20px 16px;

    .disc {
      width: 56px;
      height: 56px;
      .disc-inner { width: 36px; height: 36px; }
    }

    .controls {
      gap: 20px;
      .play-btn { width: 48px; height: 48px; }
    }
  }
}

@keyframes disc-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

// 面板/列表切换渐变
.panel-fade-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.panel-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.panel-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.panel-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>

<style lang="scss">
// 音乐列表面板（在遮罩内，非 scoped 因为内容动态）
.music-list-box {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 640px;
  max-width: 88vw;
  height: 600px;
  max-height: 80vh;
  padding: 20px;
  background: rgb(0 0 0 / 45%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 28px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 30%), inset 0 1px 0 rgb(255 255 255 / 0.08);
  overflow: hidden;

  @media (max-width: 480px) {
    width: 78vw;
    max-width: 78vw;
    height: 70vh;
    max-height: 500px;
    border-radius: 22px;
  }

  .list-close {
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
    z-index: 10;
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

  .aplayer {
    width: 100%;
    height: 100%;
  }

  // 强制展开列表（覆盖 APlayer inline style）
  .aplayer .aplayer-list,
  .aplayer .aplayer-list[style] {
    display: block !important;
    height: 480px !important;
    max-height: 480px !important;

    ol,
    ol[style] {
      max-height: 520px !important;
      height: 520px !important;
      overflow-y: auto !important;
      display: block !important;
    }
  }

  // ---------- APlayer 列表细节优化 ----------
  // 自定义细圆角滚动条（默认淡出，hover 时显现）
  .aplayer .aplayer-list ol::-webkit-scrollbar {
    width: 5px;
    -webkit-appearance: none;
  }
  .aplayer .aplayer-list ol::-webkit-scrollbar-track {
    background: transparent;
  }
  .aplayer .aplayer-list ol::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.12);
    border-radius: 3px;
    min-height: 30px;
    transition: background 0.2s ease;
  }
  .aplayer .aplayer-list ol::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
  // Firefox 滚动条
  .aplayer .aplayer-list ol {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
    // 阻止滚动穿透到外层页面
    overscroll-behavior-y: contain;
    // 滚动更顺滑
    scroll-behavior: smooth;
  }

  // 隐藏 APlayer 列表默认标题头（若有）
  .aplayer .aplayer-list .aplayer-list-head {
    display: none;
  }

  // 列表项
  .aplayer .aplayer-list ol li {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 38px;
    padding: 8px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    transition: background 0.2s ease;
  }

  // 列表项 hover
  .aplayer .aplayer-list ol li:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  // 当前播放项：左侧竖条 + 渐变背景
  .aplayer .aplayer-list ol li.aplayer-list-light {
    position: relative;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.03) 100%);
  }
  .aplayer .aplayer-list ol li.aplayer-list-light::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 28px; // 加长，确保所有选中项竖条明显且一致
    background: rgba(255, 255, 255, 0.85);
    border-radius: 0 2px 2px 0;
  }

  // 序号弱化
  .aplayer .aplayer-list ol li .aplayer-list-index {
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.85rem;
    margin-right: 10px;
  }
  .aplayer .aplayer-list ol li.aplayer-list-light .aplayer-list-index {
    color: rgba(255, 255, 255, 0.7);
  }

  // 标题与作者
  .aplayer .aplayer-list ol li .aplayer-list-title {
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.9rem;
  }
  .aplayer .aplayer-list ol li .aplayer-list-author {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.8rem;
    margin-left: 10px;
  }
  .aplayer .aplayer-list ol li.aplayer-list-light .aplayer-list-title {
    color: #fff;
  }
}
</style>
