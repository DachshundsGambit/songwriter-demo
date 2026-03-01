import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4">Songwriter Demo</h1>
        <p className="text-xl text-muted mb-8">
          Upload your raw recordings and get polished demos powered by AI.
          Stem separation, pitch correction, enhancement, and mastering — all automatic.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-medium transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 rounded-lg border border-border hover:bg-surface text-foreground font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
