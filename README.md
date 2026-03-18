# Revaea HLS 列表

一个包含前端（Next.js）与后端（Quart/Worker）的媒体管理与 HLS 播放站点。

- HLS 播放预览（视频/音频）
- 支持 Python 后端扫描转码模式
- 支持 Worker-only 只读播放模式
- 移动端/平板/桌面自适应界面

## 目录结构

```
assets/                  # 前端静态导出产物（构建后收集至此，用于静态部署）
backend/                 # Quart 后端服务与 API
frontend/                # Next.js 15 App Router 前端
music-hls/               # 音频 HLS 片段目录（由后端生成/读取）
music-playlist/          # 音频播放列表 JSON（由后端生成/读取）
music-upload/            # 音频上传的原始文件目录
video-hls/               # 视频 HLS 片段目录（由后端生成/读取）
video-playlist/          # 视频播放列表 JSON（由后端生成/读取）
video-upload/            # 视频上传的原始文件目录
scripts/
  └─ collect_frontend_export.js  # 构建后把前端导出结果收集到仓库根的 assets/
```

## WebUI

- 技术栈：Next.js 16（App Router + Turbopack）、Tailwind CSS、lucide-react、sonner、hls.js
- 主要页面：
  - `/`：入口导航
  - `/video`：视频列表与播放（`<lg` 隐藏列表，提供上下切换；视频就绪后淡入）
  - `/music`：音频列表与播放（AudioPlayer，支持 HLS、进度/音量/播放模式、键盘快捷键、移动端紧凑模式）

### 生产构建（静态导出）

```powershell
cd frontend
pnpm install
pnpm build
```

构建完成后，Next 输出会放到 `frontend/assets`（`distDir: 'assets'`），`postbuild` 会自动调用 `scripts/collect_frontend_export.js`，将产物收集到仓库根 `assets/`，便于静态部署。

## 运行模式

### 模式 A：Worker-only（推荐线上）

- 前端只展示播放功能
- 不提供 `/api/scan/*` 与 `/ws/scan/*`
- 请求扫描会返回 `scan is not available in worker-only mode`（501）

前端开关建议：

- `frontend/src/config.ts` 中设置 `ENABLE_SCAN_UI = false`

### 模式 B：Python 后端（可以在线扫描/转码）

- 支持 `POST /api/scan/video`、`POST /api/scan/music`
- 支持 `ws/scan/video`、`ws/scan/music` 日志流
- 扫描接口默认启用 token 鉴权

前端开关建议：

- `frontend/src/config.ts` 中设置 `ENABLE_SCAN_UI = true`
- 页面会显示扫描相关按钮和 Token 输入框

后端 token 说明：

- 默认 token 文件：`/.secrets/scan_api_token`
- 当 `SCAN_AUTH_REQUIRED=1` 且文件不存在时，后端会自动创建并生成 token
- 也可使用环境变量 `SCAN_API_TOKEN`（兜底）

> [!WARNING]
>
> Next 会警告“rewrites 在 export 下不生效”。
>
> 本项目通过后端（或前置代理）处理 API 与静态资源路径。静态部署时请在服务器（如 Nginx）上配置对应反向代理。

## Backend

- 技术栈：Quart、uvicorn/hypercorn、aiohttp
- 功能：
  - 提供 API：
    - `GET /api/health`
    - `GET /api/video/playlist`、`POST /api/scan/video`
    - `GET /api/music/playlist`、`POST /api/scan/music`
  - 扫描上传目录，生成播放列表与 HLS 资源（FFmpeg 策略见环境变量）

> [!NOTE]
>
> 说白了，就是脚本的升级版，加个前端方便预览多媒体资源。

## 展示

[👉 展示页面](https://hls.revaea.com)

> [!NOTE]
>
> 安全考虑，没有在前端加入上传入口，也没有在后端加入上传 `API` 端点
>
> 所以请通过其他方式上传媒体源文件。

