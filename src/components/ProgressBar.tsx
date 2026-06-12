interface Props {
  pct: number
  done: number
  total: number
}

export default function ProgressBar({ pct, done, total }: Props) {
  return (
    <div>
      <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500 mt-1">
        {total === 0 ? 'No tasks yet' : `${done}/${total} tasks · ${pct}%`}
      </p>
    </div>
  )
}
