import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireAuth } from '@/lib/auth'

const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav', 'audio/wave', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/m4a']
const ALLOWED_EXTS = ['.mp3', '.wav', '.m4a']
const MAX_SIZE = 50 * 1024 * 1024 // 50MB

export async function POST(req: NextRequest) {
  try {
    requireAuth(req)

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: `Invalid file type. Got type="${file.type}" ext="${ext}". Only MP3, WAV, and M4A are accepted.` }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 50MB.' }, { status: 400 })
    }

    const blob = await put(`uploads/${Date.now()}-${file.name}`, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    if ((err as Error).message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Upload error:', err)
    return NextResponse.json({ error: `Upload failed: ${(err as Error).message}` }, { status: 500 })
  }
}
