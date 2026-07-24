<template>
  <div
    class="hitokoto"
    v-show="!store.musicOpenState"
    @click.stop
  >
    <!-- 一言内容 -->
    <Transition name="el-fade-in-linear" mode="out-in">
      <div :key="hitokotoData.text" class="content" @click="updateHitokoto">
        <span class="text">{{ hitokotoData.text }}</span>
        <span class="from">-「&nbsp;{{ hitokotoData.from }}&nbsp;」</span>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { Error } from "@icon-park/vue-next";
import { getHitokoto } from "@/api";
import { mainStore } from "@/store";
import { showMessage } from "@/utils/message.js";
import debounce from "@/utils/debounce.js";

const store = mainStore();

// 一言数据
const hitokotoData = reactive({
  text: "这里应该显示一句话",
  from: "無名",
});

// 获取一言数据
const getHitokotoData = async () => {
  try {
    const result = await getHitokoto();
    hitokotoData.text = result.hitokoto;
    hitokotoData.from = result.from;
  } catch (error) {
    showMessage({
      message: "一言获取失败",
      icon: h(Error, {
        theme: "filled",
        fill: "#efefef",
      }),
    });
    hitokotoData.text = "这里应该显示一句话";
    hitokotoData.from = "無名";
  }
};

// 更新一言数据
const updateHitokoto = () => {
  // 防抖
  debounce(() => {
    getHitokotoData();
  }, 500);
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
    .text {
      font-size: 2rem;
      text-align: justify;
      line-height: 1.5;
    }
    .from {
      font-size: 1.2rem;
      font-weight: bold;
      opacity: 0.8;
      margin-top: 12px;
      align-self: flex-end;
      white-space: nowrap;
    }
  }

  @media (max-width: 720px) {
    max-width: 92vw;
    padding: 16px 16px;
    .content {
      flex-direction: column;
      gap: 12px;
      .text {
        font-size: 1.15rem;
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
</style>
