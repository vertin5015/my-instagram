# Instagram Clone

## 项目介绍

一个基于 Next.js 的完整 Instagram 克隆，覆盖 Feed、探索、通知、个人主页、帖子详情与创建帖子等核心功能。

## 功能特性

- 动态 Feed 流与帖子详情 Modal（拦截路由）
- 点赞、评论、评论点赞、收藏、@提及 与 #标签
- 关注/取关与通知中心
- 探索页：按标签浏览与搜索
- 个人主页：头像、简介、作品、被标记、已收藏
- 创建帖子：多图上传、客户端压缩、裁剪编辑、文案编写

## 技术栈

- 前端框架：Next.js 16（App Router）， TypeScript
- UI 与交互：Tailwind CSS、Radix UI
- 状态管理、登陆验证：Zustand、Json Web Token
- 数据层：Prisma（PostgreSQL）

## 页面结构与演示

- 登陆页面：

![Login](images/image1.png)

- 首页与 Feed：

![Feed](images/image2.png)

- 帖子详情：

![post](images/image3.png)

- 探索页：

![explore](images/image4.png)

- 通知：

![notifications](images/image5.png)

- 个人主页：

![home](images/image6.png)

- 发贴：

![create](images/image7.png)

## 快速开始

1. 安装依赖

```bash
pnpm install
# 或者 npm install / yarn / bun
```

2. 配置环境变量（.env）

```env
# 数据库连接（任选其一）
POSTGRES_URL="postgres://user:password@host:port/dbname?sslmode=verify-full"
DATABASE_URL="postgres://user:password@host:port/dbname"

#JWT设置
JWT_SECRET=XXX
JWT_EXPIRES_IN=XXX
```

3. 生成 Prisma 客户端与迁移数据库

```bash
npx prisma generate
npx prisma migrate dev
```

4. 初始化演示数据

```bash
npx prisma db seed
# 或者直接运行：pnpm exec tsx prisma/seed.ts
```

5. 启动开发服务

```bash
pnpm dev
# 打开 http://localhost:3000
```

## 开发脚本

- 开发：`pnpm dev`
- 构建：`pnpm build`
- 生产启动：`pnpm start`
- 代码检查：`pnpm lint`
- 格式化：`pnpm prettier`
