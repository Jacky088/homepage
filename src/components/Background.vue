<template>
  <div :class="store.backgroundShow ? 'cover show' : 'cover'">
    <img
      v-if="store.coverType !== '4'"
      v-show="store.imgLoadStatus"
      :src="bgUrl"
      class="bg"
      alt="cover"
      @load="imgLoadComplete"
      @error.once="imgLoadError"
      @animationend="imgAnimationEnd"
    />
    <video
      v-else
      v-show="store.imgLoadStatus"
      ref="videoRef"
      :src="videoUrl"
      class="bg"
      autoplay
      loop
      muted
      playsinline
      preload="auto"
      disablePictureInPicture
      x5-video-player-type="h5"
      x5-video-player-fullscreen="true"
      x5-video-orientation="portraint"
      webkit-playsinline="true"
      @canplay="videoLoadComplete"
      @animationend="imgAnimationEnd"
      @loadeddata="onVideoLoadedData"
      @error="onVideoError"
      @stalled="onVideoStalled"
      @waiting="onVideoWaiting"
      @playing="onVideoPlaying"
    ></video>
    <div :class="store.backgroundShow ? 'gray hidden' : 'gray'" />
    <Transition name="fade" mode="out-in">
      <a
        v-if="store.backgroundShow && store.coverType != '3' && store.coverType != '4'"
        class="down"
        :href="bgUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        下载壁纸
      </a>
    </Transition>
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import { Error } from "@icon-park/vue-next";
import { showMessage } from "@/utils/message.js";

const store = mainStore();
const bgUrl = ref(null);
const videoUrl = ref("/videos/background.mp4");
const videoRef = ref(null);
const imgTimeout = ref(null);
const videoRetryCount = ref(0);
const MAX_RETRY = 2;
const emit = defineEmits(["loadComplete"]);

// 壁纸随机数
const bgRandom = Math.floor(Math.random() * 10 + 1);

// 检测视频文件是否存在且有效
const checkVideoExists = async () => {
  try {
    const response = await fetch(videoUrl.value, { method: "HEAD" });
    if (response.ok) {
      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength) === 0) {
        return false;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("视频检测失败:", error);
    return false;
  }
};

// 视频加载完成（有足够数据可以播放）
const onVideoLoadedData = () => {
  // 确保视频能播放
  if (videoRef.value) {
    videoRef.value.play().catch((err) => {
      console.warn("视频自动播放被阻止:", err);
      // 降级：尝试静音播放
      videoRef.value.muted = true;
      videoRef.value.play();
    });
  }
};

// 视频开始播放
const onVideoPlaying = () => {
  videoRetryCount.value = 0; // 重置重试计数
};

// 视频加载停滞
const onVideoStalled = () => {
  console.warn("视频加载停滞");
  if (videoRef.value && videoRetryCount.value < MAX_RETRY) {
    videoRetryCount.value++;
    // 尝试重新加载
    videoRef.value.load();
  }
};

// 视频缓冲中
const onVideoWaiting = () => {
  // 视频缓冲时可以显示加载状态，这里暂不处理
};

// 视频加载错误
const onVideoError = () => {
  console.error("视频加载失败");
  showMessage({
    message: "视频背景加载失败，已切换至默认壁纸",
    type: "warning",
    duration: 3000,
  });
  store.coverType = "0"; // 切换回默认壁纸
};

// 更换壁纸链接
const changeBg = async (type) => {
  if (type == 0) {
    bgUrl.value = `/images/background${bgRandom}.jpg`;
  } else if (type == 1) {
    bgUrl.value = "https://api.dujin.org/bing/1920.php";
  } else if (type == 2) {
    bgUrl.value = "https://api.vvhan.com/api/wallpaper/views";
  } else if (type == 3) {
    bgUrl.value = "https://api.vvhan.com/api/wallpaper/acg";
  } else if (type == 4) {
    // 检测视频是否存在
    const exists = await checkVideoExists();
    if (!exists) {
      console.warn("检测到默认视频文件为空或不存在，自动切换至壁纸显示");
      showMessage({
        message: "未检测到本地视频，已自动切换至默认壁纸",
        type: "warning",
        duration: 3000,
      });
      store.coverType = "0";
    }
  }
};

// 图片加载完成
const imgLoadComplete = () => {
  imgTimeout.value = setTimeout(
    () => {
      store.setImgLoadStatus(true);
    },
    Math.floor(Math.random() * (600 - 300 + 1)) + 300,
  );
};

// 视频加载完成
const videoLoadComplete = () => {
  imgTimeout.value = setTimeout(
    () => {
      store.setImgLoadStatus(true);
    },
    Math.floor(Math.random() * (600 - 300 + 1)) + 300,
  );
};

// 图片动画完成
const imgAnimationEnd = () => {
  emit("loadComplete");
};

// 图片显示失败
const imgLoadError = () => {
  console.error("壁纸加载失败：", bgUrl.value);
  showMessage({
    message: "壁纸加载失败，已临时切换回默认",
    icon: h(Error, {
      theme: "filled",
      fill: "#efefef",
    }),
  });
  bgUrl.value = `/images/background${bgRandom}.jpg`;
};

// 监听壁纸切换
watch(
  () => store.coverType,
  (value) => {
    changeBg(value);
  },
);

// 页面可见性变化时暂停/恢复视频（节省性能）
const handleVisibilityChange = () => {
  if (!videoRef.value) return;

  if (document.hidden) {
    videoRef.value.pause();
  } else {
    videoRef.value.play().catch(() => {
      // 恢复播放失败时静默处理
    });
  }
};

onMounted(() => {
  // 一次性默认设置为视频背景
  if (!localStorage.getItem("video_default_set")) {
    store.coverType = "4";
    localStorage.setItem("video_default_set", "true");
  }
  // 加载壁纸
  changeBg(store.coverType);

  // 监听页面可见性
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onBeforeUnmount(() => {
  clearTimeout(imgTimeout.value);
  document.removeEventListener("visibilitychange", handleVisibilityChange);

  // 清理视频资源
  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.src = "";
    videoRef.value.load();
  }
});
</script>

<style lang="scss" scoped>
.cover {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transition: 0.25s;
  z-index: -1;

  &.show {
    z-index: 1;
  }

  .bg {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    backface-visibility: hidden;
    filter: blur(20px) brightness(0.3);
    transition:
      filter 0.3s,
      transform 0.3s;
    animation: fade-blur-in 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: 0.45s;
  }

  // 视频背景性能优化
  video.bg {
    // 启用 GPU 硬件加速
    transform: translate3d(0, 0, 0);
    -webkit-transform: translate3d(0, 0, 0);
    -webkit-backface-visibility: hidden;
    // 限制渲染范围，减少重绘
    contain: layout style paint;
    // 避免视频控件闪现
    pointer-events: none;
    // 兼容旧版对象填充
    object-position: center center;
  }
  .gray {
    opacity: 1;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(rgba(0, 0, 0, 0) 0, rgba(0, 0, 0, 0.5) 100%),
      radial-gradient(rgba(0, 0, 0, 0) 33%, rgba(0, 0, 0, 0.3) 166%);

    transition: 1.5s;
    &.hidden {
      opacity: 0;
      transition: 1.5s;
    }
  }
  .down {
    font-size: 16px;
    color: white;
    position: absolute;
    bottom: 30px;
    left: 0;
    right: 0;
    margin: 0 auto;
    display: block;
    padding: 20px 26px;
    border-radius: 12px;
    background-color: #00000030;
    width: 120px;
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    &:hover {
      transform: scale(1.05);
      background-color: #00000060;
    }
    &:active {
      transform: scale(1);
    }
  }
}
</style>
