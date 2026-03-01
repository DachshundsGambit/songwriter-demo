export interface StepResult {
  outputUrl: string
  provider: string
  externalId?: string
  costCents?: number
  metadata?: Record<string, unknown>
  tracks?: { label: string; url: string }[]
}

export type StepHandler = (
  inputUrl: string,
  project: { id: string; tier: string }
) => Promise<StepResult>
