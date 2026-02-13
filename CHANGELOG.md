# Changelog

本文档记录项目的重大变更。

---

## [v0.4.0] - 2026-02-13

### 🧠 模型切换 & 思考过程

- **双模型切换**：⚡ 快速（`deepseek-chat`）/ 🧠 深度思考（`deepseek-reasoner`）
- **思考过程展示**：推理模型的思维链实时流式显示，默认展开，可折叠收起
- **SSE 协议**：API 层改用 Server-Sent Events，区分 `reasoning` / `content` 双流
- **上下文安全**：多轮对话自动剥离 `reasoning_content`，避免 API 400 错误

---

## [v0.3.0] - 2026-02-13

### 🔐 认证 & 数据层

- **Google OAuth 登录**：通过 Supabase Auth 接入 Google 登录，含 `/login` 页面 + middleware 路由守卫
- **Supabase 数据库**：对话数据从 `localStorage` 迁移到 Supabase PostgreSQL，RLS 策略确保数据隔离
- **自动建表**：`/api/setup` 检测并创建 `chats` 表 + 索引 + RLS 策略
- **用户界面**：侧边栏显示用户头像/邮箱，支持登出跳转

### 📦 依赖变更

- ➕ `@supabase/supabase-js`、`@supabase/ssr`
- ➖ `firebase`（已删除 `firebase.ts`）

---

## [v0.2.0] - 2026-02-12 ~ 2026-02-13

### 🏗️ 架构重构

- **前端组件化**：将 500+ 行的 `page.tsx` 拆解为 `Sidebar`、`ChatWindow`、`ChatInput` 三个独立组件
- **逻辑抽离**：创建 `useChat` Hook，统一管理对话状态、消息收发、数据持久化
- **API 安全修复**：`lib/api.ts` 从直接在浏览器调用 DeepSeek（暴露 API Key）改为通过 `/api/chat` 服务端路由中转
- **流式响应恢复**：服务端 `route.ts` 使用 `ReadableStream` 实现流式输出

### 🎨 UI 重写

- 全新设计系统：CSS Variables + 自定义配色方案（支持暗色模式）
- 气泡式消息布局，打字机动画效果
- 深色侧边栏 + 对话历史管理
- 移除 `@heroicons/react`，改用内联 SVG，First Load JS 从 530kB → 147kB

### 🔧 工程化

- 移除 Firebase Auth 依赖，切换为 `localStorage` 本地存储（便于开发调试）
- 修复 `.env.local` 变量名大小写问题（`DeepSeek_API_KEY` → `DEEPSEEK_API_KEY`）
- 删除遗留代码：`MarkdownContent.tsx`、`StatusIndicator.tsx`、`Auth.tsx`
- 修复重复 key bug（`userMessage` 被添加两次）

### 📦 依赖变更

- ➕ `react-markdown`、`remark-gfm`（Markdown 渲染）
- ➖ `@heroicons/react`（改用内联 SVG）
- 保留 `firebase`（暂未启用，后续需要时可快速接入）

---

## [v0.1.0] - 初始版本

- 基于 Next.js 15 创建项目
- DeepSeek Chat API 集成
- Firebase Auth 登录
- Firestore 对话存储
- 基础聊天 UI

---

# Roadmap

以下是后续计划优化的方向，按优先级排列。

## P0 — 核心功能

- [ ] **对话上下文管理**：优化上下文窗口策略（当前硬截断最近 10 条）
- [ ] **错误重试机制**：网络失败 / API 超时时自动重试
- [ ] **消息编辑 & 重新生成**：允许用户编辑已发送的消息并重新获取回复

## P1 — 用户体验

- [ ] **代码高亮**：为 Markdown 代码块添加语法高亮（轻量方案）
- [ ] **移动端适配**：优化触屏交互和小屏布局
- [ ] **快捷键支持**：`Ctrl+N` 新建对话，`Ctrl+/` 聚焦输入框等
- [ ] **对话搜索**：在侧边栏支持搜索历史对话

## P2 — 基础设施

- [x] **认证系统**：Google OAuth 登录（via Supabase Auth）✅ v0.3.0
- [x] **云端存储**：Supabase PostgreSQL + RLS ✅ v0.3.0
- [ ] **部署**：配置 Vercel 部署，添加 CI/CD

## P3 — 高级功能

- [x] **DeepSeek 模型切换**：快速 / 深度思考模式 ✅ v0.4.0
- [ ] **更多模型**：GPT / Claude 等第三方模型接入
- [ ] **文件上传**：支持上传图片和文档进行分析
- [ ] **对话导出**：支持导出为 Markdown / PDF
