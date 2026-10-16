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

    <!-- 歌词展示（播放且开启歌词时展示） -->
    <div v-if="store.playerState && store.playerLrcShow" class="lrc">
      <div class="lrc-all" :key="store.getPlayerLrc">
        <music-one theme="filled" size="18" fill="#efefef" />
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
          <span class="power-text">
            <span :class="startYear < fullYear ? 'c-hidden' : 'hidden'">Copyright&nbsp;</span>
            <span class="copyright-symbol">&copy;</span>
            <span v-if="startYear < fullYear" class="site-start">
              {{ startYear }}
              <span class="dash">-</span>
            </span>
            <span class="site-end">{{ fullYear }}</span>
            <a :href="siteUrl" target="_blank" rel="noopener noreferrer" class="site-author">{{ siteAuthor }}</a>
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

  const itemSize = isMobile ? 38 : isTablet ? 38 : 40;
  const gap = isMobile ? 8 : isTablet ? 8 : 10;
  const leftMargin = isMobile ? 12 : isTablet ? 16 : 20;
  const rightMargin = isMobile ? 14 : isTablet ? 16 : 22;
  const btnWidth = isMobile ? 28 : isTablet ? 28 : 30;
  const safeBuffer = isMobile ? 16 : 24;

  const totalCount = socialLinks.length;
  const fullSocialW = totalCount * itemSize + (totalCount - 1) * gap;

  let powerW = isMobile ? 130 : isTablet ? 160 : 220;
  if (powerRef.value) {
    powerW = powerRef.value.offsetWidth;
  }

  const totalNeeded = leftMargin + fullSocialW + safeBuffer + powerW + rightMargin;

  if (totalNeeded > footerW && totalCount > 2) {
    isSocialOverflow.value = true;
    const availableForIcons =
      footerW - rightMargin - powerW - safeBuffer - leftMargin - btnWidth - gap;
    const fitCount = Math.floor((availableForIcons + gap) / (itemSize + gap));
    visibleSocialCount.value = Math.max(1, Math.min(3, fitCount || 2));
  } else {
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

const startYear = ref(
  import.meta.env.VITE_SITE_START?.length >= 4
    ? import.meta.env.VITE_SITE_START.substring(0, 4)
    : null
);
const siteIcp = ref(import.meta.env.VITE_SITE_ICP);
const siteAuthor = ref(import.meta.env.VITE_SITE_AUTHOR);
const siteUrl = computed(() => {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url) return "https://example.com";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return "//" + url;
  }
  return url;
});

// 歌词跑马灯计算
const lrcTextRef = ref(null);
const isMarquee = ref(false);
const marqueeDuration = ref("12s");
const marqueeDistance = ref("0px");

const marqueeStyle = computed(() => ({
  "--marquee-duration": marqueeDuration.value,
  "--marquee-distance": marqueeDistance.value,
}));

const computeMarquee = () => {
  nextTick(() => {
    const el = lrcTextRef.value;
    if (!el) {
      isMarquee.value = false;
      return;
    }
    const container = el.parentElement;
    if (!container) return;

    const textWidth = el.scrollWidth;
    const containerWidth = container.clientWidth;

    if (textWidth > containerWidth && containerWidth > 0) {
      const distance = textWidth - containerWidth;
      const speed = 30;
      const duration = Math.max(distance / speed, 3);
      marqueeDistance.value = `-${distance}px`;
      marqueeDuration.value = `${duration.toFixed(2)}s`;
      isMarquee.value = true;
    } else {
      isMarquee.value = false;
      marqueeDistance.value = "0px";
    }
  });
};

watch(
  () => store.getPlayerLrc,
  () => {
    isMarquee.value = false;
    computeMarquee();
  }
);

watch(
  () => store.playerLrcShow,
  (val) => {
    if (val) computeMarquee();
  }
);

let footerObserver = null;

const onResize = () => {
  computeOverflow();
  computeMarquee();
};

onMounted(() => {
  computeOverflow();
  window.addEventListener("resize", onResize);
  document.addEventListener("click", handleClickOutside);

  if (footerRef.value && "ResizeObserver" in window) {
    footerObserver = new ResizeObserver(() => {
      computeOverflow();
      computeMarquee();
    });
    footerObserver.observe(footerRef.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  document.removeEventListener("click", handleClickOutside);
  if (footerObserver) footerObserver.disconnect();
});
</script>

<style lang="scss" scoped>
#footer {
  position: relative;
  width: 100%;
  height: 48px;
  line-height: 48px;
  text-align: center;
  z-index: 0;
  box-sizing: border-box;
  word-break: keep-all;
  white-space: nowrap;
  padding-bottom: env(safe-area-inset-bottom, 0);

  .footer-left {
    position: absolute;
    left: 20px;
    top: 0;
    bottom: 0;
    margin: auto 0;
    height: 38px;
    display: flex;
    align-items: center;
    z-index: 2;
  }

  .footer-right {
    position: absolute;
    right: 22px;
    top: 0;
    bottom: 0;
    margin: auto 0;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    z-index: 2;
    text-align: right;
  }

  .power {
    display: inline-flex;
    align-items: center;
    font-family: "HarmonyOS_Regular", -apple-system, sans-serif;
    font-size: 0.88rem;
    color: rgba(255, 255, 255, 0.78);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
    line-height: 1.2;
    letter-spacing: 0.25px;
    animation: fade 0.3s;

    .power-text {
      display: inline-flex;
      align-items: center;
    }

    .copyright-symbol {
      margin: 0 3px 0 1px;
      opacity: 0.9;
    }

    .site-start {
      display: inline-flex;
      align-items: center;
      .dash {
        margin: 0 3px;
        opacity: 0.6;
      }
    }

    .site-end {
      margin-right: 4px;
    }

    .site-author {
      color: rgba(255, 255, 255, 0.95);
      font-weight: 500;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.2s, background-color 0.2s, text-shadow 0.2s;

      &:hover {
        color: #fff;
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
        background: rgba(255, 255, 255, 0.1);
        text-decoration: none;
      }

      &:active {
        opacity: 0.8;
      }
    }
  }

  .site-icp {
    margin-left: 6px;
    font-size: 0.84rem;
    color: rgba(255, 255, 255, 0.6);

    a {
      color: rgba(255, 255, 255, 0.75);
      transition: color 0.2s;
      &:hover {
        color: #fff;
        text-decoration: underline;
      }
    }
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

    .lrc-clip {
      flex: 0 1 auto;
      min-width: 0;
      overflow: hidden;
      margin: 0 8px;
    }

    .lrc-text {
      display: inline-block;
      white-space: nowrap;
      width: max-content;
      max-width: none;

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
  }

  @keyframes lrc-marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(var(--marquee-distance, -100px));
    }
  }

  @media (max-width: $bp-md) {
    height: 48px;
    line-height: 48px;

    .footer-left {
      left: 14px;
    }

    .footer-right {
      right: 16px;
    }

    .power {
      font-size: 0.84rem;
    }

    .lrc {
      padding: 0 110px;
    }
  }

  @media (max-width: 560px) {
    .c-hidden {
      display: none;
    }
  }

  @media (max-width: $bp-sm) {
    height: 48px;
    line-height: 48px;

    .footer-left {
      left: 12px;
    }

    .footer-right {
      right: 14px;
    }

    .power {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.82);

      .site-author {
        padding: 2px 2px;
      }
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
      font-size: 0.82rem;
    }
  }
}
</style>
