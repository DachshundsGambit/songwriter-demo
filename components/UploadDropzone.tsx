'use client'

import { useCallback, useState } from 'react'
import api from '@/lib/api/client'

interface UploadDropzoneProps {
  onUploaded: (url: string, fileName: string) => void
}

export function UploadDropzone({ onUploaded }: UploadDropzoneProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const uploadFile = useCallback(async (file: File) => {
    setError('')
    setUploading(true)
    setProgress(0)

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/wave', 'audio/mp4', 'audio/x-m4a', 'audio/aac']
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Only MP3, WAV, and M4A files are accepted.')
      setUploading(false)
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File too large. Maximum 50MB.')
      setUploading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100))
        },
      })

      onUploaded(res.data.url, file.name)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }, [onUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
        dragOver ? 'border-accent bg-accent/5' : 'border-border hover:border-muted'
      }`}
    >
      {uploading ? (
        <div>
          <div className="text-lg font-medium mb-2">Uploading...</div>
          <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted mt-2">{progress}%</p>
        </div>
      ) : (
        <div>
          <div className="text-4xl mb-3 opacity-50">&#127925;</div>
          <p className="text-lg font-medium mb-1">Drop your recording here</p>
          <p className="text-sm text-muted mb-4">MP3, WAV, or M4A, up to 50MB</p>
          <label className="inline-block px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium cursor-pointer transition-colors">
            Browse Files
            <input
              type="file"
              accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a"
              onChange={handleChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-error">{error}</p>}
    </div>
  )
}
