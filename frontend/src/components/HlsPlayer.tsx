"use client"
import Hls from 'hls.js'
import { useEffect, useRef } from 'react'

export type HlsVideoProps = {
  src: string
  poster?: string
  className?: string
  onCanPlay?: () => void
  onEnded?: () => void
  autoPlay?: boolean
}

export function HlsVideo({ src, poster, className, onCanPlay, onEnded, autoPlay }: HlsVideoProps) {
  const ref = useRef<HTMLVideoElement | null>(null)
  const onCanPlayRef = useRef<(() => void) | undefined>(undefined)
  const onEndedRef = useRef<(() => void) | undefined>(undefined)
  const autoPlayRef = useRef<boolean>(false)

  useEffect(() => { onCanPlayRef.current = onCanPlay }, [onCanPlay])
  useEffect(() => { onEndedRef.current = onEnded }, [onEnded])
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
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('ended', handleEnded)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src
      video.load()
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true })
      hls.loadSource(src)
      hls.attachMedia(video)
    }
    return () => {
      if (hls) hls.destroy()
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('ended', handleEnded)
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
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true })
      hls.loadSource(src)
      hls.attachMedia(audio)
    }
    return () => { if (hls) hls.destroy() }
  }, [src])
  return <audio ref={ref} controls className={`my-4 rounded-sm overflow-hidden bg-white dark:bg-slate-900 [color-scheme:light] dark:[color-scheme:dark] ${className ?? ''}`} />
}
