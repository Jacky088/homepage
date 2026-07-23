<template>
  <div class="left">
    <Message />
    <SocialLinks />
  </div>
</template>

<script setup>
import { mainStore } from "@/store";
import Message from "@/components/Message.vue";
import SocialLinks from "@/components/SocialLinks.vue";
const store = mainStore();
</script>

<style lang="scss" scoped>
.left {
  width: 50%;
  margin-right: 10px;
  margin-top: 20px;
  @media (max-width: 720px) {
    margin-right: 0;
    width: 100%;
  }
}
</style>
