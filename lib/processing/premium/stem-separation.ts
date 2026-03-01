import type { StepResult } from '../types'
import { saveToBlobFromUrl } from '../replicate-client'

const KITSAI_BASE = 'https://arpeggi.io/api/kits/v1'

/**
 * Premium tier stem separation using Kits.ai Vocal Separation API.
 */
export async function stemSeparation(inputUrl: string): Promise<StepResult> {
  const apiKey = process.env.KITSAI_API_KEY
  if (!apiKey) throw new Error('KITSAI_API_KEY not configured')

  // Start separation job
  const createRes = await fetch(`${KITSAI_BASE}/vocal-separation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ audioUrl: inputUrl }),
  })

  if (!createRes.ok) {
    throw new Error(`Kits.ai API error: ${createRes.status} ${await createRes.text()}`)
  }

  const job = await createRes.json() as { id: string }

  // Poll for completion
  let result: { status: string; vocalsUrl?: string; instrumentalUrl?: string }
  let attempts = 0
  const maxAttempts = 60

  do {
    await new Promise((r) => setTimeout(r, 5000))
    const pollRes = await fetch(`${KITSAI_BASE}/vocal-separation/${job.id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    result = await pollRes.json()
    attempts++
  } while (result.status !== 'completed' && result.status !== 'failed' && attempts < maxAttempts)

  if (result.status === 'failed') throw new Error('Kits.ai separation failed')
  if (attempts >= maxAttempts) throw new Error('Kits.ai separation timed out')

  const vocalsUrl = await saveToBlobFromUrl(result.vocalsUrl!, 'vocals-premium.wav')
  const instrumentsUrl = await saveToBlobFromUrl(result.instrumentalUrl!, 'instruments-premium.wav')

  return {
    outputUrl: vocalsUrl,
    provider: 'kitsai',
    externalId: job.id,
    costCents: 0, // Included in subscription
    metadata: { instrumentsUrl },
    tracks: [
      { label: 'vocals', url: vocalsUrl },
      { label: 'instruments', url: instrumentsUrl },
    ],
  }
}
