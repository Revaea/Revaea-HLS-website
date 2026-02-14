import { BACKEND_BASE as CONFIG_BACKEND_BASE } from '@/config'

function normalizeBase(base: string) {
  return base.trim().replace(/\/+$/, '')
}

export const BACKEND_BASE = normalizeBase(CONFIG_BACKEND_BASE || '')
export const API_BASE = BACKEND_BASE

export function toBackendUrl(pathOrUrl: string) {
  const s = (pathOrUrl ?? '').trim()
  if (!s) return s
  if (/^https?:\/\//i.test(s)) return s
  if (!BACKEND_BASE) return s
  if (s.startsWith('/')) return BACKEND_BASE + s
  return `${BACKEND_BASE}/${s}`
}

function resolveWsBase() {
  // Prefer explicit backend base when frontend and backend are on different origins.
  if (BACKEND_BASE) {
    return BACKEND_BASE.replace(/^http/, 'ws')
  }

  // Default: same-origin in browser.
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${window.location.host}`
  }

  // Server-side fallback (dev).
  return 'ws://127.0.0.1:8000'
}

export const WS_BASE = resolveWsBase()

export async function getJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const full = toBackendUrl(url)
  const res = await fetch(full, init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GET ${full || url} failed: ${res.status} ${res.statusText} ${text}`)
  }
  return res.json() as Promise<T>
}

export async function postJSON<T>(url: string, body?: unknown, init?: RequestInit): Promise<T> {
  const full = toBackendUrl(url)
  const res = await fetch(full, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`POST ${full || url} failed: ${res.status} ${res.statusText} ${text}`)
  }
  return res.json() as Promise<T>
}

export function openScanWS(path: '/ws/scan/video' | '/ws/scan/music', handlers: {
  onLog?: (line: string) => void
  onDone?: (result: unknown) => void
  onError?: (message: string) => void
  onClose?: () => void
}) {
  const ws = new WebSocket((WS_BASE || '') + path)
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data as string) as { type: string; line?: string; result?: unknown; message?: string }
      if (data.type === 'log' && data.line) handlers.onLog?.(data.line)
      else if (data.type === 'done') handlers.onDone?.(data.result)
      else if (data.type === 'error') handlers.onError?.(data.message || 'unknown error')
    } catch {
    }
  }
  ws.onerror = () => handlers.onError?.('ws error')
  ws.onclose = () => handlers.onClose?.()
  return ws
}
