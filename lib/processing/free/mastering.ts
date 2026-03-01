import type { StepResult } from '../types'
import { runReplicate, saveToBlobFromUrl } from '../replicate-client'

/**
 * Free tier mastering using FFmpeg loudnorm via Replicate.
 * Applies EBU R128 loudness normalization and basic EQ.
 */
export async function mastering(inputUrl: string): Promise<StepResult> {
  const output = await runReplicate(
    'sakemin/ffmpeg',
    {
      input_1: inputUrl,
      cmd: '-af "loudnorm=I=-14:LRA=11:TP=-1.0,equalizer=f=80:t=h:width=50:g=2,equalizer=f=10000:t=h:width=2000:g=1.5" -c:a libmp3lame -q:a 2',
      output_extension: 'mp3',
    }
  ) as string | { output: string }

  const resultUrl = typeof output === 'string' ? output : output.output
  const blobUrl = await saveToBlobFromUrl(resultUrl, 'mastered.mp3')

  return {
    outputUrl: blobUrl,
    provider: 'replicate/ffmpeg-loudnorm',
    costCents: 0,
  }
}
