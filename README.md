# Homepage主页

一个简洁、美观的个人主页，基于 Vue 3 + Vite 构建。

## 主页预览

![主页预览](https://raw.githubusercontent.com/Jacky088/homepage/main/screenshots/main.jpg)

## 功能特性

- 响应式布局，适配 PC 和移动端
- 动态视频 / 图片壁纸背景，支持切换
- 一言（Hitokoto）随机句子展示
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

项目通过 `VITE_` 开头的环境变量配置。`.env` 不在仓库中，配置方式按使用场景选择：

- **本地开发 / 静态构建 / Docker**：复制 `.env.example` 为 `.env`，按需修改；
- **托管平台**：在平台控制台添加环境变量（首选，改配置无需提交代码），或把 `.env` 提交进仓库（**切勿在其中存放密钥**）。

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
| VITE_WEATHER_KEY | 高德 Web 服务 Key（留空则用 IP 定位） | xxxxxxxx |
| VITE_AMAP_BASE | 高德 API 代理地址（可选，留空直连官方） | https://example.com/amap |

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

**定位逻辑（双路线）：**

| 条件 | 定位方式 | 天气来源 |
| --- | --- | --- |
| 配置了 `VITE_WEATHER_KEY`（高德 key） | 高德 IP 定位 | 高德天气接口 |
| `VITE_WEATHER_KEY` 为空（默认） | ipinfo.io / ipapi.co IP 定位 | wttr.in 备用接口 |

**配置方式：**
1. **推荐（国内稳定）**：在 [高德开放平台](https://console.amap.com/) 注册 **Web 服务 Key**（免费，每日上限 5000 次）。为避免 Key 暴露在前端产物中被盗刷，建议配合 `worker/amap-proxy.js` 部署代理并配置 `VITE_AMAP_BASE`（见部署章节）。
2. **免配置**：`VITE_WEATHER_KEY` 留空即可，自动使用 ipinfo.io / ipapi.co 定位 + wttr.in 获取天气，无需申请任何 Key。

**说明：**
- 天气定位精度为**城市级**（按 IP 自动识别当前所在城市）。
- 若 `VITE_WEATHER_KEY` 留空时依赖 ipinfo.io / ipapi.co / wttr.in 外网服务，国内网络环境可能访问受限，建议配置高德 Key 以保证稳定。

## 部署

本项目为纯静态 SPA，支持三种部署方式，按需选择：

| 方式 | 适合场景 | 配置方式 |
| --- | --- | --- |
| 托管平台（Vercel / Cloudflare Pages / EdgeOne） | 推荐，自动构建与 HTTPS | 平台控制台配置环境变量（首选）或提交 `.env` |
| 静态文件构建 | 自有服务器 / 任意静态托管 | 本地配置 `.env` 后构建，上传 `dist/` |
| Docker | 自有服务器，容器化运行 | 本地配置 `.env` 后构建镜像 |

> **⚠️ 重要**：`.env` 不在 Git 仓库中，托管平台的构建环境默认**没有任何 `VITE_*` 变量**。不先配置变量会导致构建失败（`URIError: URI malformed`）。各平台配置方法见下文，变量说明见 [配置说明](#配置说明)。

### 托管平台部署（Vercel / Cloudflare Pages / EdgeOne）

三个平台步骤一致：导入仓库 → 配置环境变量 → 部署。

| 平台 | 一键部署 | 构建命令 | 输出目录 |
| --- | --- | --- | --- |
| Vercel | [![Deploy with Vercel](https://vercel.com/new/button)](https://vercel.com/new/clone?repository-url=https://github.com/Jacky088/homepage) | `pnpm build`（自动识别） | `dist`（自动识别） |
| Cloudflare Pages | [![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Jacky088/homepage) | `pnpm build` | `dist` |
| EdgeOne Pages | [![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?from=github&repository-url=https://github.com/Jacky088/homepage) | `pnpm build` | `dist` |

**环境变量配置（部署前必做）：**

1. 在平台项目的 Settings → Environment Variables 中，参照 [配置说明](#配置说明) 的变量表逐条添加（**值不要带引号**）；
2. 配置后**重新部署**（Redeploy）生效。

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

### Cloudflare Worker（高德 API 代理，可选）

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Jacky088/homepage)

使用高德天气 Key 且不想将其暴露在前端产物中时，可部署代理 Worker。由于代理脚本位于 `worker/amap-proxy.js` 子目录，一键部署后需将 Worker 脚本内容替换为该文件内容（或本地执行 `wrangler deploy worker/amap-proxy.js`），然后：

1. 在 Worker 的 Settings → Variables 中添加 `AMAP_KEY`（高德 Web 服务 Key），可选配 `ALLOWED_ORIGIN` 限制调用来源；
2. 为 Worker 绑定路由或自定义域（如 `https://你的域名/amap/*`）；
3. 在前端项目的环境变量中设置 `VITE_AMAP_BASE` 指向该 Worker 地址，重新部署。

不使用代理时 `VITE_AMAP_BASE` 留空即可，天气功能走 IP 定位 + wttr.in，无需任何 Key。

## 项目结构

```
src/
├── api/            # API 接口
├── assets/         # 静态资源（链接配置 JSON）
├── components/     # 公共组件
├── store/          # Pinia 状态管理
├── style/          # 全局样式
├── utils/          # 工具函数
└── views/          # 页面视图
```

## 许可证

[MIT License](./LICENSE)
