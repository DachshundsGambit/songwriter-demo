import type { StepResult } from '../types'
import { prisma } from '@/lib/db'
import { runReplicate, saveToBlobFromUrl } from '../replicate-client'

/**
 * Recombine corrected vocals with original instruments using FFmpeg via Replicate.
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

  // Use FFmpeg via Replicate to mix the two audio streams
  const output = await runReplicate(
    'sakemin/ffmpeg',
    {
      input_1: inputUrl,
      input_2: instrumentsUrl,
      cmd: '-filter_complex "[0:a][1:a]amix=inputs=2:duration=longest:dropout_transition=2[aout]" -map "[aout]" -c:a libmp3lame -q:a 2',
      output_extension: 'mp3',
    }
  ) as string | { output: string }

  const resultUrl = typeof output === 'string' ? output : output.output
  const blobUrl = await saveToBlobFromUrl(resultUrl, 'recombined.mp3')

  return {
    outputUrl: blobUrl,
    provider: 'replicate/ffmpeg',
    costCents: 0,
    tracks: [{ label: 'recombined', url: blobUrl }],
  }
}
