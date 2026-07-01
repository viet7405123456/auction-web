const badgeVariants = {
  info: 'border-blue-500/60 bg-blue-500/18 text-white',
  ok: 'border-emerald-500/55 bg-emerald-500/20 text-white',
  warn: 'border-amber-500/55 bg-amber-500/20 text-white',
  bad: 'border-red-500/55 bg-red-500/20 text-white',
}

export default function Badge({ label, variant = 'info' }) {
  return (
    <span
      className={[
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs items-center gap-1.5',
        badgeVariants[variant] || badgeVariants.info,
      ].join(' ')}
    >
      {label}
    </span>
  )
}
