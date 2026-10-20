# Homepage主页

一个简洁、美观的个人主页，基于 Vue 3 + Vite 构建。

## 主页预览

![主页预览](https://raw.githubusercontent.com/Jacky088/homepage/main/screenshots/main.jpg)

## 功能特性

- 响应式布局，适配 PC 和移动端
- 动态视频 / 图片壁纸背景，支持切换
- 一言（Hitokoto）随机句子展示
- 时光胶囊彩蛋
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
- **托管平台**：在平台控制台添加环境变量，或把 `.env` 提交进仓库（**切勿在其中存放密钥**）。

> **优先级提示**：若同一个变量在 `.env` 文件和云平台控制台**都配置了值**，以 **云平台环境变量** 为准。
>
> **构建防卫**：`pnpm build` 开始前会校验 10 个必需变量（站点信息 8 个，加 `VITE_SONG_SERVER`、`VITE_SONG_TYPE`），任一为空即中止构建，并打印缺失清单与修复步骤；`VITE_SONG_API`、`VITE_UAPI_BASE`、`VITE_SONG_ID`、`VITE_SITE_START`、`VITE_SITE_ICP`、`VITE_WEATHER_KEY`、`VITE_AMAP_BASE` 允许留空（前两个留空时分别使用内置备用音乐接口和默认路径 `/uapi`），`pnpm dev` 遇到同样问题只打印警告、不阻断启动。
>
> 各平台取变量的方式不同：**CI 与 Docker** 会先 `cp .env.example .env` 再构建；**Vercel / Cloudflare Pages / EdgeOne** 不读仓库里的 `.env`（已被 `.gitignore` 忽略），所需的 `VITE_` 变量必须配在平台的环境变量里，否则构建会按上面的防卫规则中止。

| 变量名 | 说明 | 示例 |
| --- | --- | --- |
| VITE_SITE_NAME | 站点名称 | xx的主页 |
| VITE_SITE_AUTHOR | 作者名 | xx |
| VITE_SITE_KEYWORDS | 站点关键词 | xx,个人主页 |
| VITE_SITE_DES | 站点简介 | 一个示例站点 |
| VITE_SITE_URL | 站点域名 | example.com |
| VITE_SITE_LOGO | 站点图标路径 | /images/icon/favicon.ico |
| VITE_SITE_MAIN_LOGO | 主页 Logo 图片 | /images/icon/logo.png |
| VITE_SITE_APPLE_LOGO | Apple 端图标路径 | /images/icon/apple-touch-icon.png |
| VITE_SITE_GITHUB | 源码仓库地址（更多设置面板的 GitHub 按钮，可选） | `https://github.com/xx/xx` |
| VITE_SITE_START | 建站日期 | 20XX |
| VITE_SITE_ICP | ICP 备案号（可选） | xICP备xxxxx号 |
| VITE_SONG_API | 自定义音乐 API（可选）。留空用内置备用接口；填 `/api/song` 则走同源代理，见下方「音乐播放器」 | `https://example.com/api` |
| VITE_SONG_SERVER | 音乐服务商 | netease / tencent |
| VITE_SONG_TYPE | 播放类型 | playlist |
| VITE_SONG_ID | 歌单 ID（留空则隐藏播放器） | xxxxxxx |
| VITE_SONG_API_PROXY | 本地开发时 `/api/song` 的上游地址（可选，只写在本地 `.env`） | `https://example.com/api` |
| SONG_API_UPSTREAM | **服务端**变量，Vercel / EdgeOne Pages 上 `/api/song` 的上游地址（**不要**加 `VITE_` 前缀） | `https://example.com/api` |
| VITE_WEATHER_KEY | 高德 Web 服务 Key（可选，作为降级源） | xxxxxxxx |
| VITE_AMAP_BASE | 高德 API 代理地址（可选，留空直连官方） | https://example.com/amap |
| VITE_UAPI_BASE | 天气代理路径（前端使用，默认 `/uapi`） | /uapi |
| UAPI_KEY | uapis 天气 API Key（**服务端**变量，**不要加 `VITE_` 前缀**） | uapi-xxxxxxxx |

### 自定义链接

- 网站链接：编辑 `src/assets/siteLinks.json`，模板见 `src/assets/siteLinks.example.json`
  - 字段：`icon` 图标名、`name` 显示名称、`link` 跳转地址（仅接受 `http`/`https`）
  - 新增图标需在 `src/components/Links.vue` 里引入并加进 `siteIcon`
  - 数组为空时，顶栏导航整条隐藏
- 社交链接：编辑 `src/assets/socialLinks.json`，模板见 `src/assets/socialLinks.example.json`
  - 字段：`name` 名称、`icon` 图片路径（放在 `public/images/icon/` 下）、`tip` 悬停提示、`url` 跳转地址（支持 `mailto:`）

### 音乐播放器

音乐播放器基于 APlayer，歌单数据由 Meting 协议的接口提供。**所有音乐相关变量都可以不配**——留空时播放器直接使用内置备用接口，开箱即用。

**配置步骤：**

1. 设置 `VITE_SONG_SERVER`（`netease` 网易云 / `tencent` QQ 音乐）
2. 设置 `VITE_SONG_TYPE`（`song` / `playlist` / `album` / `search` / `artist`）
3. 设置 `VITE_SONG_ID`（歌单 ID，可从歌单 URL 中获取）；留空则隐藏播放器
4. （可选）`VITE_SONG_API`：留空即用内置备用接口；想用自己的接口见下文（自建服务可参考 [Meting-API](https://github.com/xizeyoupan/Meting-API#deno-deploy)）

**接口取数顺序与自动降级：**

| 顺序 | 接口 | 说明 |
| --- | --- | --- |
| 1 | `VITE_SONG_API` | 自定义接口。留空则直接使用第 2 级 |
| 2 | `https://api.injahow.cn/meting/` | 内置备用接口，写死在 `src/api/index.js`（末尾斜杠必带） |

命中以下任一情况即降级到下一级：请求超时（8 秒）、网络错误或被 CSP 拦截、非 2xx、返回为空或格式不合规、首曲 URL 为空、QQ 音乐 JSONP 地址不在白名单内。两级都不可用时，播放器提示「播放器加载失败」并禁用入口，降级原因可在浏览器控制台的 `[music]` 日志里看到。

**自定义接口的两种接法：**

| 接法 | 前端 `VITE_SONG_API` | 上游地址写在哪 | 是否要改 CSP |
| --- | --- | --- | --- |
| 公开接口 | `https://你的接口地址/api` | 仓库里（等于公开） | 要，需在 `index.html` 的 `connect-src` 放行该域名 |
| 私人接口 | `/api/song` | 服务端环境变量，不进仓库 | 不用，同源请求走 CSP 的 `'self'`（歌单与歌词自动走代理） |

私人接口按平台配置（改完记得**重新部署**，环境变量变更不会自动触发构建）：

| 平台 | 服务端变量 | 前端变量 |
| --- | --- | --- |
| 本地开发 | `.env` 中 `VITE_SONG_API_PROXY = "https://你的接口地址/api"` | `VITE_SONG_API = "/api/song"`，走 dev server 同源代理 |
| Vercel | 环境变量 `SONG_API_UPSTREAM`（**不要**加 `VITE_` 前缀，它不会进前端产物） | `VITE_SONG_API = "/api/song"`，走 `api/song.js` |
| Cloudflare Pages / EdgeOne Pages | 环境变量 `SONG_API_UPSTREAM`（**不要**加 `VITE_` 前缀） | `VITE_SONG_API = "/api/song"`，走 `functions/api/song.js` |

两份代理函数逻辑一致，都只转发 `server` / `type` / `id` 三个参数并做白名单校验（平台限 `netease|tencent`、类型限 `song|playlist|album|search|artist|lrc` 支持歌单与歌词、ID 限 `[A-Za-z0-9_-]{1,64}`），防止被当成开放代理去刷你的私人接口；未配置上游或上游超时会返回 5xx，由前端的降级逻辑接管，播放器不会因此报错。前端在解析接口返回时，会自动将歌词地址规范化为同源代理路径或 HTTPS，避免被浏览器 CSP 拦截或发生跨域错误。

> ⚠️ **函数目录按平台各放一份，互不通用**：Vercel 只认根目录的 `api/`，EdgeOne Pages 只认 `functions/`（文件即路由）。只带其中一份部署到另一个平台时，`/api/song` 没有处理器，请求会回落到静态资源并返回 `index.html`，前端解析 JSON 失败——控制台 `[music]` 日志里会明确提示「返回的不是 JSON，检查一下 /api/song 这个路径在当前平台是否生效」。

**其他：**

- QQ 音乐歌单建议不超过 50 首
- 在 Vercel / Cloudflare Pages 等平台改了环境变量后，必须手动触发一次重新部署，新值才会打进前端产物

### 天气显示

顶栏右上角会展示当前城市及天气状况，点击可展开查看天气详情。

**数据来源（三级降级链）：**

| 顺序 | 数据源 | 说明 |
| --- | --- | --- |
| 1 | [uapis 天气](https://uapis.cn/docs/api-reference/get-misc-weather) | **主源**。前端不传城市，由代理按**访客真实 IP** 定位城市后再取天气，国内 CDN 直连稳定 |
| 2 | 高德天气 | 降级源。仅当配置了 `VITE_WEATHER_KEY` / `VITE_AMAP_BASE` 时参与 |
| 3 | ipinfo.io / ipapi.co + wttr.in | 最终兜底。境外免费服务，国内网络可能不可达 |

任一环节失败会自动降级到下一源，全部失败时右上角显示「天气获取失败」，点击可重试。

**API Key 不会进入前端产物：**

天气请求统一发往同域路径 `{VITE_UAPI_BASE}/weather`（默认 `/uapi/weather`），`X-API-Key` 由服务端注入：

| 环境 | 谁注入 Key | 在哪里配置 |
| --- | --- | --- |
| 本地开发（`pnpm dev`） | Vite dev server 代理 | `.env` 中的 `UAPI_KEY` |
| Vercel 部署 | `api/weather.js`（Serverless Function） | 项目 Settings → Environment Variables 中的 `UAPI_KEY` |
| Cloudflare Pages / EdgeOne Pages 部署 | `functions/uapi/weather.js`（边缘函数） | 项目设置 → 环境变量中的 `UAPI_KEY` |
| 自有服务器 / Docker | 需自行反代 | 见下方「其他部署方式」 |

`UAPI_KEY` 没有 `VITE_` 前缀，因此**不会被打进前端 JS**。

**服务端为什么要多做一步 IP 反查：**

uapis 的「不传城市时按 IP 自动定位」依据的是**请求来源 IP**。请求经 Serverless 函数 / 反向代理转发后，来源 IP 变成了机房 IP（实测 Vercel 机房 IP 会直接返回 `LOCATION_NOT_FOUND`，前端表现就是「天气定位失败」）。所以 `api/weather.js` 会先从 `x-forwarded-for` 取出**访客真实 IP**，再用 uapis 的 `/api/v1/network/ipinfo` 反查出中文城市名，最后带着 `city` 去查天气。

> ⚠️ 不要改用 Vercel 的 `x-vercel-ip-city` 请求头，它给的是英文城市名，而 uapis 对英文名匹配不可靠（实测 `Wuxi` 命中「重庆巫溪县」、`Suzhou` 命中「安徽宿州市」），会静默返回**错误城市**的天气。

**其他部署方式：**
- **Cloudflare Pages / EdgeOne Pages**：函数源码放在 `functions/` 目录（文件即路由），仓库已内置 `functions/uapi/weather.js`，对应 `/uapi/weather`，前端无需改任何配置；只需在平台控制台环境变量中配好 `UAPI_KEY` 即可。
- **Cloudflare Worker**：可参照 `worker/amap-proxy.js` 的结构实现同协议的 `/weather` 接口（同样需要按访客 IP 反查城市），再配置 `VITE_UAPI_BASE`；跨域时记得同步放行 `index.html` 中的 CSP `connect-src`。

> ⚠️ **各平台的配置互不通用**：Vercel 依赖 `api/` + `vercel.json`（路由重写），EdgeOne Pages 原生识别 `functions/` 目录（文件即路由，无需额外配置文件）。只带其中一份配置部署到另一个平台时，`/uapi/weather` 和 `/api/song` 都没有任何处理器，请求会落到静态资源：天气直接失败，播放器则退回内置备用接口。两份函数在仓库里都已内置，不要删掉自己用不到的那份。

**说明：**
- 天气定位精度为**城市级**（按 IP 自动识别当前所在城市）。
- 在 [uapis.cn](https://uapis.cn/) 注册可获取 API Key；不配置也能用，但走的是全网共享的匿名游客额度（1500 credits / 30 天），容易被他人耗尽。
- **可选**：在 [高德开放平台](https://console.amap.com/) 注册 **Web 服务 Key** 填入 `VITE_WEATHER_KEY` 作为降级源。
- 缓存策略：调用方显式传 `city` 时响应带 `s-maxage=300`，走 CDN 共享缓存降低额度消耗；由访客 IP 解析出的城市因人而异，仅返回 `private, max-age=60`，避免把 A 城市的天气发给 B 城市的访客。
- 示例函数 `api/weather.js` 支持可选的 `ALLOWED_ORIGIN` 环境变量（逗号分隔），配置后仅允许指定来源调用，防止函数被他人当作免费接口盗刷。

## 部署

本项目为纯静态 SPA + 一个可选的天气代理函数，支持三种部署方式，按需选择：

| 方式 | 适合场景 | 配置方式 | 天气 Key |
| --- | --- | --- | --- |
| 托管平台（Vercel / Cloudflare Pages / EdgeOne） | 推荐，自动构建与 HTTPS | 平台控制台配置环境变量（首选）或提交 `.env` | Vercel（`api/`）、Cloudflare Pages 与 EdgeOne（`functions/`）均可直接由内置函数注入 |
| 静态文件构建 | 自有服务器 / 任意静态托管 | 本地配置 `.env` 后构建，上传 `dist/` | 需自备代理 |
| Docker | 自有服务器，容器化运行 | 本地配置 `.env` 后构建镜像 | 需在 nginx 中反代 |

> **⚠️ 重要**：`.env` 不在 Git 仓库中，托管平台的构建环境默认**没有任何 `VITE_*` 变量**。不先配置变量会导致构建失败，变量说明见 [配置说明](#配置说明)。

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

**天气 Key 在 Cloudflare Pages / EdgeOne Pages 上的配置：**

Cloudflare Pages 与 EdgeOne Pages 均原生支持 `/functions` 目录（Pages Functions，文件即路由），仓库已内置 `functions/uapi/weather.js` → 路由 `/uapi/weather`，与前端默认配置一致。因此只需要：

1. 在平台项目设置（Settings → Environment Variables）中添加 `UAPI_KEY`（**不要加 `VITE_` 前缀**）；
2. 可选：添加 `ALLOWED_ORIGIN = https://你的域名`；
3. 无需配置 `VITE_UAPI_BASE`（前端默认走 `/uapi`），推送或构建后重新部署即可。

> Vercel 依赖 `api/` + `vercel.json`，而 Cloudflare Pages 和 EdgeOne Pages 原生依赖 `functions/` 目录。仓库已同时内置两份边缘函数，两类平台均可开箱即用。
>
> 平台控制台的变量优先级高于 `.env` 文件；仓库根目录已配置 `.node-version`（22），Cloudflare Pages 与 Vercel 均会自动选用 Node 22+。

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

> **⚠️ 天气代理**：镜像里只有静态产物，没有 Serverless Function，因此 `/uapi/weather` 需要在 `nginx.conf` 中自行反代到 `https://uapis.cn/api/v1/misc/weather` 并注入 `X-API-Key` 请求头。未反代时天气主源不可用，会逐级降级到高德 / 境外接口，可能显示「天气获取失败」。

### Cloudflare Worker（高德 API 代理，可选）

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Jacky088/homepage)

使用高德天气 Key 且不想将其暴露在前端产物中时，可部署代理 Worker。

1. 在 Worker 的 Settings → Variables 中添加 `AMAP_KEY`（高德 Web 服务 Key），可选配 `ALLOWED_ORIGIN` 限制调用来源；
2. 为 Worker 绑定路由或自定义域（如 `https://你的域名/amap/*`）；
3. 在前端项目的环境变量中设置 `VITE_AMAP_BASE` 指向该 Worker 地址，重新部署。

不使用高德代理时 `VITE_AMAP_BASE` 留空即可。高德只是 uapis 主源失败后的降级源，不配置也能正常显示天气。

## 项目结构

```
api/
├── song.js         # 歌单代理函数（Vercel Serverless Function，路由 /api/song）
└── weather.js      # 天气代理函数（Vercel Serverless Function，服务端注入 API Key）
functions/
├── api/
│   └── song.js     # 歌单代理函数（Cloudflare Pages / EdgeOne Pages 边缘函数，路由 /api/song）
└── uapi/
    └── weather.js  # 天气代理函数（Cloudflare Pages / EdgeOne Pages 边缘函数，路由 /uapi/weather）
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
