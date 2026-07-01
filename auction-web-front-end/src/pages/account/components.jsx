import { useState, useEffect } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

export function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition hover:cursor-pointer ${
        active
          ? 'bg-red-600 text-white ring-1 ring-red-700 shadow-sm'
          : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50'
      }` }
    >
      <Icon className="text-sm" />
      {label}
    </button>
  )
}

export function OverviewCard({ icon: Icon, title, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</div>
        <Icon className="text-slate-400" />
      </div>
      <div className="mt-3 text-2xl font-extrabold text-slate-900">{value}</div>
    </button>
  )
}

export function ListingImageSlider({ images = [] }) {
  const safeImages = images?.length ? images : [{ imageUrl: 'https://placehold.co/800x500/e2e8f0/64748b?text=No+Image' }]
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    setIdx(0)
  }, [safeImages.length])

  const goPrev = () => {
    setIdx((prev) => (prev - 1 + safeImages.length) % safeImages.length)
  }

  const goNext = () => {
    setIdx((prev) => (prev + 1) % safeImages.length)
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <img src={safeImages[idx]?.imageUrl} alt="listing" className="h-72 w-full object-cover" />

        {safeImages.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/70 p-2 text-white shadow transition hover:bg-slate-900 hover:cursor-pointer"
              aria-label="Ảnh trước"
            >
              <FaChevronLeft className="text-sm" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-900/70 p-2 text-white shadow transition hover:bg-slate-900 hover:cursor-pointer"
              aria-label="Ảnh tiếp theo"
            >
              <FaChevronRight className="text-sm" />
            </button>
          </>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {safeImages.map((img, i) => (
          <button
            key={img.imageId || i}
            onClick={() => setIdx(i)}
            className={`overflow-hidden rounded-lg ring-2 hover:cursor-pointer ${idx === i ? 'ring-red-500' : 'ring-transparent'}`}
          >
            <img src={img.imageUrl} alt="thumb" className="h-16 w-24 object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
