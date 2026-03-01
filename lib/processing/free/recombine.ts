import type { StepResult } from '../types'
import { prisma } from '@/lib/db'
import { saveToBlobFromUrl } from '../replicate-client'
import { runFfmpeg, downloadToTmp } from '../ffmpeg'

/**
 * Recombine corrected vocals with original instruments using FFmpeg.
 * Both tiers use this same handler.
 */
export async function recombine(
  inputUrl: string,
  project: { id: string }
): Promise<StepResult> {
  // Get the instruments track from the stem separation step
  const stemStep = await prisma.processingStep.findFirst({
    where: { projectId: project.id, stepName: 'stem_separation', status: 'COMPLETED' },
  })

  const instrumentsUrl = (stemStep?.metadata as { instrumentsUrl?: string })?.instrumentsUrl
  if (!instrumentsUrl) {
    throw new Error('No instruments track found from stem separation')
  }

  const vocalsPath = await downloadToTmp(inputUrl, 'vocals.wav')
  const instrumentsPath = await downloadToTmp(instrumentsUrl, 'instruments.wav')

  const outputBuffer = await runFfmpeg((ffmpeg) =>
    ffmpeg
      .input(vocalsPath)
      .input(instrumentsPath)
      .complexFilter('[0:a][1:a]amix=inputs=2:duration=longest:dropout_transition=2[aout]')
      .outputOptions('-map', '[aout]', '-c:a', 'libmp3lame', '-q:a', '2')
  , 'mp3')

  const { put } = await import('@vercel/blob')
  const blob = await put(`processed/${Date.now()}-recombined.mp3`, outputBuffer, {
    access: 'public',
  })

  return {
    outputUrl: blob.url,
    provider: 'ffmpeg',
    costCents: 0,
    tracks: [{ label: 'recombined', url: blob.url }],
  }
}
