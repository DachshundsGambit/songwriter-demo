import type { StepResult } from '../types'
import { saveToBlobFromUrl } from '../replicate-client'

const KITSAI_BASE = 'https://arpeggi.io/api/kits/v1'

/**
 * Premium tier pitch correction using Kits.ai AI resynthesis.
 */
export async function pitchCorrection(inputUrl: string): Promise<StepResult> {
  const apiKey = process.env.KITSAI_API_KEY
  if (!apiKey) throw new Error('KITSAI_API_KEY not configured')

  const createRes = await fetch(`${KITSAI_BASE}/pitch-correction`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audioUrl: inputUrl,
      correctionStrength: 0.85,
    }),
  })

  if (!createRes.ok) {
    throw new Error(`Kits.ai pitch correction error: ${createRes.status} ${await createRes.text()}`)
  }

  const job = await createRes.json() as { id: string }

  // Poll for completion
  let result: { status: string; outputUrl?: string }
  let attempts = 0
  const maxAttempts = 60

  do {
    await new Promise((r) => setTimeout(r, 5000))
    const pollRes = await fetch(`${KITSAI_BASE}/pitch-correction/${job.id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    result = await pollRes.json()
    attempts++
  } while (result.status !== 'completed' && result.status !== 'failed' && attempts < maxAttempts)

  if (result.status === 'failed') throw new Error('Kits.ai pitch correction failed')
  if (attempts >= maxAttempts) throw new Error('Kits.ai pitch correction timed out')

  const blobUrl = await saveToBlobFromUrl(result.outputUrl!, 'vocals-corrected-premium.wav')

  return {
    outputUrl: blobUrl,
    provider: 'kitsai',
    externalId: job.id,
    costCents: 0,
    tracks: [{ label: 'vocals_corrected', url: blobUrl }],
  }
}
