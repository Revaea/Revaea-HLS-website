# Frontend (Next.js)

本目录是站点前端（静态导出模式）。

## 开发

```bash
pnpm install
pnpm dev
```

默认开发地址：`http://localhost:3000`

## 构建（静态导出）

```bash
pnpm build
```

说明：

- `output: 'export'`
- `distDir: 'assets'`
- `postbuild` 会调用仓库根 `scripts/collect_frontend_export.js`

## 关键配置

文件：`src/config.ts`

- `BACKEND_BASE`：后端基础地址
	- 同域部署可设为 `''`
	- 跨域部署填写完整域名
- `ENABLE_SCAN_UI`：扫描相关 UI 开关
	- `false`：Worker-only 模式（不显示扫描按钮/日志/Token 输入）
	- `true`：Python 后端模式（显示扫描按钮/日志/Token 输入）

## 扫描 Token（仅 `ENABLE_SCAN_UI=true`）

- `/video` 与 `/music` 页面会出现 Token 输入框
- 保存后写入浏览器 `localStorage`
- 扫描请求会自动携带 token（HTTP Bearer + WS query）

