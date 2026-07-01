export default function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/55 p-[18px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
      role="presentation"
    >
      <div
        className="max-h-[min(92vh,900px)] w-full max-w-[980px] overflow-auto rounded-[14px] border border-white/12 bg-[#0b1220] shadow-[0_20px_70px_rgba(0,0,0,0.6)]"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-[14px]">
          <div className="font-extrabold">{title}</div>

          <button
            className="cursor-pointer rounded-[10px] border border-white/18 bg-white/6 px-2.5 py-2 text-[#e5e7eb] transition hover:bg-white/10"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>

        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
