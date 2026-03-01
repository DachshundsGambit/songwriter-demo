import type { StepResult } from '../types'
import { saveToBlobFromUrl } from '../replicate-client'

/**
 * Premium tier vocal enhancement using ElevenLabs Voice Isolator.
 * Removes background noise and enhances vocal clarity.
 */
export async function enhancement(inputUrl: string): Promise<StepResult> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured')

  // Download the input audio
  const audioResponse = await fetch(inputUrl)
  if (!audioResponse.ok) throw new Error('Failed to download input audio')
  const audioBuffer = await audioResponse.arrayBuffer()

  // Send to ElevenLabs Audio Isolation API
  const formData = new FormData()
  formData.append('audio', new Blob([audioBuffer], { type: 'audio/wav' }), 'input.wav')

  const res = await fetch('https://api.elevenlabs.io/v1/audio-isolation', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  })

  if (!res.ok) {
    throw new Error(`ElevenLabs API error: ${res.status} ${await res.text()}`)
  }

  // Response is the processed audio file directly
  const resultBuffer = await res.arrayBuffer()
  const { put } = await import('@vercel/blob')
  const blob = await put(`processed/${Date.now()}-enhanced.wav`, Buffer.from(resultBuffer), {
    access: 'public',
  })

  return {
    outputUrl: blob.url,
    provider: 'elevenlabs',
    costCents: 50, // Estimate
    tracks: [{ label: 'vocals_enhanced', url: blob.url }],
  }
}
