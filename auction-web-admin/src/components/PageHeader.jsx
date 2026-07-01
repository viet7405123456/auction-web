export default function PageHeader({ title, subtitle, right }) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="mb-3 text-[20px] font-semibold">{title}</h1>
        {subtitle && <div className="text-white/70">{subtitle}</div>}
      </div>
      {right}
    </div>
  )
}
