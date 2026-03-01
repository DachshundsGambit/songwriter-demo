import ffmpeg from 'fluent-ffmpeg'
import pathToFfmpeg from 'ffmpeg-static'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFile, readFile, unlink } from 'fs/promises'
import { randomUUID } from 'crypto'

if (pathToFfmpeg) {
  ffmpeg.setFfmpegPath(pathToFfmpeg)
}

/**
 * Downloads a URL to a temporary file. Returns the file path.
 */
export async function downloadToTmp(url: string, filename: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const path = join(tmpdir(), `${randomUUID()}-${filename}`)
  await writeFile(path, buffer)
  return path
}

/**
 * Runs an ffmpeg command configured by the builder function.
 * Returns the output file as a Buffer.
 */
export async function runFfmpeg(
  builder: (cmd: ffmpeg.FfmpegCommand) => ffmpeg.FfmpegCommand,
  outputExt: string
): Promise<Buffer> {
  const outputPath = join(tmpdir(), `${randomUUID()}-output.${outputExt}`)

  const cmd = builder(ffmpeg())

  await new Promise<void>((resolve, reject) => {
    cmd
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err: Error) => reject(err))
      .run()
  })

  const buffer = await readFile(outputPath)
  await unlink(outputPath).catch(() => {})
  return buffer
}
