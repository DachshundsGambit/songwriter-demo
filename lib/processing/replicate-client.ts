import Replicate from 'replicate'
import { put } from '@vercel/blob'

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

export { replicate }

/**
 * Downloads a file from a URL and uploads it to Vercel Blob.
 * Returns the Blob URL.
 */
export async function saveToBlobFromUrl(url: string, filename: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`)

  const buffer = await response.arrayBuffer()
  const blob = await put(`processed/${Date.now()}-${filename}`, Buffer.from(buffer), {
    access: 'public',
  })
  return blob.url
}

/**
 * Runs a Replicate model and waits for completion.
 * Returns the prediction output.
 */
export async function runReplicate(
  model: `${string}/${string}` | `${string}/${string}:${string}`,
  input: Record<string, unknown>
): Promise<unknown> {
  const output = await replicate.run(model, { input })
  return output
}
