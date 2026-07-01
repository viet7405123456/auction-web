import { useEffect } from 'react'
import { FiCheckCircle, FiInfo, FiXCircle } from 'react-icons/fi'
import { useDispatch, useSelector } from 'react-redux'
import { removeToast } from '../../features/ui/uiSlice'

function AnimatedSuccessIcon() {
  return (
    <span className="toast-check-badge" aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="toast-check-circle"
        />
        <path
          d="M7.8 12.2l2.8 2.8 5.7-5.7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="toast-check-path"
        />
      </svg>
    </span>
  )
}

const toneMap = {
  success: {
    icon: FiCheckCircle,
    card: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    iconClass: 'text-emerald-600',
  },
  error: {
    icon: FiXCircle,
    card: 'border-rose-300 bg-rose-50 text-rose-900',
    iconClass: 'text-rose-600',
  },
  info: {
    icon: FiInfo,
    card: 'border-sky-300 bg-sky-50 text-sky-900',
    iconClass: 'text-sky-600',
  },
}

export default function GlobalToast() {
  const dispatch = useDispatch()
  const toasts = useSelector((state) => state.ui?.toasts || [])

  useEffect(() => {
    if (!toasts.length) return undefined

    const timers = toasts.map((toast) =>
      setTimeout(() => {
        dispatch(removeToast(toast.id))
      }, Math.max(1200, Number(toast.duration || 3200))),
    )

    return () => {
      timers.forEach((t) => clearTimeout(t))
    }
  }, [dispatch, toasts])

  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[120] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const tone = toneMap[toast.type] || toneMap.success
        const Icon = tone.icon
        return (
          <div
            key={toast.id}
            className={`toast-slide-in pointer-events-auto rounded-xl border px-3 py-2 shadow-lg ring-1 ring-white/60 ${tone.card}`}
          >
            <div className="flex items-start gap-2">
              {toast.type === 'success' ? (
                <span className={`mt-0.5 shrink-0 ${tone.iconClass}`}>
                  <AnimatedSuccessIcon />
                </span>
              ) : (
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.iconClass}`} />
              )}
              <div className="min-w-0">
                {toast.title && <div className="text-sm font-extrabold">{toast.title}</div>}
                {toast.message && <div className="text-sm font-semibold">{toast.message}</div>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
