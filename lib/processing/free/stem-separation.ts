import type { StepResult } from '../types'
import { runReplicate, saveToBlobFromUrl } from '../replicate-client'

/**
 * Free tier stem separation using Demucs (htdemucs_ft) via Replicate.
 * Separates audio into vocals and accompaniment.
 */
export async function stemSeparation(inputUrl: string): Promise<StepResult> {
  const output = await runReplicate(
    'cjwbw/demucs:25a173108cff36ef9f80f854c162d01df9e6528be175794b81158fa03836d953',
    {
      audio: inputUrl,
      model: 'htdemucs_ft',
      stem: 'vocals',
    }
  )

  console.log('[demucs] raw output:', JSON.stringify(output, null, 2))

  // Demucs returns an object with stem URLs. Fields may be FileOutput objects
  // with a toString() or plain strings depending on SDK version.
  const out = output as Record<string, unknown>

  // Extract vocals URL - try 'vocals' key
  const vocalsRaw = out?.vocals
  const vocalsStr = typeof vocalsRaw === 'string'
    ? vocalsRaw
    : vocalsRaw && typeof (vocalsRaw as { toString(): string }).toString === 'function'
      ? String(vocalsRaw)
      : null

  if (!vocalsStr) {
    throw new Error(`Demucs: no vocals URL in output. Keys: ${Object.keys(out || {}).join(', ')}`)
  }

  // Extract instruments - could be 'no_vocals', 'other', or we combine non-vocal stems
  const noVocalsRaw = out?.no_vocals || out?.other
  const noVocalsStr = typeof noVocalsRaw === 'string'
    ? noVocalsRaw
    : noVocalsRaw && typeof (noVocalsRaw as { toString(): string }).toString === 'function'
      ? String(noVocalsRaw)
      : null

  const vocalsUrl = await saveToBlobFromUrl(vocalsStr, 'vocals.wav')
  const instrumentsUrl = noVocalsStr
    ? await saveToBlobFromUrl(noVocalsStr, 'instruments.wav')
    : inputUrl // fallback to original if no instruments track

  return {
    outputUrl: vocalsUrl,
    provider: 'replicate/demucs',
    costCents: 1,
    metadata: { instrumentsUrl },
    tracks: [
      { label: 'vocals', url: vocalsUrl },
      { label: 'instruments', url: instrumentsUrl },
    ],
  }
}
