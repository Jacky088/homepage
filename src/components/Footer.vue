<template>
  <footer id="footer" ref="footerRef" :class="store.footerBlur ? 'blur' : null">
    <!-- 左侧社交链接 -->
    <div class="footer-left">
      <SocialLinks
        :is-overflow="isSocialOverflow"
        :is-expanded="isSocialExpanded"
        :visible-count="visibleSocialCount"
        @toggle-expand="toggleSocialExpand"
      />
    </div>

    <!-- 歌词展示（播放且开启歌词时，不要动歌词显示） -->
    <div v-if="store.playerState && store.playerLrcShow" class="lrc">
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

    <!-- 右侧版权与备案（未开启歌词且社交未展开时展示） -->
    <Transition name="fade">
      <div
        v-if="(!store.playerState || !store.playerLrcShow) && !isSocialExpanded"
        class="footer-right"
        ref="powerRef"
      >
        <div class="power">
          <span>
            <span :class="startYear < fullYear ? 'c-hidden' : 'hidden'">Copyright&nbsp;</span>
            &copy;
            <span v-if="startYear < fullYear" class="site-start">
              {{ startYear }}
              -
            </span>
            {{ fullYear }}
            <a :href="siteUrl" target="_blank" rel="noopener noreferrer">{{ siteAuthor }}</a>
          </span>
          <!-- 站点备案 -->
          <span v-if="siteIcp" class="site-icp">
            &amp;
            <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">
              {{ siteIcp }}
            </a>
          </span>
        </div>
      </div>
    </Transition>
  </footer>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { MusicOne } from "@icon-park/vue-next";
import { mainStore } from "@/store";
import SocialLinks from "@/components/SocialLinks.vue";
import socialLinks from "@/assets/socialLinks.json";

const store = mainStore();
const fullYear = new Date().getFullYear();

// 元素引用与折叠状态
const footerRef = ref(null);
const powerRef = ref(null);
const isSocialOverflow = ref(false);
const isSocialExpanded = ref(false);
const visibleSocialCount = ref(socialLinks.length);

const toggleSocialExpand = () => {
  isSocialExpanded.value = !isSocialExpanded.value;
};

// 判定社交链接与版权文字是否发生重叠，并计算折叠保留数量
const computeOverflow = () => {
  if (!footerRef.value) return;
  const footerW = footerRef.value.clientWidth;
  if (!footerW) return;
  const screenW = window.innerWidth;
  const isMobile = screenW <= 480;
  const isTablet = screenW <= 720 && screenW > 480;

  const iconSize = isMobile ? 19 : isTablet ? 20 : 22;
  const gap = isMobile ? 10 : isTablet ? 12 : 14;
  const leftMargin = isMobile ? 12 : isTablet ? 16 : 24;
  const rightMargin = isMobile ? 12 : isTablet ? 16 : 24;
  const btnWidth = isMobile ? 20 : isTablet ? 22 : 24;
  const safeBuffer = isMobile ? 20 : 32;

  const totalCount = socialLinks.length;
  // 全部展开时社交区域的总占用宽度
  const fullSocialW = totalCount * iconSize + (totalCount - 1) * gap;

  // 测量或估算版权文字宽度
  let powerW = isMobile ? 110 : isTablet ? 150 : 220;
  if (powerRef.value) {
    powerW = powerRef.value.offsetWidth;
  }

  // 总所需空间 = 左外边距 + 社交宽度 + 安全间距 + 版权宽度 + 右外边距
  const totalNeeded = leftMargin + fullSocialW + safeBuffer + powerW + rightMargin;

  if (totalNeeded > footerW && totalCount > 2) {
    // 发生重叠，开启折叠模式
    isSocialOverflow.value = true;
    // 计算留给折叠后社交图标的可用宽度
    const availableForIcons =
      footerW - rightMargin - powerW - safeBuffer - leftMargin - btnWidth - gap;
    const fitCount = Math.floor((availableForIcons + gap) / (iconSize + gap));
    // 至少展示 2 个（或 1 个极端小屏），最多展示 3 个常驻
    visibleSocialCount.value = Math.max(1, Math.min(3, fitCount || 2));
  } else {
    // 空间足够，无需折叠
    isSocialOverflow.value = false;
    visibleSocialCount.value = totalCount;
    isSocialExpanded.value = false;
  }
};

// 点击外部收起展开的社交平台
const handleClickOutside = (e) => {
  if (isSocialExpanded.value) {
    const footerLeft = footerRef.value?.querySelector(".footer-left");
    if (footerLeft && !footerLeft.contains(e.target)) {
      isSocialExpanded.value = false;
    }
  }
};

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
  if (!url) return "https://example.com";
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
  resizeTimer = setTimeout(() => {
    measureMarquee();
    computeOverflow();
  }, 100);
};

let footerObserver = null;

onMounted(() => {
  window.addEventListener("resize", onResize);
  document.addEventListener("click", handleClickOutside);
  computeOverflow();
  nextTick(() => {
    computeOverflow();
  });
  if (footerRef.value && "ResizeObserver" in window) {
    footerObserver = new ResizeObserver(() => {
      computeOverflow();
    });
    footerObserver.observe(footerRef.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  document.removeEventListener("click", handleClickOutside);
  clearTimeout(resizeTimer);
  if (footerObserver) footerObserver.disconnect();
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
  position: relative;
  width: 100%;
  height: 46px;
  line-height: 46px;
  text-align: center;
  z-index: 0;
  font-size: 14px;
  box-sizing: border-box;
  // 文字不换行
  word-break: keep-all;
  white-space: nowrap;

  .footer-left {
    position: absolute;
    left: 20px;
    top: 0;
    height: 100%;
    display: flex;
    align-items: center;
    z-index: 2;
  }

  .footer-right {
    position: absolute;
    right: 24px;
    top: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    z-index: 2;
    text-align: right;
  }

  .power {
    animation: fade 0.3s;
  }
  .lrc-all {
    animation: fade 0.3s;
  }
  .lrc {
    width: 100%;
    height: 100%;
    padding: 0 180px;
    box-sizing: border-box;
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
    backdrop-filter: blur(20px) saturate(140%);
    -webkit-backdrop-filter: blur(20px) saturate(140%);
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.45) 100%);
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 15px;
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

  @media (max-width: $bp-md) {
    height: 44px;
    line-height: 44px;
    font-size: 0.82rem;

    .footer-left {
      left: 14px;
    }

    .footer-right {
      right: 14px;
    }

    .lrc {
      padding: 0 110px;
    }

    &.blur {
      font-size: 0.82rem;
    }
  }

  @media (max-width: 560px) {
    .c-hidden {
      display: none;
    }
  }

  @media (max-width: $bp-sm) {
    height: 40px;
    line-height: 40px;
    font-size: 0.74rem;

    .footer-left {
      left: 10px;
    }

    .footer-right {
      right: 10px;
    }

    .site-icp {
      display: none;
    }

    .hidden {
      display: none;
    }

    .lrc {
      padding: 0 84px;
    }

    &.blur {
      font-size: 0.74rem;
    }
  }
}
</style>
