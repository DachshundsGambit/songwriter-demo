'use client'
import { create } from 'zustand'

interface PlayerState {
  currentTrackUrl: string | null
  isPlaying: boolean
  play: (url: string) => void
  pause: () => void
  stop: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrackUrl: null,
  isPlaying: false,
  play: (url) => set({ currentTrackUrl: url, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ currentTrackUrl: null, isPlaying: false }),
}))
