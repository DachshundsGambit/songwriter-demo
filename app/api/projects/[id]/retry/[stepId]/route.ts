import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { executeStep } from '@/lib/processing/orchestrator'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const auth = requireAuth(req)
    const { id, stepId } = await params

    const project = await prisma.project.findFirst({
      where: { id, userId: auth.userId },
    })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const step = await prisma.processingStep.findFirst({
      where: { id: stepId, projectId: id, status: 'FAILED' },
    })
    if (!step) return NextResponse.json({ error: 'Step not found or not failed' }, { status: 400 })

    // Reset step and project status
    await prisma.processingStep.update({
      where: { id: stepId },
      data: { status: 'PENDING', errorMsg: null },
    })
    await prisma.project.update({
      where: { id },
      data: { status: 'PROCESSING' },
    })

    // Re-execute the step
    await executeStep(id, step.stepName)

    const updated = await prisma.project.findUnique({
      where: { id },
      include: { steps: { orderBy: { stepOrder: 'asc' } }, tracks: true },
    })
    return NextResponse.json(updated)
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
