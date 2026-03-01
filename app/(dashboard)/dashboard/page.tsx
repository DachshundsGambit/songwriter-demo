'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getProjects } from '@/lib/api/projects'
import { useAuthStore } from '@/lib/store/auth'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const { data: projects } = useQuery({ queryKey: ['projects'], queryFn: getProjects })

  const completed = projects?.filter((p) => p.status === 'COMPLETED').length ?? 0
  const processing = projects?.filter((p) => p.status === 'PROCESSING').length ?? 0
  const total = projects?.length ?? 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Welcome back, {user?.name}</h1>
      <p className="text-muted mb-8">Here&apos;s an overview of your demos</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-xl border border-border bg-surface">
          <div className="text-3xl font-bold">{total}</div>
          <div className="text-sm text-muted mt-1">Total Projects</div>
        </div>
        <div className="p-6 rounded-xl border border-border bg-surface">
          <div className="text-3xl font-bold text-warning">{processing}</div>
          <div className="text-sm text-muted mt-1">Processing</div>
        </div>
        <div className="p-6 rounded-xl border border-border bg-surface">
          <div className="text-3xl font-bold text-success">{completed}</div>
          <div className="text-sm text-muted mt-1">Completed</div>
        </div>
      </div>

      <Link
        href="/projects/new"
        className="inline-block px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors"
      >
        Create New Demo
      </Link>
    </div>
  )
}
