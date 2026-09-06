# 构建应用
FROM node:20-alpine AS builder
WORKDIR /app

# 启用 corepack 内置 pnpm（版本由 package.json 的 packageManager 字段固定），
# 按锁文件精确安装，保证构建可复现
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN [ ! -e ".env" ] && cp .env.example .env || true
RUN pnpm run build

# 最小化运行镜像
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 12445

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:12445/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
