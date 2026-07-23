# 木木的主页

一个简洁、美观的个人主页，基于 Vue 3 + Vite 构建。

## 主页预览

![主页预览](https://raw.githubusercontent.com/Jacky088/homepage/main/screenshots/main.jpg)

## 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Jacky088/homepage)
[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Jacky088/homepage)
[![Deploy with EdgeOne Pages](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?from=github&repository-url=https://github.com/Jacky088/homepage)

## 功能特性

- 响应式布局，适配 PC 和移动端
- 动态视频 / 图片壁纸背景，支持切换
- 一言（Hitokoto）随机句子展示
- 网站快捷链接导航
- 社交链接展示
- PWA 支持，可安装为桌面应用
- 星空渐变加载动画
- Content Security Policy 安全策略

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

### 构建生产版本

```bash
pnpm build
```

构建产物输出在 `dist/` 目录。

## 配置说明

复制 `.env.example` 为 `.env`，按需修改配置项：

| 变量名 | 说明 | 示例 |
| --- | --- | --- |
| VITE_SITE_NAME | 站点名称 | 木木的主页 |
| VITE_SITE_AUTHOR | 作者名 | 木木 |
| VITE_SITE_URL | 站点域名 | huzz.cn |
| VITE_SITE_LOGO | 站点图标路径 | /images/icon/favicon.ico |
| VITE_SITE_MAIN_LOGO | 主页 Logo 图片 | /images/icon/logo.png |
| VITE_SITE_START | 建站日期 | 2024 |
| VITE_SITE_ICP | ICP 备案号（可选） | 苏ICP备xxxxx号 |

### 自定义链接

- 网站链接：编辑 `src/assets/siteLinks.json`
- 社交链接：编辑 `src/assets/socialLinks.json`

## 部署

本项目为纯静态 SPA，可部署到任何静态托管平台：

### Vercel

1. 导入 GitHub 仓库
2. Framework Preset 选择 Vite
3. 自动识别构建命令和输出目录

### Cloudflare Pages

1. 连接 GitHub 仓库
2. Build command: `pnpm build`
3. Build output directory: `dist`

### EdgeOne Pages

同上，构建命令 `pnpm build`，输出目录 `dist`。

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

## 致谢

本项目基于 [imsyy/home](https://github.com/imsyy/home) 二次开发。

## 许可证

[MIT License](./LICENSE)
