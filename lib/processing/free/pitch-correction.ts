import type { StepResult } from '../types'
import { runReplicate, saveToBlobFromUrl } from '../replicate-client'

/**
 * Free tier pitch correction using autotune via Replicate.
 * Applies basic auto-tune to isolated vocals.
 */
export async function pitchCorrection(inputUrl: string): Promise<StepResult> {
  const output = await runReplicate(
    'nateraw/autotune',
    {
      audio: inputUrl,
      correction_strength: 0.8,
    }
  ) as string | { output: string }

  const resultUrl = typeof output === 'string' ? output : output.output

  const blobUrl = await saveToBlobFromUrl(resultUrl, 'vocals_corrected.wav')

  return {
    outputUrl: blobUrl,
    provider: 'replicate/autotune',
    costCents: 0,
    tracks: [{ label: 'vocals_corrected', url: blobUrl }],
  }
}
