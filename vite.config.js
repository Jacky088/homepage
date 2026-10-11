/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import viteCompression from "vite-plugin-compression";
import { existsSync, readFileSync } from "node:fs";

// ---- 构建防卫：必需环境变量校验 ----
// 下列变量会被直接写进产物（HTML meta、PWA manifest、前端请求地址）。
// 缺失时构建要么以一条毫无指向性的 `URIError: URI malformed` 失败（vite-plugin-pwa
// 拿到空的 manifest 名称），要么把 %VITE_XXX% 占位符原样输出到 dist/index.html。
// 因此在配置阶段就拦下来，并把“缺了哪个、为什么需要、怎么修”说清楚。
const REQUIRED_ENV = [
  ["VITE_SITE_NAME", "站点名称（index.html <title> / PWA manifest）"],
  ["VITE_SITE_AUTHOR", "作者名（index.html meta author）"],
  ["VITE_SITE_KEYWORDS", "关键词（index.html meta keywords）"],
  ["VITE_SITE_DES", "站点简介（index.html meta description / manifest description）"],
  ["VITE_SITE_URL", "站点地址（页脚、消息面板的外链）"],
  ["VITE_SITE_LOGO", "站点图标（index.html favicon）"],
  ["VITE_SITE_MAIN_LOGO", "主页 Logo（Loading / Message 组件）"],
  ["VITE_SITE_APPLE_LOGO", "Apple 端图标（index.html apple-touch-icon）"],
  ["VITE_SONG_SERVER", "音乐服务商 netease / tencent（src/components/Music.vue）"],
  ["VITE_SONG_TYPE", "播放类型 song / playlist / album / artist（src/components/Music.vue）"],
  // 不列入必需：
  // - VITE_SONG_API：留空时直接使用内置备用接口
  // - VITE_UAPI_BASE：代码里已有默认值 "/uapi"（src/api/index.js），Vercel 等平台没配也能跑
];

// loadEnv(mode, cwd, "") 会把 process.env 与 .env* 文件合并后再返回，
// 所以这里只需要判断“最终生效值是否为空”，无需关心变量究竟来自哪一层。
function checkEnv(env, mode, isBuild) {
  const missing = REQUIRED_ENV.filter(([key]) => !String(env[key] ?? "").trim());
  if (missing.length === 0) return;

  const at = (p) => resolve(__dirname, p);
  const envFiles = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];
  const found = envFiles.filter((f) => existsSync(at(f)));
  const template = existsSync(at(".env.example")) ? readFileSync(at(".env.example"), "utf8") : "";

  // 有 env 文件说明用户已经初始化过，提示重点就从“复制模板”变成“补齐缺的那几个”
  const hasEnvFile = found.length > 0;

  const lines = missing.map(([key, why]) => {
    const hint = !template.includes(key)
      ? ".env.example 中也没有模板，需自行填写"
      : hasEnvFile
        ? "在 .env 中补齐该值"
        : "复制 .env.example 后填值即可";
    return `  ✗ ${key.padEnd(20)} ${why}
      ↳ ${hint}`;
  });

  const tip = hasEnvFile
    ? `已找到 ${found.join("、")}，但下列变量为空`
    : `未找到任何环境变量文件（依次查找 ${envFiles.join(" → ")}）`;

  const report = [
    "",
    `${isBuild ? "✖ 构建中止" : "⚠ 环境变量不完整（开发环境继续运行，页面可能异常）"}：${tip}`,
    `缺少 ${missing.length} 个必需变量：`,
    ...lines,
    "",
    "修复步骤：",
    hasEnvFile
      ? "  1. 编辑 .env，补齐上面列出的变量（可留空的变量见 .env.example 内注释）"
      : "  1. 复制模板  PowerShell: Copy-Item .env.example .env  /  bash: cp .env.example .env",
    hasEnvFile ? "  2. 重新执行 pnpm build" : "  2. 按需修改 .env 中的值，再执行 pnpm build",
    "",
  ].join("\n");

  // 先打印排版完整的说明，再抛一个短错误，避免 Vite 把整段文本塞进堆栈里
  console.error(report);
  if (isBuild) {
    throw new Error(`环境变量未配置：缺少 ${missing.map(([k]) => k).join("、")}（详见上方说明）`);
  }
}

// https://vitejs.dev/config/
export default ({ mode, command }) => {
  // 第三个参数传 "" 才能读到非 VITE_ 前缀的变量（例如服务端专用的 UAPI_KEY）
  const env = loadEnv(mode, process.cwd(), "");

  // 构建必须有完整环境变量；dev 只警告不阻断，方便先跑起来看效果
  checkEnv(env, mode, command === "build");

  return defineConfig({
    plugins: [
      vue(),
      AutoImport({
        imports: ["vue"],
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          // 提高预缓存文件大小上限，避免视频等大文件警告
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /(.*?)\.(js|css|woff2|woff|ttf)/, // js / css 静态资源缓存
              handler: "CacheFirst",
              options: {
                cacheName: "js-css-cache",
              },
            },
            {
              urlPattern: /(.*?)\.(png|jpe?g|svg|gif|bmp|psd|tiff|tga|eps)/, // 图片缓存
              handler: "CacheFirst",
              options: {
                cacheName: "image-cache",
              },
            },
            {
              urlPattern: /(.*?)\.(mp4|webm|ogg)/, // 视频缓存（支持分段请求）
              handler: "CacheFirst",
              options: {
                cacheName: "video-cache",
                rangeRequests: true, // 支持 HTTP Range 分段加载
                cacheableResponse: {
                  // 只缓存完整的 200 响应。
                  // 不能把 206 列进来：Cache API 的 put() 明确拒绝部分响应，
                  // 会抛 "Partial response (status code 206) is unsupported"，
                  // 结果是视频永远存不进缓存、每次访问都重新下载。
                  // Range 请求由上面的 rangeRequests 注入的 RangeRequestsPlugin
                  // 从已缓存的完整响应切片提供，无需缓存 206 本身。
                  statuses: [200],
                },
                expiration: {
                  maxEntries: 5,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 缓存 30 天
                },
              },
            },
          ],
        },
        manifest: {
          name: env.VITE_SITE_NAME,
          short_name: env.VITE_SITE_NAME,
          description: env.VITE_SITE_DES,
          display: "standalone",
          start_url: "/",
          theme_color: "#424242",
          background_color: "#424242",
          icons: [
            {
              src: "/images/icon/48.png",
              sizes: "48x48",
              type: "image/png",
            },
            {
              src: "/images/icon/72.png",
              sizes: "72x72",
              type: "image/png",
            },
            {
              src: "/images/icon/96.png",
              sizes: "96x96",
              type: "image/png",
            },
            {
              src: "/images/icon/128.png",
              sizes: "128x128",
              type: "image/png",
            },
            {
              src: "/images/icon/144.png",
              sizes: "144x144",
              type: "image/png",
            },
            {
              src: "/images/icon/192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/images/icon/512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
      viteCompression(),
    ],
    server: {
      port: "3000",
      open: true,
      proxy: {
        // 天气代理：开发环境由 dev server 注入 X-API-Key，
        // 前端不持有 Key，行为与线上（Vercel Function）保持一致
        "/uapi/weather": {
          target: "https://uapis.cn",
          changeOrigin: true,
          rewrite: () => "/api/v1/misc/weather",
          headers: env.UAPI_KEY ? { "X-API-Key": env.UAPI_KEY } : {},
        },
        // 私人音乐接口代理：仅当本地 .env 配了 VITE_SONG_API_PROXY 才会注册。
        // 上游地址只存在于不入库的 .env 里，私人域名不会出现在仓库任何文件中；
        // 走同源 /api/song 也就不需要在 index.html 的 CSP connect-src 里放行它。
        // 使用方式：VITE_SONG_API_PROXY 填 Meting 接口地址，VITE_SONG_API 填 "/api/song"
        ...(env.VITE_SONG_API_PROXY
          ? {
              "/api/song": {
                target: env.VITE_SONG_API_PROXY,
                changeOrigin: true,
                // 去掉前缀后保留一个 "/"，保证 target 尾部斜杠不会丢失
                // （有些接口（如 api.injahow.cn）不带斜杠会 301 跳转）
                rewrite: (path) => path.replace(/^\/api\/song/, "/"),
              },
            }
          : {}),
      },
    },
    resolve: {
      alias: [
        {
          find: "@",
          replacement: resolve(__dirname, "src"),
        },
      ],
    },
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern',
          additionalData: `@use "./src/style/global.scss" as *;`,
          silenceDeprecations: ["legacy-js-api"],
        },
      },
    },
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          pure_funcs: ["console.log"],
        },
      },
      // 视频文件处理优化
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes("node_modules")) {
              if (id.includes("element-plus")) {
                return "vendor-element-plus";
              }
              if (id.includes("@icon-park") || id.includes("@vicons")) {
                return "vendor-icons";
              }
              if (id.includes("@worstone/vue-aplayer") || id.includes("aplayer")) {
                return "vendor-player";
              }
              if (id.includes("vue") || id.includes("pinia")) {
                return "vendor-vue";
              }
            }
          },
          // 视频文件单独输出，不打包进 bundle
          assetFileNames: (assetInfo) => {
            const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
            const ext = assetInfo.name.split('.').pop();

            if (videoExtensions.includes(ext)) {
              return 'videos/[name].[ext]'; // 保持原始文件名
            }
            return 'assets/[name]-[hash].[ext]';
          },
        },
      },
    },
  });
};
