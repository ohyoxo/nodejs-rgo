# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package.json
COPY package*.json ./

# 使用 npm install
RUN npm install --production

# 复制源代码
COPY . .

# 生产阶段
FROM node:18-alpine

# 安装必要的系统依赖
RUN apk update && apk upgrade && \
    apk add --no-cache openssl curl gcompat iproute2 coreutils bash && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# 从构建阶段复制文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/index.js ./
COPY --from=builder /app/package.json ./

# 设置权限
RUN chmod +x index.js

EXPOSE 3000

CMD ["node", "index.js"]
