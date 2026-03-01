import type { StepResult } from '../types'

/**
 * Free tier enhancement — pass-through (no processing).
 * The free tier skips vocal enhancement to keep costs near zero.
 */
export async function enhancement(inputUrl: string): Promise<StepResult> {
  return {
    outputUrl: inputUrl,
    provider: 'passthrough',
    costCents: 0,
  }
}
