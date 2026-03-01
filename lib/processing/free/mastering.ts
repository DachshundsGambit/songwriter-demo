import type { StepResult } from '../types'
import { saveToBlobFromUrl } from '../replicate-client'
import { runFfmpeg, downloadToTmp } from '../ffmpeg'

/**
 * Free tier mastering using FFmpeg loudnorm.
 * Applies EBU R128 loudness normalization and basic EQ.
 */
export async function mastering(inputUrl: string): Promise<StepResult> {
  const inputPath = await downloadToTmp(inputUrl, 'input.mp3')

  const outputBuffer = await runFfmpeg((ffmpeg) =>
    ffmpeg
      .input(inputPath)
      .audioFilters([
        'loudnorm=I=-14:LRA=11:TP=-1.0',
        'equalizer=f=80:t=h:width=50:g=2',
        'equalizer=f=10000:t=h:width=2000:g=1.5',
      ])
      .outputOptions('-c:a', 'libmp3lame', '-q:a', '2')
  , 'mp3')

  const { put } = await import('@vercel/blob')
  const blob = await put(`processed/${Date.now()}-mastered.mp3`, outputBuffer, {
    access: 'public',
  })

  return {
    outputUrl: blob.url,
    provider: 'ffmpeg-loudnorm',
    costCents: 0,
  }
}
