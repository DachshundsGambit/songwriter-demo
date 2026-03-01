'use client'

import { useEffect, useRef, useState } from 'react'

interface WaveformPlayerProps {
  url: string
  label?: string
}

export function WaveformPlayer({ url, label }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<{ play: () => void; pause: () => void; isPlaying: () => boolean; destroy: () => void } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [ready, setReady] = useState(false)
  const [currentTime, setCurrentTime] = useState('0:00')
  const [duration, setDuration] = useState('0:00')

  useEffect(() => {
    if (!containerRef.current) return

    let ws: { play: () => void; pause: () => void; isPlaying: () => boolean; destroy: () => void; on: (event: string, cb: (...args: unknown[]) => void) => void } | null = null

    async function init() {
      const WaveSurfer = (await import('wavesurfer.js')).default
      if (!containerRef.current) return

      ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: '#525252',
        progressColor: '#6366f1',
        cursorColor: '#818cf8',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 60,
        url,
      }) as unknown as typeof ws

      ws!.on('ready', () => {
        setReady(true)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dur = (ws as any).getDuration?.() ?? 0
        setDuration(formatTime(dur))
      })
      ws!.on('audioprocess', ((t: number) => setCurrentTime(formatTime(t))) as (...args: unknown[]) => void)
      ws!.on('play', () => setIsPlaying(true))
      ws!.on('pause', () => setIsPlaying(false))
      ws!.on('finish', () => setIsPlaying(false))

      wavesurferRef.current = ws as typeof wavesurferRef.current
    }

    init()
    return () => { ws?.destroy() }
  }, [url])

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function togglePlay() {
    if (wavesurferRef.current?.isPlaying()) {
      wavesurferRef.current.pause()
    } else {
      wavesurferRef.current?.play()
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {label && <div className="text-sm font-medium text-muted mb-2">{label}</div>}
      <div ref={containerRef} className="mb-2" />
      <div className="flex items-center justify-between">
        <button
          onClick={togglePlay}
          disabled={!ready}
          className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <span className="text-xs text-muted">{currentTime} / {duration}</span>
      </div>
    </div>
  )
}
