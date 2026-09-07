<template>
  <footer id="footer" :class="store.footerBlur ? 'blur' : null">
    <!-- 不用 Transition：动画时钟被节流时（后台标签页/省电模式）transitionend 丢失
         会导致 out-in 永久卡死、歌词不再更新。改用 :key 重建 + CSS fade 入场动画 -->
    <div v-if="!store.playerState || !store.playerLrcShow" class="power">
      <span>
        <span :class="startYear < fullYear ? 'c-hidden' : 'hidden'">Copyright&nbsp;</span>
        &copy;
        <span v-if="startYear < fullYear"
          class="site-start">
          {{ startYear }}
          -
        </span>
        {{ fullYear }}
        <a :href="siteUrl">{{ siteAuthor }}</a>
      </span>
      <!-- 以下信息请不要修改哦 -->
 
      <!-- 站点备案 -->
      <span v-if="siteIcp">
        &amp;
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">
          {{ siteIcp }}
        </a>
      </span>
    </div>
    <div v-else class="lrc">
      <div class="lrc-all" :key="store.getPlayerLrc">
        <music-one theme="filled" size="18" fill="#efefef" />
        <!-- 歌词超宽时自动跑马灯，速度按歌词时长/文本长度动态计算 -->
        <span class="lrc-clip">
          <span
            ref="lrcTextRef"
            class="lrc-text"
            :class="{ marquee: isMarquee }"
            :style="marqueeStyle"
          >{{ store.getPlayerLrc }}</span>
        </span>
        <music-one theme="filled" size="18" fill="#efefef" />
      </div>
    </div>
  </footer>
</template>

<script setup>
import { MusicOne } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import config from "@/../package.json";

const store = mainStore();
const fullYear = new Date().getFullYear();

// 加载配置数据
// const siteStartDate = ref(import.meta.env.VITE_SITE_START);
const startYear = ref(
  import.meta.env.VITE_SITE_START?.length >= 4 ?
  import.meta.env.VITE_SITE_START.substring(0, 4) : null
);
const siteIcp = ref(import.meta.env.VITE_SITE_ICP);
const siteAuthor = ref(import.meta.env.VITE_SITE_AUTHOR);
const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url) return "https://www.huzz.cn";
  // 判断协议前缀
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "//" + url;
  }
  return url;
});

// ---------- 歌词跑马灯 ----------
const lrcTextRef = ref(null);
const isMarquee = ref(false);
const marqueeDuration = ref(12); // 单程滚动秒数
const marqueeDistance = ref(0); // 滚动距离 px

// 测量当前歌词是否超宽，超宽则激活跑马灯并按内容长度计算速度
const measureMarquee = async () => {
  const target = store.getPlayerLrc;
  // 歌词切换时新元素由 :key 重建，等待文本真正更新后再测量，
  // 避免测量到尚未替换的旧歌词宽度
  for (let i = 0; i < 20; i++) {
    await nextTick();
    const el = lrcTextRef.value;
    if (el && el.textContent === target) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  const el = lrcTextRef.value;
  if (!el) return;
  const clip = el.parentElement;
  // width:max-content 下边界矩形宽度即内容自然宽度
  const overflow = Math.ceil(el.getBoundingClientRect().width - clip.clientWidth);
  if (overflow > 4) {
    isMarquee.value = true;
    marqueeDistance.value = overflow;
    // 速度按本句歌词停留时长自适应：总行程（溢出 + 可视宽）在句尾前刚好滚完；
    // 停留时长未知时退回 60px/s 基准。上限防极短句滚太快，下限保证可读性
    const stay = store.playerLrcDuration;
    const travel = overflow + clip.clientWidth;
    if (stay > 1) {
      marqueeDuration.value = Math.min(45, Math.max(5, stay));
    } else {
      marqueeDuration.value = Math.min(20, Math.max(6, travel / 60));
    }
  } else {
    isMarquee.value = false;
  }
};

// 歌词变化时重新测量
watch(() => store.getPlayerLrc, measureMarquee, { immediate: true });

// 窗口尺寸变化（旋转屏幕 / 拖动窗口）时重新测量
let resizeTimer = null;
const onResize = () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(measureMarquee, 150);
};
onMounted(() => window.addEventListener("resize", onResize));
onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  clearTimeout(resizeTimer);
});

const marqueeStyle = computed(() => {
  if (!isMarquee.value) return {};
  return {
    "--marquee-distance": `-${marqueeDistance.value}px`,
    "--marquee-duration": `${marqueeDuration.value}s`,
  };
});
</script>

<style lang="scss" scoped>
#footer {
  width: 100%;
  height: 46px;
  line-height: 46px;
  text-align: center;
  z-index: 0;
  font-size: 14px;
  // 文字不换行
  word-break: keep-all;
  white-space: nowrap;
  .power {
    animation: fade 0.3s;
  }
  .lrc-all {
    animation: fade 0.3s;
  }
  .lrc {
    padding: 0 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
      .lrc-all {
        width: 98%;
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        .i-icon {
          width: 18px;
          height: 18px;
          display: inherit;
          flex-shrink: 0;
        }
      }
      // 歌词裁剪区：溢出隐藏，超宽时交给内部跑马灯
      .lrc-clip {
        flex: 0 1 auto;
        min-width: 0;
        overflow: hidden;
        margin: 0 8px;
      }
      .lrc-text {
        display: inline-block;
        white-space: nowrap;
        // 强制取内容自然宽度：否则 CJK 字符作为合法断点会把 inline-block
        // 压缩到容器宽度（min-content 缩水），导致永远测不出溢出
        width: max-content;
        max-width: none;

        // 超宽歌词：单程滚动，滚到末端停住不回滚（forwards 保持终点位置）
        &.marquee {
          animation: lrc-marquee var(--marquee-duration, 12s) linear forwards;
        }
      }
  }
  &.blur {
    backdrop-filter: blur(10px);
    background: rgb(0 0 0 / 25%);
    font-size: 16px;
  }

  // 歌词跑马灯：单程从起点滚到 -distance，forwards 停在末端
  @keyframes lrc-marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(var(--marquee-distance, -100px));
    }
  }

  @media (max-width: 720px) {
    font-size: 0.9rem;
    &.blur {
      font-size: 0.9rem;
    }
  }
  @media (max-width: 560px) {
    .c-hidden {
      display: none;
    }
  }
  @media (max-width: 480px) {
    .hidden {
      display: none;
    }
  }
}
</style>
