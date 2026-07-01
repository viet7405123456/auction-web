import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Modal from '../../components/Modal.jsx'
import Badge from '../../components/Badge.jsx'
import { formatDateTime } from '../../utils/format.js'
import {
  approveListing,
  clearSelectedListing,
  listingsSelectors,
  rejectListing,
} from './listingsSlice.js'

const FALLBACK_IMG = 'https://placehold.co/400x300/1e293b/94a3b8?text=No+Image'

function StatusBadge({ status }) {
  const s = String(status || 'SUBMITTED')

  if (s === 'APPROVED') return <Badge variant="ok" label="ĐÃ DUYỆT" />
  if (s === 'REJECTED') return <Badge variant="bad" label="ĐÃ TỪ CHỐI" />
  if (s === 'SUBMITTED') return <Badge variant="warn" label="ĐANG CHỜ DUYỆT" />
  if (s === 'WAIT_FOR_PAYMENT') return <Badge variant="warn" label="CHỜ THANH TOÁN" />
  if (s === 'SOLD') return <Badge variant="info" label="ĐÃ THANH TOÁN" />
  return <Badge variant="warn" label={s} />
}

const btnBase =
  'inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50'
const btnDefault = `${btnBase} border-white/15 bg-white/[0.06] hover:bg-white/[0.1]`
const btnSuccess = `${btnBase} border-emerald-400/60 bg-emerald-500/20 hover:bg-emerald-500/30`
const btnDanger = `${btnBase} border-red-400/60 bg-red-500/20 hover:bg-red-500/30`

function InfoRow({ label, value }) {
  return (
    <>
      <div className="text-xs font-medium text-white/50">{label}</div>
      <div className="text-sm text-white">{value ?? '—'}</div>
    </>
  )
}

export default function ListingDetailsModal() {
  const dispatch = useDispatch()
  const selectedId = useSelector((s) => s.listings.selectedListingId)
  const authUser = useSelector((s) => s.auth.user)
  const listing = useSelector((s) =>
    selectedId ? listingsSelectors.selectById(s, selectedId) : null,
  )

  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const close = () => {
    setShowRejectForm(false)
    setRejectReason('')
    dispatch(clearSelectedListing())
  }

  const title = useMemo(() => {
    if (!listing) return ''
    return `Bài đăng #${listing.id} – ${listing.title || 'Chi tiết'}`
  }, [listing])

  if (!listing) return null

  const car = listing.car || {}
  const images = Array.isArray(car.images)
    ? [...car.images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : []
  const docs = Array.isArray(listing.documents) ? listing.documents : []

  const approve = () => {
    dispatch(approveListing({ listingId: listing.id, authUser }))
  }

  const confirmReject = () => {
    if (!rejectReason.trim()) return
    dispatch(
      rejectListing({
        listingId: listing.id,
        rejectedReason: rejectReason,
        authUser,
      }),
    )
    setShowRejectForm(false)
    setRejectReason('')
  }

  return (
    <Modal title={title} onClose={close}>
      <div className="space-y-5 text-white">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={listing.status} />
            {listing.seller?.verified ? (
              <Badge variant="ok" label="Người bán đã xác thực" />
            ) : (
              <Badge variant="warn" label="Người bán chưa xác thực" />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button className={btnDefault} onClick={close}>
              Đóng
            </button>

            <button
              className={btnSuccess}
              onClick={approve}
              disabled={String(listing.status) === 'APPROVED'}
            >
              Duyệt bài đăng
            </button>

            <button
              className={btnDanger}
              onClick={() => {
                setShowRejectForm((v) => !v)
                setRejectReason('')
              }}
              disabled={String(listing.status) === 'REJECTED'}
            >
              {showRejectForm ? 'Huỷ từ chối' : 'Từ chối'}
            </button>
          </div>
        </div>

        {showRejectForm && (
          <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
            <p className="mb-2 text-sm font-semibold text-red-200">Lý do từ chối</p>

            <textarea
              className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-red-400/70"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối bài đăng..."
              autoFocus
            />

            <div className="mt-3 flex justify-end gap-2">
              <button
                className={btnDefault}
                onClick={() => {
                  setShowRejectForm(false)
                  setRejectReason('')
                }}
              >
                Huỷ
              </button>

              <button
                className={btnDanger}
                disabled={!rejectReason.trim()}
                onClick={confirmReject}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="mb-4 text-base font-bold text-white">Thông tin bài đăng</h3>

            <div className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-3">
              <InfoRow label="ID" value={listing.id} />
              <InfoRow label="Tiêu đề" value={listing.title} />
              <InfoRow label="Trạng thái" value={listing.status} />
              <InfoRow label="Địa chỉ bán" value={listing.addressSell} />
              <InfoRow label="Số người đã xem" value={listing.viewCount ?? 0} />
              <InfoRow label="Ngày gửi" value={formatDateTime(listing.submittedAt)} />
              <InfoRow label="Ngày duyệt" value={formatDateTime(listing.approvedAt)} />
              <InfoRow
                label="Người duyệt"
                value={
                  listing.reviewedBy
                    ? `${listing.reviewedBy.name || ''}${
                        listing.reviewedBy.email ? ` (${listing.reviewedBy.email})` : ''
                      }`
                    : null
                }
              />
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="mb-1.5 text-xs font-medium text-white/50">Mô tả</div>
              <div className="rounded-xl bg-black/20 p-3 text-sm leading-6 text-white/80">
                {listing.description || 'Không có mô tả'}
              </div>
            </div>

            {listing.rejectedReason && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="mb-1.5 text-xs font-medium text-red-200">Lý do từ chối</div>
                <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
                  {listing.rejectedReason}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="mb-4 text-base font-bold text-white">Thông tin người bán</h3>

            {listing.seller ? (
              <div className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-3">
                <InfoRow label="Tên" value={listing.seller.name} />
                <InfoRow label="Email" value={listing.seller.email} />
                <InfoRow
                  label="Xác thực"
                  value={
                    listing.seller.verified ? (
                      <Badge variant="ok" label="Đã xác thực" />
                    ) : (
                      <Badge variant="warn" label="Chưa xác thực" />
                    )
                  }
                />
              </div>
            ) : (
              <p className="text-sm text-white/45">Không có thông tin</p>
            )}

            <div className="mt-5 border-t border-white/10 pt-5">
              <h3 className="mb-4 text-base font-bold text-white">Thông tin xe</h3>

              <div className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-3">
                <InfoRow label="Tên xe" value={car.name} />
                <InfoRow label="Hãng / Dòng" value={`${car.brand || '—'} / ${car.model || '—'}`} />
                <InfoRow label="Năm SX" value={car.year} />
                <InfoRow label="Nhiên liệu" value={car.fuelType} />
                <InfoRow label="Hộp số" value={car.transmission} />
                <InfoRow label="Kiểu dáng" value={car.bodyType} />
                <InfoRow label="Động cơ" value={car.engine} />
                <InfoRow label="Công suất" value={car.horsepower} />
                <InfoRow label="Số km" value={car.mileage ? `${car.mileage} km` : null} />
                <InfoRow label="Màu" value={car.color} />
                <InfoRow label="Số ghế" value={car.seats} />
                <InfoRow label="Xuất xứ" value={car.origin} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="mb-4 text-base font-bold text-white">Ảnh xe</h3>

          {images.length === 0 ? (
            <div className="rounded-xl bg-black/20 p-4 text-sm text-white/45">
              Chưa có ảnh.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {images.map((img) => (
                <a
                  key={img.imageId}
                  href={img.imageUrl || FALLBACK_IMG}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                >
                  <img
                    src={img.imageUrl || FALLBACK_IMG}
                    alt={`car-${img.imageId}`}
                    className="h-48 w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMG
                    }}
                  />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="mb-4 text-base font-bold text-white">Giấy tờ đính kèm</h3>

          {docs.length === 0 ? (
            <div className="rounded-xl bg-black/20 p-4 text-sm text-white/45">
              Chưa có giấy tờ.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/[0.04] text-white/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      File
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.06]">
                  {docs.map((d) => (
                    <tr key={d.documentId} className="transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <Badge variant="info" label={String(d.type)} />
                      </td>

                      <td className="px-4 py-3">
                        <a
                          className="text-sm font-medium text-blue-300 transition hover:text-blue-200"
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Mở file ↗
                        </a>
                        <div className="mt-1 break-all text-xs text-white/40">{d.fileUrl}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}