import type { StepResult } from '../types'
import { saveToBlobFromUrl } from '../replicate-client'

const LANDR_BASE = 'https://api.landr.com/mastering/v1'

/**
 * Premium tier mastering using LANDR Mastering API.
 */
export async function mastering(inputUrl: string): Promise<StepResult> {
  const apiKey = process.env.LANDR_API_KEY
  if (!apiKey) throw new Error('LANDR_API_KEY not configured')

  // Submit mastering job
  const createRes = await fetch(`${LANDR_BASE}/masters`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audioUrl: inputUrl,
      style: 'balanced',
      intensity: 'medium',
    }),
  })

  if (!createRes.ok) {
    throw new Error(`LANDR API error: ${createRes.status} ${await createRes.text()}`)
  }

  const job = await createRes.json() as { id: string }

  // Poll for completion
  let result: { status: string; downloadUrl?: string }
  let attempts = 0
  const maxAttempts = 120 // Mastering can take longer

  do {
    await new Promise((r) => setTimeout(r, 5000))
    const pollRes = await fetch(`${LANDR_BASE}/masters/${job.id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    result = await pollRes.json()
    attempts++
  } while (result.status !== 'completed' && result.status !== 'failed' && attempts < maxAttempts)

  if (result.status === 'failed') throw new Error('LANDR mastering failed')
  if (attempts >= maxAttempts) throw new Error('LANDR mastering timed out')

  const blobUrl = await saveToBlobFromUrl(result.downloadUrl!, 'mastered-premium.mp3')

  return {
    outputUrl: blobUrl,
    provider: 'landr',
    externalId: job.id,
    costCents: 100, // Estimate per track
  }
}
