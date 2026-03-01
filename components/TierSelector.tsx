'use client'

interface TierSelectorProps {
  value: 'FREE' | 'PREMIUM'
  onChange: (tier: 'FREE' | 'PREMIUM') => void
}

const tiers = [
  {
    id: 'FREE' as const,
    name: 'Free',
    price: '~$0.05/demo',
    description: 'Open-source AI models via Replicate',
    features: ['Demucs stem separation', 'Basic auto-tune', 'FFmpeg loudness normalization'],
  },
  {
    id: 'PREMIUM' as const,
    name: 'Premium',
    price: '~$1-2/demo',
    description: 'Best-quality paid APIs',
    features: ['Kits.ai vocal separation', 'AI pitch correction', 'ElevenLabs enhancement', 'LANDR mastering'],
  },
]

export function TierSelector({ value, onChange }: TierSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tiers.map((tier) => (
        <button
          key={tier.id}
          type="button"
          onClick={() => onChange(tier.id)}
          className={`p-6 rounded-xl border text-left transition-colors ${
            value === tier.id
              ? 'border-accent bg-accent/5'
              : 'border-border bg-surface hover:bg-surface-hover'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg">{tier.name}</h3>
            <span className="text-sm text-muted">{tier.price}</span>
          </div>
          <p className="text-sm text-muted mb-3">{tier.description}</p>
          <ul className="space-y-1">
            {tier.features.map((f) => (
              <li key={f} className="text-sm text-foreground/80">
                &bull; {f}
              </li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  )
}
