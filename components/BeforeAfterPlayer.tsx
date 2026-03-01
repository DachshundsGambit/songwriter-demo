'use client'

import { useState } from 'react'
import { WaveformPlayer } from './WaveformPlayer'

interface BeforeAfterPlayerProps {
  originalUrl: string
  finalUrl: string
}

export function BeforeAfterPlayer({ originalUrl, finalUrl }: BeforeAfterPlayerProps) {
  const [view, setView] = useState<'original' | 'final'>('final')

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setView('original')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'original' ? 'bg-accent text-white' : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          Original
        </button>
        <button
          onClick={() => setView('final')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === 'final' ? 'bg-accent text-white' : 'bg-surface border border-border text-muted hover:text-foreground'
          }`}
        >
          Final Demo
        </button>
      </div>

      {view === 'original' ? (
        <WaveformPlayer url={originalUrl} label="Original Recording" />
      ) : (
        <WaveformPlayer url={finalUrl} label="Final Demo" />
      )}
    </div>
  )
}
