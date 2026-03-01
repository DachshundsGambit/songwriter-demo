import type { StepResult } from '../types'
import { runReplicate, saveToBlobFromUrl } from '../replicate-client'

/**
 * Free tier stem separation using Demucs (htdemucs_ft) via Replicate.
 * Separates audio into vocals and accompaniment.
 */
export async function stemSeparation(inputUrl: string): Promise<StepResult> {
  const output = await runReplicate(
    'cjwbw/demucs',
    {
      audio: inputUrl,
      model: 'htdemucs_ft',
      stem: 'vocals',
    }
  ) as { vocals: string; no_vocals: string } | string

  // Demucs returns URLs for separated stems
  let vocalsUrl: string
  let instrumentsUrl: string

  if (typeof output === 'object' && output !== null && 'vocals' in output) {
    vocalsUrl = await saveToBlobFromUrl(output.vocals, 'vocals.wav')
    instrumentsUrl = await saveToBlobFromUrl(output.no_vocals, 'instruments.wav')
  } else if (typeof output === 'string') {
    // Some versions return a single URL — treat as vocals-only
    vocalsUrl = await saveToBlobFromUrl(output, 'vocals.wav')
    instrumentsUrl = inputUrl // keep original as instruments fallback
  } else {
    throw new Error('Unexpected Demucs output format')
  }

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
