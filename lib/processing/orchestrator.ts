import { Client } from '@upstash/qstash'
import { prisma } from '@/lib/db'
import { stemSeparation as freeStemSeparation } from './free/stem-separation'
import { pitchCorrection as freePitchCorrection } from './free/pitch-correction'
import { enhancement as freeEnhancement } from './free/enhancement'
import { recombine as freeRecombine } from './free/recombine'
import { mastering as freeMastering } from './free/mastering'
import { stemSeparation as premiumStemSeparation } from './premium/stem-separation'
import { pitchCorrection as premiumPitchCorrection } from './premium/pitch-correction'
import { enhancement as premiumEnhancement } from './premium/enhancement'
import { mastering as premiumMastering } from './premium/mastering'

function getQStash() {
  return new Client({ token: process.env.QSTASH_TOKEN! })
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const STEP_ORDER = [
  'stem_separation',
  'pitch_correction',
  'enhancement',
  'recombine',
  'mastering',
]

/**
 * Starts the pipeline by triggering the first step via QStash.
 */
export async function startPipeline(projectId: string, tier: string) {
  const firstStep = STEP_ORDER[0]

  // If QSTASH_TOKEN is not configured, execute directly (for local dev)
  if (!process.env.QSTASH_TOKEN) {
    console.log(`[orchestrator] No QStash token — executing ${firstStep} directly`)
    await executeStep(projectId, firstStep)
    return
  }

  await getQStash().publishJSON({
    url: `${APP_URL}/api/jobs/process`,
    body: { projectId, stepName: firstStep, tier },
  })
}

/**
 * Advances to the next step in the pipeline after the current step completes.
 */
export async function advancePipeline(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  })
  if (!project) return

  // Find the last completed step
  const completedSteps = project.steps.filter((s) => s.status === 'COMPLETED')
  const lastCompleted = completedSteps[completedSteps.length - 1]

  if (!lastCompleted) return

  const currentIndex = STEP_ORDER.indexOf(lastCompleted.stepName)
  const nextStepName = STEP_ORDER[currentIndex + 1]

  if (!nextStepName) {
    // All steps done — get the mastering output and mark project completed
    const masteringStep = project.steps.find((s) => s.stepName === 'mastering')
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'COMPLETED',
        finalUrl: masteringStep?.outputUrl,
      },
    })

    // Save final track
    if (masteringStep?.outputUrl) {
      await prisma.track.create({
        data: { projectId, label: 'final', blobUrl: masteringStep.outputUrl },
      })
    }
    return
  }

  // Trigger next step
  if (!process.env.QSTASH_TOKEN) {
    await executeStep(projectId, nextStepName)
    return
  }

  await getQStash().publishJSON({
    url: `${APP_URL}/api/jobs/process`,
    body: { projectId, stepName: nextStepName, tier: project.tier },
  })
}

/**
 * Executes a specific pipeline step. Called by QStash or directly in dev.
 */
export async function executeStep(projectId: string, stepName: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { steps: { orderBy: { stepOrder: 'asc' } }, tracks: true },
  })
  if (!project) throw new Error('Project not found')

  const step = project.steps.find((s) => s.stepName === stepName)
  if (!step) throw new Error(`Step ${stepName} not found`)

  // Mark step as running
  await prisma.processingStep.update({
    where: { id: step.id },
    data: { status: 'RUNNING' },
  })

  try {
    // Determine input URL for this step
    const inputUrl = getInputUrl(project, stepName)

    // Route to appropriate handler based on tier
    const handler = getStepHandler(stepName, project.tier)
    const result = await handler(inputUrl, project)

    // Save output
    await prisma.processingStep.update({
      where: { id: step.id },
      data: {
        status: 'COMPLETED',
        inputUrl,
        outputUrl: result.outputUrl,
        provider: result.provider,
        externalId: result.externalId || null,
        costCents: result.costCents || 0,
        metadata: (result.metadata as Record<string, string>) || undefined,
      },
    })

    // Save intermediate tracks
    if (result.tracks) {
      for (const track of result.tracks) {
        await prisma.track.create({
          data: { projectId, label: track.label, blobUrl: track.url },
        })
      }
    }

    // Advance to next step
    await advancePipeline(projectId)
  } catch (err) {
    console.error(`[orchestrator] Step ${stepName} failed:`, err)
    await prisma.processingStep.update({
      where: { id: step.id },
      data: {
        status: 'FAILED',
        errorMsg: (err as Error).message || 'Unknown error',
      },
    })
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'FAILED' },
    })
  }
}

import type { StepResult, StepHandler } from './types'

function getInputUrl(
  project: { steps: { stepName: string; outputUrl: string | null }[]; originalUrl: string | null; tracks: { label: string; blobUrl: string }[] },
  stepName: string
): string {
  if (stepName === 'stem_separation') {
    return project.originalUrl!
  }

  // Each step takes the output of the previous step
  const stepIndex = STEP_ORDER.indexOf(stepName)
  const prevStepName = STEP_ORDER[stepIndex - 1]
  const prevStep = project.steps.find((s) => s.stepName === prevStepName)

  if (!prevStep?.outputUrl) {
    throw new Error(`No output from previous step ${prevStepName}`)
  }

  return prevStep.outputUrl
}

function getStepHandler(stepName: string, tier: string): StepHandler {
  const freeHandlers: Record<string, StepHandler> = {
    stem_separation: freeStemSeparation,
    pitch_correction: freePitchCorrection,
    enhancement: freeEnhancement,
    recombine: freeRecombine,
    mastering: freeMastering,
  }

  const premiumHandlers: Record<string, StepHandler> = {
    stem_separation: premiumStemSeparation,
    pitch_correction: premiumPitchCorrection,
    enhancement: premiumEnhancement,
    recombine: freeRecombine, // Same FFmpeg for both tiers
    mastering: premiumMastering,
  }

  const handlers = tier === 'PREMIUM' ? premiumHandlers : freeHandlers
  const handler = handlers[stepName]
  if (!handler) throw new Error(`No handler for step: ${stepName}`)
  return handler
}
