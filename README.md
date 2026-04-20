# PhotoMood

<p align="center">
  <img src="./public/android-chrome-192x192.png" alt="PhotoMood icon"/>
</p>

PhotoMood 是一个纯前端、零后端依赖的照片边框与信息排版工具。  
上传照片后，应用会在浏览器内完成 EXIF 解析、主题色提取、模板排版与导出，帮助你快速生成适合分享的成片。

- 在线体验友好，支持安装为 PWA
- 不上传图片到服务器，主要处理都在本地完成
- 兼顾桌面端和移动端，适合边看边调边导出

GitHub: [flwfdd/PhotoMood](https://github.com/flwfdd/PhotoMood)

## 项目介绍

PhotoMood 的核心目标，是把“照片边框 + 拍摄信息 + 风格模板”这件事做得足够轻、足够快，也足够可调。

和传统需要后端处理或复杂图像软件的方案不同，PhotoMood 直接在浏览器中完成：

1. 读取图片与 EXIF 信息
2. 提取照片主色与调色板
3. 套用内置模板或用户模板
4. 调整构图、文字、颜色、导出格式
5. 导出为适合分享的成图

整个项目定位为一个可以静态部署的前端应用，适合部署到 GitHub Pages、Vercel、Cloudflare Pages 等平台。

## 功能亮点

### 1. 纯前端本地处理

- 图片解析、EXIF 提取、主题色计算、模板渲染全部在浏览器内完成
- 无需上传原图到服务端，更轻量，也更适合隐私敏感场景
- 可直接作为静态站点部署

### 2. 自动读取 EXIF 信息

- 支持提取拍摄时间、相机品牌、机型、焦段、光圈、快门、ISO、GPS 等信息
- 变量可直接插入模板文字中，例如 `{{date}}`、`{{model}}`、`{{locationName}}`
- 导入模板、编辑模板时都可以复用同一套变量系统

### 3. 自动生成边框与配色

- 根据照片自动提取主色和调色板
- 可将边框颜色绑定到自动调色板，也可手动固定颜色
- 支持不同模板下的留白、圆角、画幅比例与背景风格

### 4. 模板系统可扩展

- 内置多个模板，如拍立得、极简、ColorWalk、Dark Pro 等
- 支持保存当前模板、另存为模板、导入模板、分享模板链接
- 模板是结构化 JSON，便于维护、复用和扩展

### 5. 文字编辑能力完整

- 支持字体、字号、字重、字间距、行高、对齐方式、位置调整
- 文本变量和普通文本可混排
- 支持中英文字体与多种风格字体

### 6. 导出体验针对平台做了适配

- 桌面端直接下载
- iOS Safari 本地环境下提供应用内预览，长按即可保存
- 支持 `JPG / PNG / WebP` 导出
- 支持质量调节与预估大小显示

### 7. 移动端与 PWA 友好

- 支持响应式布局
- 可安装到主屏幕，作为 PWA 使用
- 空状态页会根据平台给出安装指引

## 技术栈

- React 19
- TypeScript
- Vite
- react-konva / Konva
- Framer Motion
- exifr
- ColorThief
- i18next / react-i18next
- vite-plugin-pwa

## 开发指南

### 环境要求

- Node.js 18+
- npm 9+ 或更高版本

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

默认会启动本地开发服务器，适合桌面浏览器调试。  
如果需要在手机上联调，可使用局域网地址访问。

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/`。

### 本地预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

### 项目结构

```text
src/
├── components/
│   ├── canvas/      # 画布渲染、导出逻辑
│   ├── common/      # 上传区、通用组件
│   ├── editors/     # 模板、构图、文字、导出等编辑面板
│   └── layout/      # Header、Sidebar、移动端工具栏
├── context/         # 编辑器状态管理
├── hooks/           # 上传、EXIF、取色等 hooks
├── lib/             # 模板解析、分享、字体加载等工具
├── styles/          # 全局样式
├── templates/       # 内置模板定义
└── types/           # 类型声明
```

### 关键开发说明

- 模板定义位于 `src/templates/`
- 模板变量解析位于 `src/lib/template-parser.ts`
- EXIF 提取逻辑位于 `src/hooks/useExifData.ts`
- 主题色提取逻辑位于 `src/hooks/useColorPalette.ts`
- 导出逻辑位于 `src/components/canvas/CanvasExporter.ts`

### 部署建议

本项目是标准静态前端应用，可直接部署到：

- GitHub Pages
- Vercel
- Cloudflare Pages
- Netlify

如需更好的移动端体验，建议用户安装为 PWA 使用。
