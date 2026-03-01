import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { startPipeline } from '@/lib/processing/orchestrator'

const createSchema = z.object({
  title: z.string().min(1),
  tier: z.enum(['FREE', 'PREMIUM']),
  originalUrl: z.string().url(),
})

const STEP_NAMES = [
  'stem_separation',
  'pitch_correction',
  'enhancement',
  'recombine',
  'mastering',
]

export async function GET(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const projects = await prisma.project.findMany({
      where: { userId: auth.userId },
      include: { steps: { orderBy: { stepOrder: 'asc' } }, tracks: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(projects)
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireAuth(req)
    const body = await req.json()
    const { title, tier, originalUrl } = createSchema.parse(body)

    const project = await prisma.project.create({
      data: {
        userId: auth.userId,
        title,
        tier,
        status: 'PROCESSING',
        originalUrl,
        steps: {
          create: STEP_NAMES.map((name, i) => ({
            stepName: name,
            stepOrder: i + 1,
            status: i === 0 ? 'PENDING' : 'PENDING',
          })),
        },
        tracks: {
          create: {
            label: 'original',
            blobUrl: originalUrl,
          },
        },
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } }, tracks: true },
    })

    // Start the processing pipeline
    await startPipeline(project.id, tier)

    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.message }, { status: 400 })
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
