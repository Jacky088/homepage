import { createApp } from "vue";
import App from "@/App.vue";
// 引入 pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// swiper
import "swiper/css";
// 自定义样式（需要在 Element Plus 按需样式之后加载以确保优先级）
import "@/style/style.scss";
import { showMessage } from "@/utils/message.js";

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.mount("#app");

// PWA
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // 弹出更新提醒
    showMessage("站点已更新，刷新后生效");
  });
}
