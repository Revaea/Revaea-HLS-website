"use client"
import Hls from 'hls.js'
import { useEffect, useRef } from 'react'

export type HlsVideoProps = {
  src: string
  poster?: string
  className?: string
  onCanPlay?: () => void
  onEnded?: () => void
  onError?: (message: string) => void
  autoPlay?: boolean
}

export function HlsVideo({ src, poster, className, onCanPlay, onEnded, onError, autoPlay }: HlsVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const onCanPlayRef = useRef<(() => void) | undefined>(undefined)
  const onEndedRef = useRef<(() => void) | undefined>(undefined)
  const onErrorRef = useRef<((message: string) => void) | undefined>(undefined)
  const autoPlayRef = useRef<boolean>(false)

  useEffect(() => { onCanPlayRef.current = onCanPlay }, [onCanPlay])
  useEffect(() => { onEndedRef.current = onEnded }, [onEnded])
  useEffect(() => { onErrorRef.current = onError }, [onError])
  useEffect(() => { autoPlayRef.current = !!autoPlay }, [autoPlay])

  useEffect(() => {
    const video = ref.current
    if (!video) return
    let hls: Hls | null = null
    const handleCanPlay = () => {
      try { onCanPlayRef.current?.() } catch { /* noop */ }
      if (autoPlayRef.current) {
        autoPlayRef.current = false
        video.play().catch(() => { /* require user gesture */ })
      }
    }
    const handleEnded = () => { try { onEndedRef.current?.() } catch { /* noop */ } }
    const handleError = () => {
      try {
        const code = video.error?.code
        const msg = code ? `video error code=${code}` : 'video error'
        onErrorRef.current?.(msg)
      } catch {
        // noop
      }
    }
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.load()
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data) return
        // 仅在致命错误时提示；非致命错误通常会自动重试。
        if (data.fatal) {
          try { onErrorRef.current?.(`hls fatal error: ${data.type || 'unknown'}`) } catch { /* noop */ }
        }
      })
    } else {
      // 既不原生支持 HLS，也不支持 MSE/Hls.js：仍设置 src 以触发 error 事件，避免页面永远处于“缓冲中”。
      video.src = src
      video.load()
    }
    return () => {
      if (hls) hls.destroy()
      // 主动中断加载，避免快速切换时残留请求占用。
      try {
        video.pause()
        video.removeAttribute('src')
        video.load()
      } catch {
        // ignore
      }
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
    }
  }, [src])
  return <video ref={ref} poster={poster} controls className={`my-4 rounded-sm overflow-hidden [color-scheme:light] dark:[color-scheme:dark] ${className ?? ''}`} />
}

export function HlsAudio({ src, className }: { src: string, className?: string }) {
  const ref = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    const audio = ref.current
    if (!audio) return
    let hls: Hls | null = null
    if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = src
      audio.load()
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true })
      hls.loadSource(src)
      hls.attachMedia(audio)
    } else {
      audio.src = src
      audio.load()
    }
    return () => {
      if (hls) hls.destroy()
      try {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      } catch {
        // ignore
      }
    }
  }, [src])
  return <audio ref={ref} controls className={`my-4 rounded-sm overflow-hidden bg-white dark:bg-slate-900 [color-scheme:light] dark:[color-scheme:dark] ${className ?? ''}`} />
}
