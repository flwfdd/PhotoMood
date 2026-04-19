---

# Photo Mood

> **版本**: v1.0
> **日期**: 2026-04-18
> **定位**: 纯前端图片边框与 EXIF 信息展示工具
> **目标用户**: 摄影爱好者、社交媒体发布者
> **一句话描述**: 上传照片，自动提取主题色生成边框，在边框区域优雅展示拍摄信息，用户可自由调整后导出。

---

## 1. 产品概述

### 1.1 核心价值

Photo Mood 是一个零服务器依赖的纯前端 PWA 小工具。用户上传一张照片后，系统自动完成三件事：

1. **提取主题色** → 生成与照片色调匹配的边框背景色
2. **读取 EXIF 元数据** → 解析拍摄时间、地点、相机参数等信息
3. **套用模板** → 将图片和信息按预设模板排版，生成带边框的成品图

用户可以在默认结果上进行微调（切换模板、修改文字、调整颜色、裁切图片），满意后导出保存。

### 1.2 设计理念

视觉风格采用 **Warm Minimalism（暖极简主义）**，参考 Anthropic/Claude 品牌设计语言：

- 暖白背景（`#F4F3EE`），不使用纯白
- 深褐文字（`#2D2B2A`），不使用纯黑
- 赤陶色强调（`#C15F3C`），不使用科技蓝
- 大圆角（12–16px）、柔和阴影、极致留白
- 动效缓慢优雅（300ms ease-out，幅度 2–4px）

### 1.3 项目约束

| 约束 | 说明 |
|---|---|
| 零服务器 | 所有计算在浏览器完成，不依赖任何后端 API |
| 纯前端 | 可打包为静态文件，部署到任意静态托管平台 |
| PWA | 支持安装到桌面/主屏幕，离线可用 |
| 国际化 | 从第一行代码开始内置 i18n，首期支持中文 + 英文 |
| 响应式 | 同一套 UI，自适应桌面端和移动端 |

---

## 2. 技术架构

### 2.1 技术栈总览

```
┌───────────────────────────────────────────────────────────┐
│                        Photo Mood                         │
├───────────────────────────────────────────────────────────┤
│  框架层     PNPM + React 18 + TypeScript + Vite            │
│  Canvas层   Konva.js + react-konva                        │
│  样式层     Tailwind CSS v4                                │
│  组件层     shadcn/ui（按需复制 8 个组件）+ Radix Primitives  │
│  动效层     Framer Motion                                  │
│  EXIF层     exifr                                          │
│  取色层     colorthief                                      │
│  裁切层     Cropper.js（在 Drawer 中使用）                   │
│  国际化     react-i18next + i18next                         │
│  图标       Lucide Icons                                    │
│  字体       Google Fonts (Instrument Sans / Serif /          │
│             JetBrains Mono)                                 │
│  PWA        vite-plugin-pwa (Workbox)                       │
├───────────────────────────────────────────────────────────┤
│  构建产物   Vite build → 静态文件                            │
│  部署       GitHub Pages / Vercel / Cloudflare Pages        │
│  预估体积   ~200–210 KB gzip（全部依赖）                     │
└───────────────────────────────────────────────────────────┘
```

### 2.2 各依赖说明与选型理由

| 依赖 | 版本 | 体积 (gzip) | 选型理由 |
|---|---|---|---|
| **React 18** | ^18.3 | ~42 KB | 生态最大，shadcn/react-konva 均为 React 优先 |
| **Konva.js + react-konva** | ^9.x / ^18.x | ~70 KB | 声明式 JSX 渲染与 React 状态天然融合；模板系统 = JSON → React 组件映射；移动端原生 touch 支持优于 Fabric.js；Agent 编码友好（声明式比命令式出错率低）|
| **Tailwind CSS v4** | ^4.x | 0 (构建时) | 原子化 CSS，响应式断点自适应，配合 CSS 变量实现 Warm Minimalism 主题 |
| **shadcn/ui** | latest | ~20 KB (用到的) | 按需复制组件（非 npm 安装）：Dialog、Drawer、Select、Popover、Slider、Switch、Sonner、Button。底层 Radix 提供焦点管理/键盘导航/ARIA 无障碍 |
| **Framer Motion** | ^11.x | ~30 KB | React 动画标准库，`layoutAnimation` 用于模板切换的平滑过渡 |
| **exifr** | ^7.x | ~3–15 KB | 最快最全的 EXIF 解析库，支持 HEIC/AVIF，可 tree-shake，GPS 直出经纬度 |
| **colorthief** | ^3.x | ~6 KB | MMCQ 量化算法，输出主色 + 调色板 + `isDark`/`textColor`，直接决定文字颜色 |
| **Cropper.js** | ^2.x | ~15 KB | 专业裁切库，原生 touch 支持，在 Drawer 面板中独立使用，与 Konva Canvas 职责分离 |
| **react-i18next** | ^15.x | ~15 KB | 生态最大的 React i18n 方案，支持 namespace 懒加载 |
| **Lucide Icons** | latest | ~5 KB (tree-shake) | 线性图标、1.5px 描边、圆角端点，契合 Warm Minimalism |
| **vite-plugin-pwa** | ^0.20 | ~2 KB (SW runtime) | Workbox 封装，自动生成 Service Worker 和 manifest |

### 2.3 项目目录结构

仅供参考，实际项目中可能根据需求调整。

```
photo-mood/
├── public/
├── src/
│   ├── main.tsx               # 入口
│   ├── App.tsx                # 根组件 + 路由（如有）
│   ├── i18n.ts                # i18n 初始化配置
│   ├── components/
│   │   ├── ui/                # shadcn 组件（按需复制）
│   │   ├── layout/            # 布局组件
│   │   │   ├── Header.tsx
│   │   ├── canvas/            # Konva Canvas 相关
│   │   │   ├── CanvasPreview.tsx     # 主画布预览
│   │   │   ├── FrameRect.tsx         # 边框矩形组件
│   │   │   ├── PhotoImage.tsx        # 图片组件
│   │   │   ├── TextElement.tsx       # 文字组件（可拖拽）
│   │   │   └── CanvasExporter.tsx    # 导出逻辑
│   │   ├── editors/           # 编辑面板
│   │   │   ├── TemplateSelector.tsx  # 模板选择
│   │   │   ├── ColorEditor.tsx       # 颜色调整
│   │   │   ├── TextEditor.tsx        # 文字编辑面板
│   │   │   ├── ExifSelector.tsx      # EXIF 字段选择
│   │   │   ├── CropDialog.tsx        # 裁切面板（Cropper.js）
│   │   │   └── FontPicker.tsx        # 字体选择器
│   │   └── common/            # 通用组件
│   │       ├── UploadArea.tsx        # 上传区域
│   │       ├── ColorSwatch.tsx       # 色块展示
│   │       ├── ThemeToggle.tsx       # 暗色模式切换
│   │       └── LanguageSwitcher.tsx  # 语言切换
│   ├── templates/             # ★ 模板定义（核心扩展点）
│   │   ├── types.ts           # 模板类型定义
│   │   ├── registry.ts        # 模板注册表
│   │   ├── half.ts            # 两方形平分上颜色文字下照片
│   │   ├── polaroid.ts        # 拍立得模板
│   │   ├── classic.ts         # 经典四周等宽
│   │   ├── minimal.ts         # 底部信息条
│   │   └── clean.ts           # 无边框纯文字叠加
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useImageUpload.ts  # 图片上传处理（含 HEIC 转换）
│   │   ├── useExifData.ts     # EXIF 解析
│   │   ├── useColorPalette.ts # 主题色提取
│   │   ├── useTemplate.ts     # 模板状态管理
│   │   └── useExport.ts       # 导出逻辑
│   ├── lib/                   # 工具函数
│   │   ├── exif-parser.ts     # EXIF 解析封装
│   │   ├── color-utils.ts     # 颜色工具（对比度计算、亮度判断等）
│   │   ├── geo-resolver.ts    # GPS → 地名
│   │   ├── image-utils.ts     # 图片工具（HEIC 转换、尺寸限制等）
│   │   └── cn.ts              # Tailwind className 合并工具
│   ├── data/
│   ├── styles/
│   │   └── globals.css        # 全局样式 + CSS 变量（Warm Minimalism 主题）
│   └── types/
│       ├── exif.ts            # EXIF 数据类型
│       ├── template.ts        # 模板类型
│       └── editor.ts          # 编辑器状态类型
├── index.html
├── vite.config.ts             # Vite 配置（含 PWA 插件）
├── tailwind.config.ts         # Tailwind 配置（Warm Minimalism 主题）
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. 核心数据结构

### 3.1 EXIF 数据类型

```typescript
// src/types/exif.ts

interface ExifData {
  // 相机信息
  make?: string;              // 相机品牌 "Canon"
  model?: string;             // 相机型号 "EOS R5"
  lensModel?: string;         // 镜头型号 "RF 50mm F1.2L USM"

  // 拍摄参数
  focalLength?: number;       // 焦距 50
  fNumber?: number;           // 光圈 1.2
  exposureTime?: number;      // 快门速度 1/500 → 0.002
  iso?: number;               // ISO 100
  exposureBias?: number;      // 曝光补偿 -0.3

  // 时间
  dateTimeOriginal?: Date;    // 拍摄时间

  // 位置
  latitude?: number;          // 纬度 39.9042
  longitude?: number;         // 经度 116.4074
  locationName?: string;      // 解析后的地名 "Beijing, China"（由 geo-resolver 填充）

  // 图片信息
  imageWidth?: number;
  imageHeight?: number;
  software?: string;          // 处理软件
  copyright?: string;

  // 原始数据（保留所有解析出的字段，用户可自由选择）
  raw?: Record<string, unknown>;
}
```

### 3.2 模板类型定义

```typescript
// src/types/template.ts

/**
 * 模板定义
 * ★ 这是模板扩展系统的核心。新增模板只需创建一个符合此类型的对象，
 *   并在 registry.ts 中注册即可。
 */
interface TemplateDefinition {
  id: string;                          // 唯一标识 "polaroid"
  nameKey: string;                     // i18n key "templates.polaroid.name"
  descriptionKey: string;              // i18n key "templates.polaroid.description"
  thumbnail: string;                   // 模板缩略图路径

  // 画布布局配置
  layout: TemplateLayout;

  // 默认展示的 EXIF 字段
  defaultExifFields: ExifFieldConfig[];

  // 文字区域默认样式
  defaultTextStyle: TextStyle;
}

interface TemplateLayout {
  // 边框配置（值为相对于图片短边的百分比，方便不同尺寸图片自适应）
  padding: {
    top: number;       // 例如 0.03 = 图片短边的 3%
    right: number;
    bottom: number;    // Polaroid 模板此值较大，如 0.15
    left: number;
  };

  // 边框颜色策略
  frameColorMode: 'auto' | 'fixed';  // auto = 从主题色自动取，fixed = 使用固定色
  frameColorFixed?: string;            // fixed 模式下的颜色值
  frameCornerRadius?: number;          // 边框圆角 (px)

  // 文字区域定义（相对坐标，0-1 范围）
  textAreas: TextAreaDefinition[];
}

interface TextAreaDefinition {
  id: string;                  // "camera-info" | "date-location" | "custom"
  // 相对于整个画布的定位（0-1）
  x: number;
  y: number;
  width: number;
  height: number;
  align: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
}

interface ExifFieldConfig {
  field: keyof ExifData;       // "model" | "focalLength" | ...
  labelKey: string;            // i18n key for label
  format?: string;             // 格式化模板 "{value}mm" | "f/{value}" | "ISO {value}"
  textAreaId: string;          // 放在哪个 TextArea 中
}

interface TextStyle {
  fontFamily: string;          // "JetBrains Mono"
  fontSize: number;            // 相对值，会根据画布大小缩放
  fontWeight: number;          // 400 | 500 | 600
  color: 'auto' | string;     // auto = 根据背景亮度自动黑/白
  letterSpacing?: number;
  lineHeight?: number;
}
```

### 3.3 编辑器状态

```typescript
// src/types/editor.ts

interface EditorState {
  // 图片
  originalImage: HTMLImageElement | null;
  croppedImage: HTMLImageElement | null;  // 裁切后的图片（未裁切则同 originalImage）
  imageSize: { width: number; height: number };

  // EXIF
  exifData: ExifData | null;
  selectedExifFields: string[];          // 用户选择展示的字段 ID 列表

  // 颜色
  dominantColor: string;                 // 主题色 HEX
  palette: string[];                     // 调色板（5 色）
  isDark: boolean;                       // 主题色是否为深色
  frameColor: string;                    // 当前使用的边框颜色（可被用户覆盖）
  textColor: string;                     // 当前使用的文字颜色

  // 模板
  currentTemplateId: string;
  templateOverrides: Partial<TemplateLayout>;  // 用户对当前模板的覆盖修改

  // 文字覆盖（用户自定义的文字内容/样式）
  textOverrides: Record<string, {
    content?: string;
    style?: Partial<TextStyle>;
    position?: { x: number; y: number };  // 拖拽后的位置
  }>;

  // UI 状态
  activePanel: 'template' | 'color' | 'text' | 'crop' | 'exif' | null;
  canvasScale: number;                   // 预览缩放比例
}
```

---

## 4. 用户流程

### 4.1 主流程

```
┌─────────────┐    ┌──────────────────────┐    ┌─────────────────┐    ┌──────────┐
│  ① 上传图片  │ → │  ② 自动处理（并行）    │ → │  ③ 展示默认模板  │ → │  ④ 微调   │
│  拖拽/点击   │    │  · 解析 EXIF          │    │  · 应用第一个    │    │  · 换模板 │
│  /粘贴       │    │  · 提取主色           │    │    匹配模板      │    │  · 改文字 │
│             │    │  · HEIC 转换(如需)     │    │  · 自动填充信息  │    │  · 调颜色 │
│             │    │  · GPS → 地名         │    │  · 渲染预览      │    │  · 裁切   │
└─────────────┘    └──────────────────────┘    └─────────────────┘    │  · 选字段 │
                                                                       └────┬─────┘
                                                                            │
                                                                       ┌────▼─────┐
                                                                       │  ⑤ 导出  │
                                                                       │  下载图片 │
                                                                       └──────────┘
```

### 4.2 各步骤详细行为

#### ① 上传图片

- **触发方式**：拖拽到上传区域 / 点击选择文件 / 粘贴剪贴板图片
- **支持格式**：JPEG、PNG、WebP、HEIC/HEIF
- **大小限制**：≤ 30 MB，超出弹出 Sonner Toast 提示
- **HEIC 处理**：检测到 HEIC 格式后，使用 `heic2any` 库在浏览器内转换为 JPEG，转换过程显示进度提示
- **上传区域设计**：
  - 空状态：居中显示虚线框 + 图标 + "拖拽或点击上传照片" 文案
  - hover 状态：虚线框高亮 + 背景色变为 `--accent-subtle`
  - 拖拽进入状态：全屏 overlay + 放大图标动画

#### ② 自动处理（并行执行）

以下三个任务在图片加载完成后**并行启动**：

**2a. EXIF 解析**

```typescript
const exif = await exifr.parse(file, {
  // 尽量提取所有字段
  tiff: true,
  exif: true,
  gps: true,
  ifd1: true,
  // 开启人类可读的值转换
  translateKeys: true,
  translateValues: true,
  reviveValues: true,
});
```

- 解析成功：填充 `ExifData` 对象
- 解析失败 / 无 EXIF：`exifData` 设为 `null`，后续流程正常进行，边框区域显示空白或仅展示用户手动输入的文字

**2b. 主题色提取**

```typescript
const dominant = await getColor(img);  // 主色
const palette = await getPalette(img, { colorCount: 5 });  // 调色板
```

- 主色用于边框默认背景色
- `isDark` 判断决定文字默认用白色还是深褐色
- 调色板展示在颜色编辑面板中供用户快捷切换

**2c. GPS → 地名（如有坐标）**

- 基于最近邻算法匹配最接近的城市
- 输出格式：`"城市, 国家"` （如 `"Beijing, China"` / `"北京, 中国"`，根据当前语言）
- 无 GPS 数据则跳过

#### ③ 展示默认模板

- 默认选择第一个模板
- 根据模板的 `defaultExifFields` 配置，自动填充有数据的字段
- 边框颜色 = 主题色，文字颜色 = `colorthief.textColor`
- Canvas 渲染完成后，缓入动画展示（opacity 0→1 + translateY 12px→0，300ms）

#### ④ 用户微调

所有编辑操作在侧边栏（桌面端）或底部抽屉（移动端）中进行：

**模板选择面板**
- 以缩略图网格展示所有可用模板
- 点击即切换，Canvas 用 Framer Motion `layoutAnimation` 平滑过渡

**颜色编辑面板**
- 展示从图片提取的 5 色调色板，点击快捷切换边框色
- 自定义颜色：Popover 弹出颜色选择器
- 实时预览

**文字编辑面板**
- 列出当前模板中所有文字元素
- 每个文字可编辑：内容（input）、字体（FontPicker Select）、字号（Slider）、颜色（ColorSwatch）、粗细（Select）
- Canvas 上的文字元素可拖拽移动位置

**EXIF 字段选择面板**
- 列出所有已解析的 EXIF 字段，每个字段带 Switch 开关
- 开启的字段显示在模板对应区域
- 无 EXIF 数据的图片，此面板提示"未检测到拍摄信息，可手动添加文字"

**裁切面板**
- 点击"裁切"按钮，弹出 Drawer（移动端底部抽屉 / 桌面端侧边 Dialog）
- Drawer 内嵌 Cropper.js 实例
- 支持自由裁切、固定比例（1:1、4:3、16:9、3:2）
- 确认后将裁切结果传回主编辑流，替换 `croppedImage`

#### ⑤ 导出

- 点击"导出"按钮
- 使用 `stage.toBlob()` 配合 `pixelRatio: 2`（或更高）导出高清图片
- 自动触发浏览器下载（`URL.createObjectURL(blob)` + `<a download>`）
- 文件名格式：`photomood_{原文件名}_{timestamp}.jpg`
- 导出成功后 Sonner Toast 提示

> **导出格式/质量等高级选项**：标记为 P2，后续版本再加。首期默认 JPEG 质量 0.92。

---

## 5. UI 布局

### 5.1 桌面端布局（≥ 768px）

```
┌──────────────────────────────────────────────────────────┐
│  Header: Logo("Photo Mood") | 语言切换 | 暗色切换 | 导出 │
├────────────────────────────────────┬─────────────────────┤
│                                    │                     │
│                                    │   侧边栏 (320px)    │
│                                    │                     │
│          Canvas 预览区域            │   ┌───────────────┐ │
│          (自动居中缩放)              │   │ 模板选择      │ │
│                                    │   ├───────────────┤ │
│                                    │   │ 颜色调整      │ │
│                                    │   ├───────────────┤ │
│                                    │   │ 文字编辑      │ │
│                                    │   ├───────────────┤ │
│                                    │   │ EXIF 字段     │ │
│                                    │   ├───────────────┤ │
│                                    │   │ 裁切          │ │
│                                    │   └───────────────┘ │
│                                    │                     │
└────────────────────────────────────┴─────────────────────┘
```

### 5.2 移动端布局（< 768px）

```
┌──────────────────────────┐
│  Header: Logo | ☀️ | 导出 │
├──────────────────────────┤
│                          │
│                          │
│     Canvas 预览区域       │
│     (全宽, 自适应高度)    │
│                          │
│                          │
├──────────────────────────┤
│  工具栏 (横向滚动图标)     │
│  🎨  📝  📷  ✂️  ℹ️      │
│  模板 颜色 文字 裁切 EXIF  │
├──────────────────────────┤
│                          │
│  底部 Drawer（点击图标弹出）│
│  对应的编辑面板内容        │
│                          │
└──────────────────────────┘
```

### 5.3 空状态（未上传图片）

```
┌──────────────────────────────────────────────────────────┐
│  Header: Logo("Photo Mood") | 语言切换 | 暗色切换        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                                                          │
│              ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐                │
│              │                          │                │
│              │    📷  (Lucide icon)     │                │
│              │                          │                │
│              │  拖拽照片到这里，或点击上传  │                │
│              │                          │                │
│              │  支持 JPEG / PNG / HEIC   │                │
│              │                          │                │
│              └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘                │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 6. 模板系统

### 6.1 架构设计

模板系统是 Photo Mood 的**核心扩展点**。设计原则：

1. **模板 = 纯 JSON 配置**，不包含渲染逻辑
2. **渲染器统一**：所有模板共用一个 Konva Canvas 渲染器，根据配置动态生成
3. **新增模板零代码**：后期增加模板只需在 `src/templates/` 下新建一个 `.ts` 文件，导出一个 `TemplateDefinition` 对象，并在 `registry.ts` 中注册

### 6.2 模板注册表

```typescript
// src/templates/registry.ts

import { polaroid } from './polaroid';
import { classic } from './classic';
import { half } from './half';
import { minimal } from './minimal';
import { clean } from './clean';

export const templateRegistry: TemplateDefinition[] = [
  polaroid,
  classic,
  half,
  minimal,
  clean,
];
```

### 6.3 首期模板（5 个）

#### ① Polaroid（拍立得）

```
┌─────────────────────────┐
│  ██████████████████████  │  ← 边框（主题色）
│  ██                  ██  │
│  ██                  ██  │
│  ██     [照 片]      ██  │
│  ██                  ██  │
│  ██                  ██  │
│  ██████████████████████  │
│                          │  ← 底部加宽区域
│  Canon EOS R5            │
│  RF 50mm f/1.2  ISO 100  │
│  2026.04.17  Beijing     │
│                          │
└─────────────────────────┘
```

- `padding`: top 3%, right 3%, bottom 15%, left 3%
- 底部宽区域放置 2–3 行 EXIF 文字
- 默认字段：相机型号 / 镜头+参数 / 时间+地点

#### ② Classic（经典四周等宽）

```
┌──────────────────────────────┐
│                              │
│    ┌──────────────────┐      │
│    │                  │      │
│    │     [照 片]      │      │
│    │                  │      │
│    └──────────────────┘      │
│                              │
│    Canon EOS R5 · f/1.2      │
│    50mm · ISO 100            │
│    2026.04.17 · Beijing      │
│                              │
└──────────────────────────────┘
```

- `padding`: 均为 5%
- 文字在图片下方居中

#### ③ Half（两方形平分上颜色文字下照片）

```
┌──────────────────────────────┐
│                              │
│                              │
│          [地址时间]            │
│           (无边框)            │
│                              │
│                              │
├──────────────────────────────┤
│                              │
│                              │
│          [照 片]             │
│          (无边框)            │
│                              │
│                              │
└──────────────────────────────┘
```

- `padding`: top 100%, right 0%, bottom 0%, left 0%

#### ④ Minimal（底部信息条）

```
┌──────────────────────────────┐
│                              │
│                              │
│          [照 片]             │
│          (无边框)            │
│                              │
│                              │
├──────────────────────────────┤
│  Canon EOS R5    2026.04.17  │  ← 薄信息条
└──────────────────────────────┘
```

- `padding`: top 0%, right 0%, bottom 4%, left 0%
- 图片无边框，仅底部一条窄信息栏

#### ⑤ Clean（无边框文字叠加）

```
┌──────────────────────────────┐
│                              │
│                              │
│          [照 片]             │
│          (全幅)              │
│                              │
│                              │
│            Canon EOS R5      │  ← 文字叠加在图片上
│            f/1.2 · 50mm     │     半透明背景
│                              │
└──────────────────────────────┘
```

- `padding`: 全 0%
- 文字叠加在图片底部，带半透明背景遮罩

---

## 7. 设计规范

### 7.1 颜色系统

使用到的所有颜色都需要是可配置的，不能直接使用 HEX 颜色值。

```css
:root {
  /* 背景 */
  --bg-base:        #F4F3EE;     /* Pampas 暖白 */
  --bg-surface:     #FFFFFF;     /* 卡片/面板 */
  --bg-subtle:      #E8E6DF;     /* Hover/分割 */
  --bg-overlay:     rgba(45, 43, 42, 0.4);  /* 遮罩 */

  /* 文字 */
  --text-primary:   #2D2B2A;     /* 深褐 */
  --text-secondary: #6B6966;     /* 暖灰 */
  --text-tertiary:  #B1ADA1;     /* Cloudy */
  --text-inverse:   #F4F3EE;     /* 反色文字 */

  /* 强调 */
  --accent:         #C15F3C;     /* Crail 赤陶 */
  --accent-hover:   #A8502F;
  --accent-subtle:  #F5E6DE;     /* 强调色 10% */

  /* 功能色 */
  --success:        #5B8C5A;
  --warning:        #C49A3C;
  --error:          #B94A48;

  /* 圆角 */
  --radius-sm:      8px;
  --radius-md:      12px;
  --radius-lg:      16px;
  --radius-full:    9999px;

  /* 阴影 */
  --shadow-sm:      0 1px 2px rgba(45,43,42,0.04);
  --shadow-md:      0 4px 12px rgba(45,43,42,0.06);
  --shadow-lg:      0 12px 32px rgba(45,43,42,0.08);
}

/* 暗色模式 */
[data-theme="dark"] {
  --bg-base:        #1C1B1A;
  --bg-surface:     #2D2B2A;
  --bg-subtle:      #3A3836;
  --bg-overlay:     rgba(0, 0, 0, 0.6);
  --text-primary:   #F4F3EE;
  --text-secondary: #B1ADA1;
  --text-tertiary:  #6B6966;
  --text-inverse:   #2D2B2A;
  --accent:         #D4805E;
  --accent-hover:   #E0956F;
  --accent-subtle:  #3D2A1E;
}
```

### 7.2 字体系统

```css
/* Google Fonts 引入 */
@import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Instrument+Serif&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-sans:   'Instrument Sans', system-ui, -apple-system, sans-serif;
  --font-serif:  'Instrument Serif', Georgia, serif;
  --font-mono:   'JetBrains Mono', 'SF Mono', monospace;
}
```

| 用途 | 字体 | 字重 | 字号范围 |
|---|---|---|---|
| UI 标题/按钮 | Instrument Sans | 500–600 | 14–24px |
| UI 正文/标签 | Instrument Sans | 400 | 13–16px |
| 品牌名 "Photo Mood" | Instrument Serif | 400 | 20–28px |
| Canvas 内 EXIF 文字 | JetBrains Mono | 400–500 | 根据画布缩放 |
| Canvas 内自定义文字 | 用户可选（提供 5–8 种 Google Fonts） | 用户可选 | 用户可调 |

### 7.3 动效规范

```typescript
// 统一动效配置
const motionConfig = {
  transition: {
    duration: 0.3,
    ease: [0.25, 0.1, 0.25, 1],  // ease-out
  },
  fadeInUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
  },
};
```

| 场景 | 效果 | 参数 |
|---|---|---|
| 页面元素入场 | 淡入 + 微上移 | opacity 0→1, translateY 12→0, 300ms |
| 模板切换 | Framer Motion layoutAnimation | 自动计算位置差异，300ms |
| 面板展开/收起 | 高度动画 + 淡入 | 300ms ease-out |
| 按钮 hover | 背景色变深 + 微阴影 | 150ms |
| Toast 通知 | 从右侧滑入 | 由 Sonner 内置处理 |
| 拖拽文字 | 无过渡，跟随手指/鼠标 | 实时 |

### 7.4 图标使用规范

- 统一使用 **Lucide Icons**
- 描边宽度：1.5px（默认值）
- 尺寸：UI 中统一 20px，Header 导航 24px
- 颜色：跟随 `currentColor`

常用图标映射：

| 用途 | Lucide 图标名 |
|---|---|
| 上传 | `Upload` / `ImagePlus` |
| 模板 | `LayoutTemplate` |
| 颜色 | `Palette` |
| 文字 | `Type` |
| 裁切 | `Crop` |
| EXIF 信息 | `Info` / `Camera` |
| 导出/下载 | `Download` |
| 暗色模式 | `Sun` / `Moon` |
| 语言切换 | `Globe` |
| 关闭 | `X` |
| 设置 | `Settings` |

---

## 8. 国际化 (i18n)

### 8.1 配置

```typescript
// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)         // 从 /locales/ 懒加载
  .use(LanguageDetector)    // 自动检测浏览器语言
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh'],
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });
```

### 8.2 翻译文件结构

```jsonc
// public/locales/en/translation.json
{
  "app": {
    "name": "Photo Mood",
    "tagline": "Frame your photos with mood"
  },
  "upload": {
    "title": "Drop your photo here, or click to upload",
    "subtitle": "Supports JPEG, PNG, WebP, HEIC",
    "error": {
      "tooLarge": "File size exceeds 30 MB limit",
      "unsupported": "Unsupported file format"
    }
  },
  "panels": {
    "template": "Templates",
    "color": "Colors",
    "text": "Text",
    "crop": "Crop",
    "exif": "Photo Info"
  },
  "templates": {
    "polaroid": { "name": "Polaroid", "description": "Classic instant photo style" },
    "classic": { "name": "Classic", "description": "Even border on all sides" },
    "cinematic": { "name": "Cinematic", "description": "Widescreen movie style" },
    "minimal": { "name": "Minimal", "description": "Clean bottom info bar" },
    "clean": { "name": "Clean", "description": "Text overlay on photo" }
  },
  "editor": {
    "frameColor": "Frame Color",
    "textColor": "Text Color",
    "fontSize": "Font Size",
    "fontFamily": "Font",
    "fontWeight": "Weight",
    "customText": "Custom Text",
    "addText": "Add Text"
  },
  "exif": {
    "camera": "Camera",
    "lens": "Lens",
    "focalLength": "Focal Length",
    "aperture": "Aperture",
    "shutterSpeed": "Shutter",
    "iso": "ISO",
    "date": "Date",
    "location": "Location",
    "noData": "No EXIF data detected. You can add text manually.",
    "unknown": "Unknown"
  },
  "export": {
    "button": "Export",
    "success": "Photo saved successfully!",
    "processing": "Generating image..."
  },
  "crop": {
    "title": "Crop Photo",
    "freeform": "Freeform",
    "confirm": "Apply",
    "cancel": "Cancel"
  },
  "theme": {
    "light": "Light",
    "dark": "Dark",
    "system": "System"
  }
}
```

### 8.3 编码规范

- 所有面向用户的文案**必须**通过 `t('key')` 引用，**禁止**硬编码中文或英文
- 组件中使用 `useTranslation()` hook
- EXIF 字段的格式化（如日期、数字）使用 `Intl.DateTimeFormat` / `Intl.NumberFormat`，不手写格式化逻辑
- Canvas 中渲染的文字同样走 i18n（标签部分），用户自定义内容不做翻译

---

## 9. PWA 配置

```typescript
// vite.config.ts 中 PWA 插件配置
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Photo Mood',
        short_name: 'PhotoMood',
        description: 'Frame your photos with mood — extract colors, add borders, show EXIF info',
        theme_color: '#F4F3EE',
        background_color: '#F4F3EE',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
});
```

---

## 10. 边界情况与错误处理

| 场景 | 处理方式 |
|---|---|
| 无 EXIF 数据的图片（截图、微信图片等） | 正常进入编辑流，边框区域留空。EXIF 面板显示提示，用户可手动添加文字 |
| HEIC 格式 | 自动转换为 JPEG，显示"正在转换格式..."加载提示 |
| 图片超过 30 MB | 阻止上传，Toast 提示"文件超过 30MB 限制" |
| 图片尺寸极大（>8000px 单边） | 内部缩放到 4096px 以内进行处理，导出时使用缩放后的版本（避免 Canvas 内存溢出） |
| GPS 坐标在城市数据库中无匹配 | 显示经纬度数值，不显示城市名 |
| 浏览器不支持 Canvas / Konva | 显示友好提示"请使用 Chrome、Firefox、Safari 或 Edge 最新版本" |
| 拖拽文字出画布区域 | 限制拖拽范围在 Canvas 边界内（Konva `dragBoundFunc`）|
| 快门速度格式化 | `0.002` → `1/500`，`1.5` → `1.5"` |
| 字体加载失败 | 回退到系统字体，Toast 提示"字体加载失败，已使用系统默认字体" |

---

## 11. 开发阶段建议

| 阶段 | 内容 | 预计产出 |
|---|---|---|
| **P0 — 基础骨架** | Vite + React + Tailwind + PWA 脚手架搭建；i18n 配置；CSS 变量/主题系统；基础布局（Header + 主区域 + 侧边栏/底部工具栏） | 可运行的空壳应用 |
| **P1 — 核心流程** | 图片上传 → EXIF 解析 → 主题色提取 → Konva Canvas 渲染 → 默认模板展示 → 导出下载 | 最小可用版本 |
| **P2 — 编辑能力** | 模板切换；颜色编辑面板；文字编辑面板（字体/字号/颜色）；EXIF 字段选择；Canvas 内文字拖拽 | 完整编辑体验 |
| **P3 — 裁切与完善** | Cropper.js 裁切面板；HEIC 支持；暗色模式；移动端 Drawer 适配；动效打磨 | 发布级质量 |
| **P4 — 扩展** | 更多模板；更多可选字体；导出格式/质量选项；分享功能；更多 i18n 语言 | 长期迭代 |

---

## 12. Agent 编码注意事项

> 以下是写给执行编码的 Agent 的特别提醒。

1. **TypeScript 严格模式**：`tsconfig.json` 中开启 `"strict": true`。所有类型都应显式声明，不使用 `any`。

2. **i18n 从第一个组件开始**：不要先用硬编码文案"后面再改"。每一个面向用户的字符串都必须是 `t('key')` 形式。

3. **CSS 变量优先**：颜色/圆角/阴影全部通过 CSS 变量引用（见 7.1 节），不要在 Tailwind 类中硬编码色值。在 `tailwind.config.ts` 中将 CSS 变量映射为 Tailwind token。

4. **模板系统解耦**：模板定义（JSON 配置）和渲染逻辑（React + Konva 组件）必须严格分离。渲染器读取 `TemplateDefinition` 动态生成 Konva 节点，不要为每个模板写单独的渲染组件。

5. **react-konva 声明式写法**：使用 `<Stage>` `<Layer>` `<Rect>` `<Image>` `<Text>` 等 JSX 标签，不要使用 Konva 命令式 API（`new Konva.Rect()`）。组件的 props 由 React state 驱动。

6. **导出高清**：`stage.toDataURL({ pixelRatio: window.devicePixelRatio * 2 })` 确保在 Retina 屏上导出清晰图片。预览时 Canvas 可缩放显示，但导出必须用原始分辨率。

7. **移动端适配**：不要只在桌面端开发测试。Konva Canvas 需要设置 `listening: true` 响应触摸事件，Transformer 控件需要设置合适的 `touchCornerSize`（建议 40px）。所有 Drawer/Dialog 使用 shadcn 组件而非自写，确保移动端滚动/焦点行为正确。

8. **HEIC 惰性加载**：`heic2any` 库约 100KB，应 `import()` 动态加载，仅在检测到 HEIC 文件时才加载。

9. **性能**：exifr 和 colorthief 的处理应在 `useEffect` 或 Web Worker 中异步执行，不阻塞首次渲染。大图（> 2000px）取色前应先缩放到 200px 再采样。

10. **文件名约定**：组件文件 PascalCase（`CanvasPreview.tsx`），工具函数 kebab-case（`color-utils.ts`），类型文件 kebab-case（`template.ts`）。Hooks 以 `use` 前缀（`useExifData.ts`）。