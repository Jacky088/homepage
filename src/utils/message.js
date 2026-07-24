import { ElMessage } from "element-plus";
import "element-plus/es/components/message/style/css";

/**
 * 消息弹窗工具函数
 * 统一设置 offset，使消息从页面顶部留出足够空间（避开 header）
 * Element Plus 会自动处理多条消息的垂直堆叠排列，不会重叠
 */
const MESSAGE_OFFSET = 80;
const MOBILE_BREAKPOINT = 720;

const getOffset = () => {
  return window.innerWidth <= MOBILE_BREAKPOINT ? 70 : MESSAGE_OFFSET;
};

/**
 * 封装 ElMessage，自动注入 offset 实现多消息依次排列
 * @param {String|Object} options - 消息内容或配置对象
 */
export const showMessage = (options) => {
  const offset = getOffset();

  // 如果传入的是字符串，转为对象格式
  if (typeof options === "string") {
    return ElMessage({
      message: options,
      offset,
    });
  }

  // 对象格式，合并 offset
  return ElMessage({
    offset,
    ...options,
  });
};

// 快捷方法
showMessage.success = (options) => {
  if (typeof options === "string") {
    return showMessage({ message: options, type: "success" });
  }
  return showMessage({ type: "success", ...options });
};

showMessage.warning = (options) => {
  if (typeof options === "string") {
    return showMessage({ message: options, type: "warning" });
  }
  return showMessage({ type: "warning", ...options });
};

showMessage.info = (options) => {
  if (typeof options === "string") {
    return showMessage({ message: options, type: "info" });
  }
  return showMessage({ type: "info", ...options });
};

showMessage.error = (options) => {
  if (typeof options === "string") {
    return showMessage({ message: options, type: "error" });
  }
  return showMessage({ type: "error", ...options });
};

export default showMessage;
