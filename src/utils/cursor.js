// 当前活跃的光标实例（cursorInit 幂等，避免重复挂载）
let mainCursor = null;

const lerp = (a, b, n) => {
  if (Math.round(a) === b) {
    return b;
  }
  return (1 - n) * a + n * b;
};

/**
 * 初始化自定义光标
 * @returns {(() => void) | null} 清理函数（卸载时移除样式与监听）；不满足条件或已初始化时返回 null
 */
const cursorInit = () => {
  // 仅在支持高精度鼠标指针的环境下启用，触屏设备不初始化
  if (typeof window === "undefined" || !window.matchMedia || !window.matchMedia("(pointer: fine)").matches) {
    return null;
  }
  if (mainCursor) return null;

  mainCursor = new Cursor();
  const instance = mainCursor;

  return () => {
    instance.destroy();
    if (mainCursor === instance) mainCursor = null;
  };
};

class Cursor {
  constructor() {
    this.pos = {
      curr: null,
      prev: null,
    };
    this.rafId = null;
    this.handlers = {};
    this.create();
    this.init();
    this.render();
  }

  move(left, top) {
    if (!this.cursor) return;
    this.cursor.style["left"] = `${left}px`;
    this.cursor.style["top"] = `${top}px`;
  }

  create() {
    if (!this.cursor) {
      this.cursor = document.createElement("div");
      this.cursor.id = "cursor";
      this.cursor.classList.add("xs-hidden");
      this.cursor.classList.add("hidden");
      document.body.append(this.cursor);
    }

    document.body.appendChild((this.scr = document.createElement("style")));
    this.scr.innerHTML = `* {cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='10px' height='10px'><circle cx='4' cy='4' r='4' fill='white' /></svg>") 4 4, auto;}`;
  }

  refresh() {
    if (this.scr) this.scr.remove();
    if (this.cursor) this.cursor.classList.remove("active");
    this.pos = {
      curr: null,
      prev: null,
    };

    this.create();
    this.init();
    this.render();
  }

  /**
   * 挂载监听。
   * 用 addEventListener 而非 document.onmousemove = 这类属性赋值：
   * 属性赋值会覆盖页面上其他代码注册的同名处理函数，且无法精确移除。
   * 重复调用前先解绑，保证 refresh() 不会叠加监听。
   */
  init() {
    this.unbind();

    this.handlers = {
      mousemove: (e) => {
        if (!this.cursor) return;
        this.pos.curr == null && this.move(e.clientX - 8, e.clientY - 8);
        this.pos.curr = {
          x: e.clientX - 8,
          y: e.clientY - 8,
        };
        this.cursor.classList.remove("hidden");
        this.render();
      },
      mouseenter: () => this.cursor && this.cursor.classList.remove("hidden"),
      mouseleave: () => this.cursor && this.cursor.classList.add("hidden"),
      mousedown: () => this.cursor && this.cursor.classList.add("active"),
      mouseup: () => this.cursor && this.cursor.classList.remove("active"),
    };

    Object.entries(this.handlers).forEach(([type, fn]) => {
      document.addEventListener(type, fn);
    });
  }

  unbind() {
    Object.entries(this.handlers).forEach(([type, fn]) => {
      document.removeEventListener(type, fn);
    });
    this.handlers = {};
  }

  /** 完整卸载：停止渲染循环、解绑监听、移除注入的样式与光标节点 */
  destroy() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.unbind();
    if (this.scr) {
      this.scr.remove();
      this.scr = null;
    }
    if (this.cursor) {
      this.cursor.remove();
      this.cursor = null;
    }
  }

  render() {
    if (this.pos.prev) {
      this.pos.prev.x = lerp(this.pos.prev.x, this.pos.curr.x, 0.35);
      this.pos.prev.y = lerp(this.pos.prev.y, this.pos.curr.y, 0.35);
      this.move(this.pos.prev.x, this.pos.prev.y);
    } else {
      this.pos.prev = this.pos.curr;
    }
    if (
      this.pos.curr &&
      this.pos.prev &&
      (Math.abs(this.pos.curr.x - this.pos.prev.x) > 0.1 ||
        Math.abs(this.pos.curr.y - this.pos.prev.y) > 0.1)
    ) {
      this.rafId = requestAnimationFrame(() => this.render());
    }
  }
}

export default cursorInit;
