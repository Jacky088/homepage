<template>
  <div
    class="hitokoto"
    v-show="!store.musicOpenState"
    @click.stop
  >
    <!-- 一言内容（不用 Transition：动画时钟被节流时 out-in 会永久卡死，
         与页脚歌词同样的问题；改用 :key 重建 + CSS fade 入场动画） -->
    <div :key="hitokotoData.text" class="content" @click="updateHitokoto" :title="clickable ? '点击换一句' : null">
      <span class="text">{{ hitokotoData.text }}</span>
      <span v-if="hitokotoData.hasFrom" class="from">-「&nbsp;{{ hitokotoData.from }}&nbsp;」</span>
    </div>
  </div>
</template>

<script setup>
import { Error } from "@icon-park/vue-next";
import { getHitokoto } from "@/api";
import { mainStore } from "@/store";
import { showMessage } from "@/utils/message.js";
import debounce from "@/utils/debounce.js";

const store = mainStore();

// 一言本地缓存：接口抖动时用上一条一言兜底，避免首屏出现占位文案
const HITOKOTO_CACHE_KEY = "hitokoto_cache";

const readCache = () => {
  try {
    const raw = localStorage.getItem(HITOKOTO_CACHE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    if (data && data.text) {
      // 旧缓存（uapis 之前）默认带出处
      return { hasFrom: data.hasFrom !== false, from: data.from || "", text: data.text };
    }
  } catch {
    // 缓存损坏时静默清除
    localStorage.removeItem(HITOKOTO_CACHE_KEY);
  }
  return null;
};

const writeCache = (data) => {
  try {
    localStorage.setItem(HITOKOTO_CACHE_KEY, JSON.stringify(data));
  } catch {
    // 存储不可用时忽略（隐私模式等场景）
  }
};

// 一言数据（优先使用上次缓存，保证首屏有内容）
const cached = readCache();
const hitokotoData = reactive({
  text: cached ? cached.text : "这里应该显示一句话",
  from: cached ? cached.from : "無名",
  hasFrom: cached ? cached.hasFrom : true,
});

// 是否展示可点击提示（仅首屏为占位文案时提示"点击换一句"）
const clickable = computed(() => hitokotoData.text !== "这里应该显示一句话");

// 获取一言数据
const getHitokotoData = async () => {
  try {
    const result = await getHitokoto();
    hitokotoData.text = result.hitokoto;
    hitokotoData.from = result.from || "";
    hitokotoData.hasFrom = result.hasFrom !== false && !!result.from;
    writeCache({ text: result.hitokoto, from: hitokotoData.from, hasFrom: hitokotoData.hasFrom });
  } catch (error) {
    // 首屏且无缓存时才提示，点击刷新失败不打扰
    if (!readCache()) {
      showMessage({
        message: "一言获取失败",
        icon: h(Error, {
          theme: "filled",
          fill: "#efefef",
        }),
      });
    }
  }
};

// 防抖实例需在组件作用域内复用，每次点击新建会导致防抖失效
const debouncedFetch = debounce(getHitokotoData, 500);

// 更新一言数据
const updateHitokoto = () => {
  debouncedFetch();
};

onMounted(() => {
  getHitokotoData();
});
</script>

<style lang="scss" scoped>
.hitokoto {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  width: auto;
  max-width: 80vw;
  padding: 20px 40px;
  animation: fade 0.5s;
  text-align: center;

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 70vw;
    // 扩大点击热区（负 margin 抵消，不改变视觉布局）
    padding: 8px 12px;
    margin: -8px -12px;
    cursor: pointer;
    // 固定最小高度，切换一言时容器高度变化更平滑
    min-height: 4.2em;
    justify-content: center;
    // :key 重建时的入场动画（替代 Transition，不依赖结束事件）
    animation: fade 0.3s;

    // 可点击暗示：占位文案时轻微呼吸动画引导点击
    &.is-placeholder {
      animation: hitokoto-breath 2.4s ease-in-out infinite;
    }

    .text {
      // 流式字号：窄窗口缩小、超宽屏适度放大，无需断点
      font-size: clamp(1.4rem, 2.2vw + 0.8rem, 2.2rem);
      text-align: center;
      line-height: 1.5;
      // 中文断行规则：禁则处理（标点不入行首）+ 词首禁断
      // （keep-all 关闭字间任意断行，line-break: strict 禁止"，。？！"等标点出现在行首）
      word-break: keep-all;
      line-break: strict;
      overflow-wrap: break-word;
      text-wrap: balance;
    }
    .from {
      font-size: 1.2rem;
      font-weight: bold;
      opacity: 0.8;
      margin-top: 12px;
      align-self: flex-end;
      // 来源名过长时省略，不溢出容器
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  @media (max-width: 720px) {
    max-width: 92vw;
    padding: 16px 16px;
    .content {
      flex-direction: column;
      gap: 12px;
      max-width: 88vw;
      min-height: 5.4em;
      .text {
        font-size: clamp(1.05rem, 3.6vw, 1.15rem);
        white-space: normal;
        max-width: 88vw;
        line-height: 1.8;
      }
      .from {
        font-size: 0.95rem;
      }
    }
  }
}

// 呼吸动画：仅占位文案期间引导用户点击
@keyframes hitokoto-breath {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.55;
  }
}
</style>
