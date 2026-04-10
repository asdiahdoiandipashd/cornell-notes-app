# 📝 Cornell Notes — 康奈尔笔记法 AI 智能笔记应用

基于 **Expo / React Native** 构建的跨平台康奈尔笔记应用，集成 AI 能力，可自动从笔记内容中提取关键问题/线索并生成摘要总结。

## ✨ 功能特色

### 🎯 经典康奈尔笔记布局
- **左栏 — 关键词/问题区**：记录核心概念、关键术语和思考问题
- **右栏 — 课堂笔记区**：详细记录课堂内容、要点和例子
- **底栏 — 总结/摘要区**：用自己的话概括笔记核心内容

### 🤖 AI 智能分析
- 一键点击「AI 智能提取」，自动生成关键问题和总结摘要
- 支持多家 AI 服务商，灵活切换：
  - **内置 AI**：免费使用，无需配置
  - **OpenAI**：GPT-4o / GPT-4o-mini
  - **DeepSeek**：DeepSeek-V3 / DeepSeek-R1
  - **Kimi（月之暗面）**：Moonshot 系列模型
  - **Claude（Anthropic）**：Claude Sonnet / Haiku
  - **Gemini（Google）**：Gemini 2.0 Flash / Pro
  - **自定义 API**：任何 OpenAI 兼容接口

### 📚 学科管理
- 按学科分类管理笔记（数学、物理、历史等）
- 支持自定义学科，带彩色标签区分
- 按学科筛选笔记列表

### 🌓 深色模式
- 自动跟随系统深/浅色模式
- 为阅读舒适性优化的配色方案

### 📱 其他特性
- 本地数据持久化（AsyncStorage）
- 全文搜索笔记
- 流畅的 React Native 原生体验
- 支持 iOS、Android 和 Web 平台

## 📁 项目结构

```
cornell-notes-app/
├── artifacts/
│   ├── cornell-notes/          # Expo 移动端应用
│   │   ├── app/                # Expo Router 页面路由
│   │   │   ├── (tabs)/         # 底部 Tab 导航
│   │   │   │   ├── index.tsx   # 笔记列表（首页）
│   │   │   │   ├── subjects.tsx # 学科管理
│   │   │   │   └── settings.tsx # AI 设置
│   │   │   ├── note/
│   │   │   │   ├── new.tsx     # 新建笔记
│   │   │   │   └── [id].tsx    # 查看/编辑笔记
│   │   │   └── _layout.tsx     # 根布局
│   │   ├── components/         # 可复用组件
│   │   │   ├── CornellNoteEditor.tsx  # 康奈尔笔记编辑器
│   │   │   └── NoteCard.tsx    # 笔记卡片
│   │   ├── context/            # React Context
│   │   │   ├── NotesContext.tsx # 笔记数据上下文
│   │   │   └── AISettingsContext.tsx # AI 设置上下文
│   │   ├── services/
│   │   │   └── aiService.ts    # AI 服务层（多供应商）
│   │   ├── constants/
│   │   │   └── colors.ts       # 主题颜色定义
│   │   └── hooks/
│   │       └── useColors.ts    # 颜色 Hook
│   └── api-server/             # Node.js Express 后端
│       └── src/routes/ai/      # AI 分析 API 端点
├── lib/                        # 共享工作区库
│   ├── api-spec/               # OpenAPI 规范
│   ├── api-zod/                # Zod 校验模式
│   └── api-client-react/       # 生成的 API 客户端
└── package.json
```

## 🚀 快速开始

### 环境要求
- Node.js >= 20
- pnpm >= 8
- Expo CLI
- （可选）Android Studio / Xcode 用于原生构建

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
# 启动 API 服务器
pnpm --filter @workspace/api-server run dev

# 启动 Expo 开发服务器
pnpm --filter @workspace/cornell-notes run dev
```

然后使用 **Expo Go** 应用扫描终端中的二维码，即可在手机上预览。

## 📦 构建 APK

### 使用 EAS Build（推荐）

1. 安装 EAS CLI 并登录 Expo 账号：

```bash
npm install -g eas-cli
eas login
```

2. 进入应用目录并构建 APK：

```bash
cd artifacts/cornell-notes
eas build --platform android --profile preview
```

构建完成后，EAS 会提供 APK 下载链接。

### 本地构建（需要 Android SDK）

1. 生成 Android 原生项目：

```bash
cd artifacts/cornell-notes
npx expo prebuild --platform android
```

2. 使用 Gradle 构建 APK：

```bash
cd android
./gradlew assembleRelease
```

APK 文件将生成在 `android/app/build/outputs/apk/release/` 目录下。

## ⚙️ AI 配置说明

### 内置 AI（默认）
通过后端 API 服务器代理调用 OpenAI。需要以下环境变量：

```bash
# 后端 API 服务器所需
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1  # OpenAI API 地址
AI_INTEGRATIONS_OPENAI_API_KEY=sk-xxx                       # OpenAI API 密钥

# Expo 应用所需（连接后端）
EXPO_PUBLIC_DOMAIN=your-server-domain.com                   # API 服务器域名
```

> 在 Replit 平台上运行时，以上环境变量会自动配置，无需手动设置。
> 独立部署时需自行配置这些环境变量。

### 第三方 AI 服务商
在应用「设置」页面中：
1. 选择 AI 服务商
2. 输入对应的 API Key
3. 可选：自定义 Base URL 和模型名称
4. API Key 仅存储在设备本地，不会上传到服务器

| 服务商 | 默认模型 | 获取 API Key |
|-------|---------|-------------|
| OpenAI | gpt-4o-mini | [platform.openai.com](https://platform.openai.com) |
| DeepSeek | deepseek-chat | [platform.deepseek.com](https://platform.deepseek.com) |
| Kimi | moonshot-v1-8k | [platform.moonshot.cn](https://platform.moonshot.cn) |
| Claude | claude-sonnet-4-20250514 | [console.anthropic.com](https://console.anthropic.com) |
| Gemini | gemini-2.0-flash | [ai.google.dev](https://ai.google.dev) |

## 🛠️ 技术栈

- **前端框架**：React Native 0.81 + Expo SDK 54
- **路由导航**：Expo Router (文件系统路由)
- **状态管理**：React Context + AsyncStorage
- **UI 组件**：自定义组件 + @expo/vector-icons
- **AI 集成**：多供应商 SDK / OpenAI 兼容 API
- **后端服务**：Express.js + OpenAI Proxy
- **类型检查**：TypeScript 5.9
- **包管理**：pnpm Workspace (monorepo)
- **数据校验**：Zod

## 📄 开源协议

MIT License
