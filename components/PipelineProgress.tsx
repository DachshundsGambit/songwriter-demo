'use client'

import type { ProcessingStep } from '@/lib/api/projects'

const stepLabels: Record<string, string> = {
  stem_separation: 'Stem Separation',
  pitch_correction: 'Pitch Correction',
  enhancement: 'Enhancement',
  recombine: 'Recombine',
  mastering: 'Mastering',
}

const statusStyles: Record<string, { dot: string; line: string; text: string }> = {
  PENDING: { dot: 'bg-border', line: 'bg-border', text: 'text-muted' },
  RUNNING: { dot: 'bg-warning animate-pulse', line: 'bg-border', text: 'text-warning' },
  COMPLETED: { dot: 'bg-success', line: 'bg-success', text: 'text-success' },
  FAILED: { dot: 'bg-error', line: 'bg-error', text: 'text-error' },
}

interface PipelineProgressProps {
  steps: ProcessingStep[]
  onRetry?: (stepId: string) => void
}

export function PipelineProgress({ steps, onRetry }: PipelineProgressProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => {
        const styles = statusStyles[step.status]
        const isLast = i === steps.length - 1
        return (
          <div key={step.id} className="flex gap-4">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full mt-1.5 ${styles.dot}`} />
              {!isLast && <div className={`w-0.5 flex-1 my-1 ${styles.line}`} />}
            </div>

            {/* Content */}
            <div className={`pb-6 ${isLast ? '' : ''}`}>
              <div className="flex items-center gap-2">
                <span className={`font-medium text-sm ${styles.text}`}>
                  {stepLabels[step.stepName] || step.stepName}
                </span>
                {step.provider && (
                  <span className="text-xs text-muted px-1.5 py-0.5 rounded bg-border/50">
                    {step.provider}
                  </span>
                )}
              </div>
              {step.status === 'RUNNING' && (
                <p className="text-xs text-muted mt-1">Processing...</p>
              )}
              {step.status === 'FAILED' && (
                <div className="mt-1">
                  <p className="text-xs text-error">{step.errorMsg || 'Step failed'}</p>
                  {onRetry && (
                    <button
                      onClick={() => onRetry(step.id)}
                      className="mt-1 text-xs text-accent hover:underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
              {step.costCents != null && step.costCents > 0 && (
                <p className="text-xs text-muted mt-0.5">${(step.costCents / 100).toFixed(3)}</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
