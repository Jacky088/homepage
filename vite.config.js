/* eslint-disable no-undef */
import { defineConfig, loadEnv } from "vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { resolve } from "path";
import { VitePWA } from "vite-plugin-pwa";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default ({ mode }) => {
  // 第三个参数传 "" 才能读到非 VITE_ 前缀的变量（例如服务端专用的 UAPI_KEY）
  const env = loadEnv(mode, process.cwd(), "");

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
                  statuses: [200, 206], // 缓存完整响应和分段响应
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
        '/api': {
          target: 'https://163api.mmcoo.de',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
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
      assetsInlineLimit: 0, // 禁止内联视频等大文件
      rollupOptions: {
        output: {
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
