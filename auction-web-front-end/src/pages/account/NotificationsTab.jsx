import { fmtDate } from './formatters'

export default function NotificationsTab({
  notifications,
  loadedCount,
  hasMore,
  onMarkRead,
  onMarkAllRead,
  onLoadMore,
  onNotificationClick,
}) {
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-extrabold text-slate-900">Tất cả thông báo</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Đã tải {loadedCount} thông báo</span>
          <button
            onClick={onMarkAllRead}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white"
          >
            Đánh dấu đã đọc tất cả
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => {
              if (onNotificationClick) {
                void onNotificationClick(n)
                return
              }

              if (!n.read) {
                onMarkRead([n.id])
              }
            }}
            className={`w-full rounded-xl p-3 text-left ring-1 ${
              n.read ? 'bg-slate-50 ring-slate-200' : 'bg-blue-50 ring-blue-200'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-slate-900">{n.title}</div>
              {!n.read && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">MỚI</span>}
            </div>
            <p className="mt-1 text-xs text-slate-600">{n.message}</p>
            <div className="mt-1 text-[11px] text-slate-400">{fmtDate(n.createdAt)}</div>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={onLoadMore}
          disabled={!hasMore}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Xem thêm thông báo cũ
        </button>
      </div>
    </section>
  )
}
