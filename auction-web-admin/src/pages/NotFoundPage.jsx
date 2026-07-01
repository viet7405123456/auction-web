import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-sm">
        <div className="text-xl font-black text-white">404 - Not Found</div>
        <div className="mt-1.5 text-sm text-white/65">
          Trang không tồn tại.
        </div>
        <div className="my-4 border-t border-white/10" />
        <Link
          className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
          to="/admin"
        >
          Về Dashboard
        </Link>
      </div>
    </div>
  )
}
