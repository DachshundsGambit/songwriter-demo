import api from './client'

export interface Project {
  id: string
  title: string
  tier: 'FREE' | 'PREMIUM'
  status: 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  originalUrl: string | null
  finalUrl: string | null
  duration: number | null
  createdAt: string
  updatedAt: string
  steps: ProcessingStep[]
  tracks: Track[]
}

export interface ProcessingStep {
  id: string
  stepName: string
  stepOrder: number
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  provider: string | null
  outputUrl: string | null
  errorMsg: string | null
  costCents: number | null
  updatedAt: string
}

export interface Track {
  id: string
  label: string
  blobUrl: string
}

export async function getProjects() {
  const res = await api.get('/projects')
  return res.data as Project[]
}

export async function getProject(id: string) {
  const res = await api.get(`/projects/${id}`)
  return res.data as Project
}

export async function createProject(data: { title: string; tier: 'FREE' | 'PREMIUM'; originalUrl: string }) {
  const res = await api.post('/projects', data)
  return res.data as Project
}

export async function retryStep(projectId: string, stepId: string) {
  const res = await api.post(`/projects/${projectId}/retry/${stepId}`)
  return res.data as Project
}
