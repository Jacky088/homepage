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

- Node.js >= 16
- pnpm >= 8

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

构建产物（静态网站文件）输出在 `dist/` 目录，可直接部署到任意静态托管平台。

`dist/` 目录包含：

| 文件/目录 | 说明 |
| --- | --- |
| `index.html` | 入口页面 |
| `assets/*.js` / `assets/*.css` | 打包压缩后的 JS / CSS 文件 |
| `manifest.webmanifest` | PWA 清单 |
| `sw.js` / `registerSW.js` / `workbox-*.js` | PWA Service Worker（离线缓存） |
| `*.gz` | gzip 压缩产物 |
| `images/`、`videos/` 等 | 静态资源 |

**部署到静态托管平台（如 Vercel / EdgeOne / GitHub Pages / Nginx）：**

```bash
# 方式一：把 dist 目录上传到托管平台，作为站点根目录
pnpm build
# 然后将 dist/ 内容部署到服务器 / 托管平台

# 方式二：本地预览构建产物（需先运行 pnpm build）
pnpm preview
```

**自定义构建输出目录**（可选，用于多环境）：

```bash
pnpm build --outDir dist-production
# 或
npx vite build --outDir dist-production
```

> **说明**：线上部署时 `dist/` 内的 `%VITE_*%` 环境变量已在构建时注入，无需额外配置。

## 配置说明

项目通过 `VITE_` 开头的环境变量进行配置，**两种方式任选其一**：

- **方式一：`.env` 文件（适合本地开发）**：复制 `.env.example` 为 `.env`，按需修改配置项。
- **方式二：云平台环境变量（适合线上部署）**：在 Vercel / EdgeOne 等平台的控制台添加同名环境变量（**值不要带引号**），配置后需**重新部署**生效。

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
1. **推荐（国内稳定）**：在 [高德开放平台](https://console.amap.com/) 注册 **Web 服务 Key**（免费，每日上限 5000 次），填入 `VITE_WEATHER_KEY`。
2. **免配置**：`VITE_WEATHER_KEY` 留空即可，自动使用 ipinfo.io / ipapi.co 定位 + wttr.in 获取天气，无需申请任何 Key。

**说明：**
- 天气定位精度为**城市级**（按 IP 自动识别当前所在城市）。
- 若 `VITE_WEATHER_KEY` 留空时依赖 ipinfo.io / ipapi.co / wttr.in 外网服务，国内网络环境可能访问受限，建议配置高德 Key 以保证稳定。

## 部署

本项目为纯静态 SPA，可部署到任何静态托管平台：

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Jacky088/homepage)

1. 导入 GitHub 仓库
2. Framework Preset 选择 Vite
3. 自动识别构建命令和输出目录

### Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Jacky088/homepage)

1. 连接 GitHub 仓库
2. Build command: `pnpm build`
3. Build output directory: `dist`

### EdgeOne Pages

[![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?from=github&repository-url=https://github.com/Jacky088/homepage)

构建命令 `pnpm build`，输出目录 `dist`。

### Docker

```bash
docker-compose up -d
```

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
