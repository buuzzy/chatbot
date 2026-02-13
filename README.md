# Chatbot — AI 对话助手

基于 Next.js + DeepSeek API 构建的 AI 聊天机器人。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS + CSS Variables |
| AI 模型 | DeepSeek Chat (通过 OpenAI SDK) |
| 数据存储 | localStorage（本地开发阶段） |

## 项目结构

```
src/
├── app/
│   ├── api/chat/route.ts    # 服务端 API 路由（流式响应）
│   ├── globals.css          # 全局样式 + 设计系统
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 主页面（布局容器）
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx   # 消息展示区
│   │   └── ChatInput.tsx    # 输入框
│   └── layout/
│       └── Sidebar.tsx      # 侧边栏（对话历史）
├── hooks/
│   └── useChat.ts           # 核心逻辑 Hook
├── lib/
│   ├── api.ts               # API 客户端（调用 /api/chat）
│   └── firebase.ts          # Firebase 配置（暂未启用）
└── types/
    └── chat.ts              # 类型定义
```

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 DeepSeek API Key

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API 密钥 |

## 架构说明

- **API 安全**：API Key 仅在服务端 (`route.ts`) 使用，前端通过 `fetch('/api/chat')` 间接调用
- **流式响应**：服务端使用 `ReadableStream` 实现打字机效果
- **状态管理**：`useChat` Hook 统一管理认证、对话 CRUD、消息收发
- **数据持久化**：当前使用 `localStorage`，后续将接入 Firebase/Supabase
