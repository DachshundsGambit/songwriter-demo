import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(req)
    const { id } = await params

    const project = await prisma.project.findFirst({
      where: { id, userId: auth.userId },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        tracks: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(project)
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
