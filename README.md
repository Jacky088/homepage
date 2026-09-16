# Homepage主页

一个简洁、美观的个人主页，基于 Vue 3 + Vite 构建。

## 主页预览

![主页预览](https://raw.githubusercontent.com/Jacky088/homepage/main/screenshots/main.jpg)

## 功能特性

- 响应式布局，适配 PC 和移动端
- 动态视频 / 图片壁纸背景，支持切换
- 一言（Hitokoto）随机句子展示
- 时光胶囊彩蛋：点击左上角 Logo 查看（今日/本周/本月/本年进度）
- 网站快捷链接导航
- 社交链接展示
- 音乐播放器（网易云 / QQ音乐）
- PWA 支持，可安装为桌面应用
- 星空渐变加载动画

## 技术栈

- Vue 3 + Composition API
- Vite 4
- Pinia 状态管理
- Element Plus 组件库
- SCSS 样式预处理
- PWA (vite-plugin-pwa)

## 快速开始

### 环境要求

- Node.js >= 22.13（pnpm 11 依赖 `node:sqlite` 内置模块）
- pnpm >= 11（版本由 `package.json` 的 `packageManager` 字段固定，corepack 会自动使用）

### 安装依赖

```bash
pnpm install
```

### 本地开发

```bash
pnpm dev
```

### 构建生产版本（输出静态网站文件）

```bash
pnpm build
```

构建产物（静态网站文件）输出在 `dist/` 目录，部署方式见 [部署](#部署) 章节。

`dist/` 目录包含：

| 文件/目录 | 说明 |
| --- | --- |
| `index.html` | 入口页面 |
| `assets/*.js` / `assets/*.css` | 打包压缩后的 JS / CSS 文件 |
| `manifest.webmanifest` | PWA 清单 |
| `sw.js` / `registerSW.js` / `workbox-*.js` | PWA Service Worker（离线缓存） |
| `*.gz` | gzip 压缩产物 |
| `images/`、`videos/` 等 | 静态资源 |

本地预览构建产物：

```bash
pnpm preview
```

> **注意**：构建前需先配置环境变量（见 [配置说明](#配置说明)），否则 `index.html` 中的 `%VITE_*%` 占位符无法注入，构建会失败。

## 配置说明

项目通过环境变量配置，分两类：`VITE_` 开头的会**注入前端产物**，其余仅在**服务端**使用。`.env` 不在仓库中，配置方式按使用场景选择：

- **本地开发 / 静态构建 / Docker**：复制 `.env.example` 为 `.env`，按需修改；
- **托管平台**：在平台控制台添加环境变量（首选，改配置无需提交代码），或把 `.env` 提交进仓库（**切勿在其中存放密钥**）。注意：平台控制台里配置的**服务端变量**（如 `UAPI_KEY`）不会被静态构建读取，仅供 Serverless Function 使用，因此必须配在平台上。

> **优先级提示**：若同一个变量在 `.env` 文件和云平台控制台**都配置了值**，以 **云平台环境变量** 为准。

| 变量名 | 说明 | 示例 |
| --- | --- | --- |
| VITE_SITE_NAME | 站点名称 | xx的主页 |
| VITE_SITE_AUTHOR | 作者名 | xx |
| VITE_SITE_URL | 站点域名 | example.com |
| VITE_SITE_LOGO | 站点图标路径 | /images/icon/favicon.ico |
| VITE_SITE_MAIN_LOGO | 主页 Logo 图片 | /images/icon/logo.png |
| VITE_SITE_START | 建站日期 | 20XX |
| VITE_SITE_ICP | ICP 备案号（可选） | xICP备xxxxx号 |
| VITE_SONG_API | 音乐 API 地址 | https://example.com/api |
| VITE_SONG_SERVER | 音乐服务商 | netease / tencent |
| VITE_SONG_TYPE | 播放类型 | playlist |
| VITE_SONG_ID | 歌单 ID（留空则隐藏播放器） | xxxxxxx |
| VITE_WEATHER_KEY | 高德 Web 服务 Key（可选，作为降级源） | xxxxxxxx |
| VITE_AMAP_BASE | 高德 API 代理地址（可选，留空直连官方） | https://example.com/amap |
| VITE_UAPI_BASE | 天气代理路径（前端使用，默认 `/uapi`） | /uapi |
| UAPI_KEY | uapis 天气 API Key（**服务端**变量，**不要加 `VITE_` 前缀**） | uapi-xxxxxxxx |

### 自定义链接

- 网站链接：编辑 `src/assets/siteLinks.json`
- 社交链接：编辑 `src/assets/socialLinks.json`

### 音乐播放器

音乐播放器基于 APlayer，通过 Meting API 获取歌单数据。

**配置步骤：**

1. 部署 Meting API 服务（参考 [Meting-API](https://github.com/xizeyoupan/Meting-API#deno-deploy)）
2. 在 `.env` 中填写 `VITE_SONG_API` 为你的 API 地址
3. 设置 `VITE_SONG_SERVER` 为音乐平台（`netease` 或 `tencent`）
4. 设置 `VITE_SONG_ID` 为歌单 ID（网易云歌单 ID 可从歌单 URL 中获取）
5. 若不需要播放器，将 `VITE_SONG_ID` 设为空即可

**注意事项：**
- QQ 音乐歌单建议不超过 50 首
- 如果 API 不通或网络异常，播放器会自动提示初始化失败并禁用入口
- 备用 API：`https://api.wuenci.com/meting/api/`

### 天气显示

顶栏右上角会展示当前城市及天气状况（图标 + 城市 + 天气 + 温度），点击可展开查看天气详情（风向、风力）。

**数据来源（三级降级链）：**

| 顺序 | 数据源 | 说明 |
| --- | --- | --- |
| 1 | [uapis 天气](https://uapis.cn/docs/api-reference/get-misc-weather) | **主源**。不传城市时按访客 IP 自动定位，一次请求同时拿到城市与天气，国内 CDN 直连稳定 |
| 2 | 高德天气 | 降级源。仅当配置了 `VITE_WEATHER_KEY` / `VITE_AMAP_BASE` 时参与 |
| 3 | ipinfo.io / ipapi.co + wttr.in | 最终兜底。境外免费服务，国内网络可能不可达 |

任一环节失败会自动降级到下一源，全部失败时右上角显示「天气获取失败」，点击可重试。所有外部请求均带 8s 超时，不会出现长时间停留在「定位中…」的情况。

**API Key 不会进入前端产物：**

天气请求统一发往同域路径 `{VITE_UAPI_BASE}/weather`（默认 `/uapi/weather`），`X-API-Key` 由服务端注入：

| 环境 | 谁注入 Key | 在哪里配置 |
| --- | --- | --- |
| 本地开发（`pnpm dev`） | Vite dev server 代理 | `.env` 中的 `UAPI_KEY` |
| Vercel 部署 | `api/weather.js`（Serverless Function） | 项目 Settings → Environment Variables 中的 `UAPI_KEY` |
| 自有服务器 / Docker | 需自行反代 | 见下方「其他部署方式」 |

`UAPI_KEY` 没有 `VITE_` 前缀，因此**不会被打进前端 JS**。若改用自建代理（nginx / Cloudflare Worker），把 `VITE_UAPI_BASE` 指向该代理地址即可；跨域时记得同步放行 `index.html` 中的 CSP `connect-src`。

**其他部署方式：**
- **Docker / nginx**：在 `nginx.conf` 中把 `/uapi/weather` 反代到 `https://uapis.cn/api/v1/misc/weather` 并注入 `X-API-Key` 头（Key 建议通过环境变量 + `envsubst` 注入，不要写死在配置里）；或把 `VITE_UAPI_BASE` 指向一个已部署好的代理地址。
- **Cloudflare Worker**：可参照 `worker/amap-proxy.js` 的写法实现同协议的 `/weather` 接口，再配置 `VITE_UAPI_BASE`。

**说明：**
- 天气定位精度为**城市级**（按 IP 自动识别当前所在城市）。
- 在 [uapis.cn](https://uapis.cn/) 注册可获取 API Key；不配置也能用，但走的是全网共享的匿名游客额度（1500 credits / 30 天），容易被他人耗尽。
- **可选**：在 [高德开放平台](https://console.amap.com/) 注册 **Web 服务 Key** 填入 `VITE_WEATHER_KEY` 作为降级源。
- 代理层响应带 `s-maxage=300`，由 CDN 缓存，可显著降低 uapis 额度消耗。
- 示例函数 `api/weather.js` 支持可选的 `ALLOWED_ORIGIN` 环境变量（逗号分隔），配置后仅允许指定来源调用，防止函数被他人当作免费接口盗刷。

## 部署

本项目为纯静态 SPA + 一个可选的天气代理函数，支持三种部署方式，按需选择：

| 方式 | 适合场景 | 配置方式 | 天气 Key |
| --- | --- | --- | --- |
| 托管平台（Vercel / Cloudflare Pages / EdgeOne） | 推荐，自动构建与 HTTPS | 平台控制台配置环境变量（首选）或提交 `.env` | Vercel 可直接用 `api/weather.js` 注入；其他平台需自备代理 |
| 静态文件构建 | 自有服务器 / 任意静态托管 | 本地配置 `.env` 后构建，上传 `dist/` | 需自备代理 |
| Docker | 自有服务器，容器化运行 | 本地配置 `.env` 后构建镜像 | 需在 nginx 中反代 |

> **⚠️ 重要**：`.env` 不在 Git 仓库中，托管平台的构建环境默认**没有任何 `VITE_*` 变量**。不先配置变量会导致构建失败（`URIError: URI malformed`）。各平台配置方法见下文，变量说明见 [配置说明](#配置说明)。

### 托管平台部署（Vercel / Cloudflare Pages / EdgeOne）

三个平台步骤一致：导入仓库 → 配置环境变量 → 部署。

| 平台 | 一键部署 | 构建命令 | 输出目录 |
| --- | --- | --- | --- |
| Vercel | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Jacky088/homepage) | `pnpm build`（自动识别） | `dist`（自动识别） |
| Cloudflare Pages | [![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Jacky088/homepage) | `pnpm build` | `dist` |
| EdgeOne Pages | [![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?from=github&repository-url=https://github.com/Jacky088/homepage) | `pnpm build` | `dist` |

**环境变量配置（部署前必做）：**

1. 在平台项目的 Settings → Environment Variables 中，参照 [配置说明](#配置说明) 的变量表逐条添加（**值不要带引号**）；
2. 配置后**重新部署**（Redeploy）生效。

**天气 Key 在 Vercel 上的配置：**

Vercel 会自动把仓库根目录 `api/` 下的文件部署为 Serverless Function，配合 `vercel.json` 的 rewrite，`/uapi/weather` 即由 `api/weather.js` 处理。因此只需要：

1. 在 Vercel 项目的 Environment Variables 中添加 `UAPI_KEY`（**不要加 `VITE_` 前缀**）；
2. 可选：添加 `ALLOWED_ORIGIN = https://你的域名`，防止函数被他人盗刷；
3. 无需配置 `VITE_UAPI_BASE`（前端默认走 `/uapi`）。

> Cloudflare Pages / EdgeOne Pages 不支持 Vercel 风格的 `api/` 函数，需自备代理（Cloudflare Worker / 边缘函数）并把 `VITE_UAPI_BASE` 指向它。

> 平台控制台的变量优先级高于 `.env` 文件；Node.js 版本无需手动设置（`engines` 字段已声明，Vercel 会自动选用 Node 22+）。

### 静态文件构建

```bash
cp .env.example .env   # 编辑 .env 填入自己的配置
pnpm build             # 产物输出到 dist/
```

将 `dist/` 内容部署到任意静态服务器或托管平台即可。本地可运行 `pnpm preview` 预览构建产物。

### Docker

```bash
cp .env.example .env   # 必须先准备 .env，否则使用模板默认值
# 编辑 .env 填入自己的配置
docker-compose up -d   # 端口 12445
```

运行镜像基于 `nginx:alpine`，已内置缓存策略与 PWA 响应头（`sw.js` 不缓存、带 hash 资源长缓存、gzip）。

> **⚠️ 天气代理**：镜像里只有静态产物，没有 Serverless Function，因此 `/uapi/weather` 需要在 `nginx.conf` 中自行反代到 `https://uapis.cn/api/v1/misc/weather` 并注入 `X-API-Key` 请求头（Key 用环境变量 + `envsubst` 注入，不要写死在配置里）。未反代时天气主源不可用，会逐级降级到高德 / 境外接口，可能显示「天气获取失败」。

### Cloudflare Worker（高德 API 代理，可选）

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Jacky088/homepage)

使用高德天气 Key 且不想将其暴露在前端产物中时，可部署代理 Worker。由于代理脚本位于 `worker/amap-proxy.js` 子目录，一键部署后需将 Worker 脚本内容替换为该文件内容（或本地执行 `wrangler deploy worker/amap-proxy.js`），然后：

1. 在 Worker 的 Settings → Variables 中添加 `AMAP_KEY`（高德 Web 服务 Key），可选配 `ALLOWED_ORIGIN` 限制调用来源；
2. 为 Worker 绑定路由或自定义域（如 `https://你的域名/amap/*`）；
3. 在前端项目的环境变量中设置 `VITE_AMAP_BASE` 指向该 Worker 地址，重新部署。

不使用高德代理时 `VITE_AMAP_BASE` 留空即可。高德只是 uapis 主源失败后的降级源，不配置也能正常显示天气。

## 项目结构

```
api/
└── weather.js      # 天气代理函数（Vercel Serverless Function，服务端注入 API Key）
src/
├── api/            # 前端 API 接口
├── assets/         # 静态资源（链接配置 JSON）
├── components/     # 公共组件
├── store/          # Pinia 状态管理
├── style/          # 全局样式
├── utils/          # 工具函数
└── views/          # 页面视图
worker/
└── amap-proxy.js   # 高德 API 代理（Cloudflare Worker，可选）
vercel.json         # /uapi/weather → api/weather.js 的重写规则
```

## 许可证

[MIT License](./LICENSE)
