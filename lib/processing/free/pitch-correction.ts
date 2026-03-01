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
  )

  console.log('[autotune] raw output:', JSON.stringify(output, null, 2))

  const resultUrl = typeof output === 'string'
    ? output
    : String(output)

  const blobUrl = await saveToBlobFromUrl(resultUrl, 'vocals_corrected.wav')

  return {
    outputUrl: blobUrl,
    provider: 'replicate/autotune',
    costCents: 0,
    tracks: [{ label: 'vocals_corrected', url: blobUrl }],
  }
}
