<template>
  <!-- 音乐控制面板 - 居中浮层 -->
  <Teleport to="body">
    <Transition name="music-panel">
      <div class="music-overlay" v-show="store.musicOpenState && !musicListShow" @click="store.musicOpenState = false">
        <div class="music-panel" @click.stop>
          <!-- 关闭按钮 -->
          <div class="panel-close" @click="store.musicOpenState = false">
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
          <!-- 音量控制 -->
          <div class="volume-bar">
            <div class="vol-icon">
              <volume-mute theme="filled" size="16" fill="#ffffff99" v-if="volumeNum == 0" />
              <volume-small theme="filled" size="16" fill="#ffffff99" v-else-if="volumeNum < 0.7" />
              <volume-notice theme="filled" size="16" fill="#ffffff99" v-else />
            </div>
            <el-slider v-model="volumeNum" :show-tooltip="false" :min="0" :max="1" :step="0.01" />
          </div>
          <!-- 底部按钮 -->
          <div class="panel-footer">
            <span class="footer-btn" @click="openMusicList()">打开列表</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 音乐列表弹窗 - 打开列表时隐藏播放器，关闭列表时恢复 -->
  <div class="music-list" v-show="musicListShow" @click="closeMusicList()">
    <div class="list" @click.stop>
      <close-one
        class="close"
        theme="filled"
        size="24"
        fill="#ffffff80"
        @click="closeMusicList()"
      />
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
  </div>
</template>

<script setup>
import {
  GoStart,
  PlayOne,
  Pause,
  GoEnd,
  CloseOne,
  VolumeMute,
  VolumeSmall,
  VolumeNotice,
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

// 开启播放列表
const openMusicList = () => {
  musicListShow.value = true;
  nextTick(() => {
    playerRef.value.toggleList();
  });
};

// 关闭播放列表
const closeMusicList = () => {
  playerRef.value.toggleList();
  musicListShow.value = false;
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
  width: 420px;
  padding: 40px 36px 30px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(40px) saturate(1.4);
  -webkit-backdrop-filter: blur(40px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;

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
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%);
    border: 2px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;

    &.spinning {
      animation: disc-spin 4s linear infinite;
    }

    .disc-inner {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
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
      font-size: 1.3rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 6px;
    }
    .song-artist {
      display: block;
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;

    .ctrl-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
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
      width: 68px;
      height: 68px;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.15);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  .volume-bar {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 8px;

    .vol-icon {
      display: flex;
      align-items: center;
      .i-icon {
        display: flex;
        width: 16px;
        height: 16px;
      }
    }

    :deep(.el-slider) {
      --el-slider-main-bg-color: #ffffffcc;
      --el-slider-runway-bg-color: #ffffff26;
      --el-slider-button-size: 12px;
      height: 20px;
    }
    :deep(.el-slider__runway) {
      height: 3px;
      border-radius: 3px;
    }
    :deep(.el-slider__bar) {
      height: 3px;
      border-radius: 3px;
    }
    :deep(.el-slider__button-wrapper) {
      top: -14px;
    }
    :deep(.el-slider__button) {
      width: 12px;
      height: 12px;
      border: 2px solid #fff;
      background: #fff;
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
}

@keyframes disc-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.music-panel-enter-active {
  transition: opacity 0.3s ease;
  .music-panel {
    transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease;
  }
}
.music-panel-leave-active {
  transition: opacity 0.25s ease;
  .music-panel {
    transition: transform 0.25s ease, opacity 0.25s ease;
  }
}
.music-panel-enter-from,
.music-panel-leave-to {
  opacity: 0;
  .music-panel {
    transform: scale(0.9) translateY(20px);
    opacity: 0;
  }
}

// 音乐列表弹窗
.music-list {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #00000080;
  backdrop-filter: blur(20px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;

  .list {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 640px;
    height: 600px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    overflow: hidden;

    @media (max-width: 720px) {
      width: 90%;
      height: 80vh;
    }

    .close {
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

    :deep(.aplayer) {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
