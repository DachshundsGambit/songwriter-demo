import { NextRequest, NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import { executeStep } from '@/lib/processing/orchestrator'

const receiver = process.env.QSTASH_CURRENT_SIGNING_KEY
  ? new Receiver({
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
    })
  : null

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()

    // Verify QStash signature in production
    if (receiver) {
      const signature = req.headers.get('upstash-signature')
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }
      const isValid = await receiver.verify({ signature, body, url: req.url })
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const { projectId, stepName } = JSON.parse(body)
    if (!projectId || !stepName) {
      return NextResponse.json({ error: 'Missing projectId or stepName' }, { status: 400 })
    }

    await executeStep(projectId, stepName)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[jobs/process] Error:', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
