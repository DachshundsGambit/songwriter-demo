'use client'

import { use } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProject, retryStep } from '@/lib/api/projects'
import { PipelineProgress } from '@/components/PipelineProgress'
import { WaveformPlayer } from '@/components/WaveformPlayer'
import { BeforeAfterPlayer } from '@/components/BeforeAfterPlayer'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const queryClient = useQueryClient()

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => getProject(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'PROCESSING' ? 3000 : false
    },
  })

  const retryMutation = useMutation({
    mutationFn: (stepId: string) => retryStep(id, stepId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
  })

  if (isLoading) return <div className="text-muted">Loading...</div>
  if (!project) return <div className="text-error">Project not found</div>

  const originalTrack = project.tracks.find((t) => t.label === 'original')
  const finalTrack = project.tracks.find((t) => t.label === 'final')

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <p className="text-sm text-muted mt-1">
            {project.tier} tier &middot; Created {new Date(project.createdAt).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Before/After Player */}
      {project.status === 'COMPLETED' && originalTrack && finalTrack && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Listen</h2>
          <BeforeAfterPlayer originalUrl={originalTrack.blobUrl} finalUrl={finalTrack.blobUrl} />
          <a
            href={finalTrack.blobUrl}
            download
            className="inline-block mt-4 px-4 py-2 rounded-lg bg-success hover:bg-success/80 text-white text-sm font-medium transition-colors"
          >
            Download Final Demo
          </a>
        </div>
      )}

      {/* Original recording player (when not completed) */}
      {project.status !== 'COMPLETED' && originalTrack && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Original Recording</h2>
          <WaveformPlayer url={originalTrack.blobUrl} />
        </div>
      )}

      {/* Pipeline Progress */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Processing Pipeline</h2>
        <PipelineProgress
          steps={project.steps}
          onRetry={(stepId) => retryMutation.mutate(stepId)}
        />
      </div>

      {/* Individual Tracks */}
      {project.tracks.filter((t) => t.label !== 'original' && t.label !== 'final').length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Intermediate Tracks</h2>
          <div className="space-y-3">
            {project.tracks
              .filter((t) => t.label !== 'original' && t.label !== 'final')
              .map((track) => (
                <WaveformPlayer key={track.id} url={track.blobUrl} label={track.label} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    UPLOADING: 'bg-muted/20 text-muted',
    PROCESSING: 'bg-warning/20 text-warning',
    COMPLETED: 'bg-success/20 text-success',
    FAILED: 'bg-error/20 text-error',
  }
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || ''}`}>
      {status}
    </span>
  )
}
