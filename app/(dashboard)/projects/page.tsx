'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getProjects } from '@/lib/api/projects'

const statusColors: Record<string, string> = {
  UPLOADING: 'text-muted',
  PROCESSING: 'text-warning',
  COMPLETED: 'text-success',
  FAILED: 'text-error',
}

export default function ProjectsPage() {
  const { data: projects, isLoading } = useQuery({ queryKey: ['projects'], queryFn: getProjects })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/projects/new"
          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
        >
          New Project
        </Link>
      </div>

      {isLoading ? (
        <div className="text-muted">Loading...</div>
      ) : !projects?.length ? (
        <div className="text-center py-16">
          <p className="text-muted mb-4">No projects yet</p>
          <Link
            href="/projects/new"
            className="inline-block px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors"
          >
            Upload Your First Recording
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block p-4 rounded-xl border border-border bg-surface hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{project.title}</h3>
                  <p className="text-sm text-muted mt-1">
                    {project.tier} &middot; {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-sm font-medium ${statusColors[project.status]}`}>
                  {project.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
