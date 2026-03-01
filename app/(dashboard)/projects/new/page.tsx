'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { createProject } from '@/lib/api/projects'
import { UploadDropzone } from '@/components/UploadDropzone'
import { TierSelector } from '@/components/TierSelector'

export default function NewProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [tier, setTier] = useState<'FREE' | 'PREMIUM'>('FREE')
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      router.push(`/projects/${project.id}`)
    },
    onError: () => {
      setError('Failed to create project. Please try again.')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadedUrl) {
      setError('Please upload a recording first.')
      return
    }
    mutation.mutate({ title: title || fileName.replace(/\.[^.]+$/, ''), tier, originalUrl: uploadedUrl })
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">New Project</h1>
      <p className="text-muted mb-8">Upload a recording and choose your processing tier</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Recording</label>
          {uploadedUrl ? (
            <div className="p-4 rounded-xl border border-success/30 bg-success/5">
              <p className="text-sm text-success font-medium">Uploaded: {fileName}</p>
              <button
                type="button"
                onClick={() => { setUploadedUrl(''); setFileName('') }}
                className="text-xs text-muted hover:text-foreground mt-1"
              >
                Remove
              </button>
            </div>
          ) : (
            <UploadDropzone onUploaded={(url, name) => { setUploadedUrl(url); setFileName(name) }} />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Project Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={fileName ? fileName.replace(/\.[^.]+$/, '') : 'My Demo'}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Processing Tier</label>
          <TierSelector value={tier} onChange={setTier} />
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={!uploadedUrl || mutation.isPending}
          className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? 'Creating...' : 'Create Demo'}
        </button>
      </form>
    </div>
  )
}
