/**
 * 视口断点常量（JS 侧）
 *
 * 唯一口径：宽度 **小于等于** BP_MD 视为移动端。
 * 与 SCSS 的 `@media (max-width: 720px)` 保持一致——即 720px 这个宽度
 * 在样式里属于移动端，JS 判断就必须同样归移动端。
 *
 * 历史问题：原先 App.vue 用 `value < 721`（720 归移动），
 * store 用 `value >= 720`（720 归桌面），两者在 720 这一个宽度上
 * 结论相反，会导致两个 watch 互相打架。现统一为 `<= BP_MD`。
 */

/** 中断点：小于此宽度切换为移动端布局 */
export const BP_MD = 720;

/** 小断点：极窄视口（胶囊/顶栏收紧） */
export const BP_SM = 480;

/** 是否处于移动端视口 */
export const isMobileWidth = (width) => width <= BP_MD;

/** 是否处于移动端布局（真触屏设备且 ≤ BP_MD，或任意设备极窄 ≤ BP_SM） */
export const isCompactViewport = (width, isTouch) =>
  width <= BP_SM || (width <= BP_MD && isTouch);
