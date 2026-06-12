interface Props {
  title: string
  phase: string
}

export default function PlaceholderView({ title, phase }: Props) {
  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-slate-500 text-sm">Coming in {phase}.</p>
    </div>
  )
}
