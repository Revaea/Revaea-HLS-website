/**
 * Frontend runtime/config constants.
 *
 * - Use '' (empty string) to talk to the same origin (recommended when frontend and backend share a domain).
 * - Set to full origin like 'https://hls.revaea.com' when the backend is on a different domain.
 */
export const BACKEND_BASE = 'https://hls.revaea.com'

// Worker 模式下不提供 /ws/scan 和 /api/scan，所以前端隐藏“同步/日志”相关 UI。
// Python 后端模式需要显示的话，把它改成 true。
export const ENABLE_SCAN_UI = false
