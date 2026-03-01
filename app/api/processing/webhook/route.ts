import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { advancePipeline } from '@/lib/processing/orchestrator'
import { saveToBlobFromUrl } from '@/lib/processing/replicate-client'

/**
 * Webhook receiver for Replicate prediction completion.
 * When using async Replicate predictions (with webhooks), this endpoint
 * receives the result and advances the pipeline.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    // Replicate sends: { id, status, output, error, ... }
    const { id: predictionId, status, output, error } = payload

    if (!predictionId) {
      return NextResponse.json({ error: 'Missing prediction ID' }, { status: 400 })
    }

    // Find the step by externalId
    const step = await prisma.processingStep.findFirst({
      where: { externalId: predictionId },
    })

    if (!step) {
      console.warn(`[webhook] No step found for prediction ${predictionId}`)
      return NextResponse.json({ ok: true })
    }

    if (status === 'succeeded' && output) {
      // Save output to blob
      const outputUrl = typeof output === 'string'
        ? output
        : Array.isArray(output)
          ? output[0]
          : output.output || output.url

      const blobUrl = await saveToBlobFromUrl(outputUrl, `${step.stepName}-output.wav`)

      await prisma.processingStep.update({
        where: { id: step.id },
        data: {
          status: 'COMPLETED',
          outputUrl: blobUrl,
        },
      })

      // Advance pipeline
      await advancePipeline(step.projectId)
    } else if (status === 'failed') {
      await prisma.processingStep.update({
        where: { id: step.id },
        data: {
          status: 'FAILED',
          errorMsg: error || 'Processing failed',
        },
      })
      await prisma.project.update({
        where: { id: step.projectId },
        data: { status: 'FAILED' },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[webhook] Error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
