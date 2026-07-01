import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiChevronDown, FiClock, FiFilter, FiRefreshCw, FiSearch } from 'react-icons/fi'
import PageHeader from '../../components/PageHeader.jsx'
import { formatDateTime } from '../../utils/format.js'
import {
  approveListing,
  fetchListings,
  rejectListing,
  selectFilteredListings,
  selectListing,
  setListingsFilters,
  setListingsPagination,
} from './listingsSlice.js'
import ListingDetailsModal from './ListingDetailsModal.jsx'
import Badge from '../../components/Badge.jsx'

const FALLBACK_IMG = 'https://placehold.co/400x300/1e293b/94a3b8?text=No+Image'

function getListingStatusLabel(status) {
  const s = String(status || 'SUBMITTED').toUpperCase()
  if (s === 'APPROVED') return 'Đã duyệt'
  if (s === 'REJECTED') return 'Đã từ chối'
  if (s === 'SUBMITTED') return 'Đang chờ duyệt'
  if (s === 'WAIT_FOR_PAYMENT') return 'Chờ thanh toán'
  if (s === 'SOLD') return 'Đã thanh toán'
  return s || 'Không xác định'
}

function StatusBadge({ status }) {
  const s = String(status || 'SUBMITTED')

  if (s === 'APPROVED') return <Badge variant="ok" label={getListingStatusLabel(s)} />
  if (s === 'REJECTED') return <Badge variant="bad" label={getListingStatusLabel(s)} />
  if (s === 'SUBMITTED') return <Badge variant="warn" label={getListingStatusLabel(s)} />
  if (s === 'WAIT_FOR_PAYMENT') return <Badge variant="warn" label={getListingStatusLabel(s)} />
  if (s === 'SOLD') return <Badge variant="info" label={getListingStatusLabel(s)} />
  return <Badge variant="warn" label={getListingStatusLabel(s)} />
}

function RejectDialog({ listing, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')

  if (!listing) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.6)]">
        <h2 className="mb-1 text-lg font-bold text-white">Từ chối bài đăng</h2>
        <p className="mb-4 text-sm text-white/60">
          Bài đăng:{' '}
          <span className="font-medium text-white">
            #{listing.id} – {listing.title || '(không tên)'}
          </span>
        </p>

        <label className="mb-1.5 block text-sm font-medium text-white/85">
          Lý do từ chối <span className="text-red-400">*</span>
        </label>

        <textarea
          className="min-h-[110px] w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-red-400/70"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Nhập lý do từ chối..."
          autoFocus
        />

        <div className="mt-4 flex justify-end gap-3">
          <button
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
            onClick={onCancel}
          >
            Hủy
          </button>

          <button
            className="inline-flex items-center justify-center rounded-xl border border-red-400/60 bg-red-500/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!reason.trim()}
            onClick={() => onConfirm(reason)}
          >
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  )
}

const btnBase =
  'inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60'
const btnDefault = `${btnBase} border-white/15 bg-white/[0.06] hover:bg-white/[0.1]`
const btnSuccess = `${btnBase} border-emerald-400/60 bg-emerald-500/20 hover:bg-emerald-500/30`
const btnDanger = `${btnBase} border-red-400/60 bg-red-500/20 hover:bg-red-500/30`
const selectClass =
  'admin-select w-full appearance-none rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 pr-11 text-sm text-white outline-none transition focus:border-blue-500/70'

function SelectShell({ children }) {
  return (
    <div className="admin-select-wrap">
      {children}
      <FiChevronDown className="admin-select-chevron" />
    </div>
  )
}

export default function ListingsPage() {
  const dispatch = useDispatch()
  const authUser = useSelector((s) => s.auth.user)

  const lStatus = useSelector((s) => s.listings.status)
  const lError = useSelector((s) => s.listings.error)
  const filters = useSelector((s) => s.listings.filters)
  const pagination = useSelector((s) => s.listings.pagination)
  const mutatingIds = useSelector((s) => s.listings.mutatingIds)
  const listings = useSelector(selectFilteredListings)

  const [rejectTarget, setRejectTarget] = useState(null)

  const doFetch = (overrides = {}) => {
    dispatch(
      fetchListings({
        page: overrides.page ?? pagination.page,
        size: overrides.size ?? pagination.size,
        status: overrides.status ?? filters.status,
        sortDirection: overrides.sortDirection ?? filters.sortDirection,
      }),
    )
  }

  useEffect(() => {
    doFetch({ page: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleStatusFilter = (status) => {
    dispatch(setListingsFilters({ status }))
    dispatch(setListingsPagination({ page: 0 }))
    dispatch(
      fetchListings({
        page: 0,
        size: pagination.size,
        status,
        sortDirection: filters.sortDirection,
      }),
    )
  }

  const handleSortChange = (sortDirection) => {
    dispatch(setListingsFilters({ sortDirection }))
    dispatch(setListingsPagination({ page: 0 }))
    dispatch(
      fetchListings({
        page: 0,
        size: pagination.size,
        status: filters.status,
        sortDirection,
      }),
    )
  }

  const handlePageChange = (newPage) => {
    dispatch(setListingsPagination({ page: newPage }))
    dispatch(
      fetchListings({
        page: newPage,
        size: pagination.size,
        status: filters.status,
        sortDirection: filters.sortDirection,
      }),
    )
  }

  const onApprove = (listing) => {
    dispatch(approveListing({ listingId: listing.id, authUser }))
  }

  const onRejectConfirm = (reason) => {
    if (!rejectTarget) return
    dispatch(
      rejectListing({
        listingId: rejectTarget.id,
        rejectedReason: reason,
        authUser,
      }),
    )
    setRejectTarget(null)
  }

  const { page, totalPages, totalElements, size } = pagination
  const pageStart = totalElements === 0 ? 0 : page * size + 1
  const pageEnd = Math.min((page + 1) * size, totalElements)

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Quản lý bài đăng"
          subtitle="Xem và duyệt các bài đăng xe từ người bán"
          right={
            <button
              className={`${btnDefault} admin-btn`}
              onClick={() => doFetch()}
              disabled={lStatus === 'loading'}
            >
              <FiRefreshCw className="h-4 w-4" />
              {lStatus === 'loading' ? 'Đang tải...' : 'Làm mới'}
            </button>
          }
        />

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_200px_160px]">
            <div>
              <label className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
                <FiSearch className="h-4 w-4" />
                Tìm kiếm
              </label>
              <input
                className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-500/70"
                value={filters.q}
                onChange={(e) => dispatch(setListingsFilters({ q: e.target.value }))}
                placeholder="Tiêu đề, tên xe, người bán..."
              />
            </div>

            <div>
              <label className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
                <FiFilter className="h-4 w-4" />
                Trạng thái
              </label>
              <SelectShell>
                <select
                  className={selectClass}
                  value={filters.status}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="SUBMITTED">Đang chờ duyệt</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REJECTED">Đã từ chối</option>
                  <option value="WAIT_FOR_PAYMENT">Chờ thanh toán</option>
                  <option value="SOLD">Đã thanh toán</option>
                </select>
              </SelectShell>
            </div>

            <div>
              <label className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
                <FiClock className="h-4 w-4" />
                Sắp xếp
              </label>
              <SelectShell>
                <select
                  className={selectClass}
                  value={filters.sortDirection}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="DESC">Mới nhất</option>
                  <option value="ASC">Cũ nhất</option>
                </select>
              </SelectShell>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-sm">
          {lStatus === 'loading' && (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-white/65">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Đang tải dữ liệu...
            </div>
          )}

          {lStatus === 'failed' && (
            <div className="m-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Lỗi tải dữ liệu: {String(lError)}
            </div>
          )}

          {lStatus !== 'loading' && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-white/[0.04] text-white/75">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Bài đăng</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Ảnh</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Người bán</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Xe</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Đã tạo vào</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Thay đổi</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Thao tác</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.06] bg-transparent">
                    {listings.map((l) => {
                      const isMutating = Boolean(mutatingIds?.[l.id])
                      const isApproved = String(l.status) === 'APPROVED'
                      const isRejected = String(l.status) === 'REJECTED'
                      const isSubmitted = String(l.status) === 'SUBMITTED'

                      return (
                        <tr key={l.id} className="align-top transition hover:bg-white/[0.03]">
                          <td className="px-4 py-4 font-mono text-xs text-white/50">#{l.id}</td>

                          <td className="max-w-[220px] px-4 py-4">
                            <div className="leading-snug font-semibold text-white">
                              {l.title || '—'}
                            </div>

                            <p className="mt-1 truncate text-xs text-white/45">
                              {l.description || 'Không có mô tả'}
                            </p>

                            {l.addressSell && (
                              <p className="mt-1 truncate text-xs text-white/45">
                                📍 {l.addressSell}
                              </p>
                            )}

                            {isRejected && l.rejectedReason && (
                              <div className="mt-2 rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-1.5 text-xs text-red-200">
                                <span className="font-medium">Từ chối:</span> {l.rejectedReason}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <img
                              src={l.thumbnailUrl || FALLBACK_IMG}
                              alt="thumbnail"
                              className="h-14 w-20 rounded-lg border border-white/10 object-cover"
                              onError={(e) => {
                                e.currentTarget.src = FALLBACK_IMG
                              }}
                            />
                          </td>

                          <td className="px-4 py-4">
                            {l.seller ? (
                              <div>
                                <div className="font-medium text-white">{l.seller.name}</div>
                                <div className="text-xs text-white/50">{l.seller.email}</div>
                                <div className="mt-1.5">
                                  {l.seller.verified ? (
                                    <Badge variant="ok" label="Đã xác thực" />
                                  ) : (
                                    <Badge variant="warn" label="Chưa xác thực" />
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-white/35">—</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-medium text-white">{l.car?.name || '—'}</div>
                            <div className="text-xs text-white/50">
                              {[l.car?.brand, l.car?.model, l.car?.year].filter(Boolean).join(' · ') || '—'}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <StatusBadge status={l.status} />
                          </td>

                          <td className="whitespace-nowrap px-4 py-4 text-xs text-white/60">
                            {formatDateTime(l.submittedAt)}
                          </td>

                          <td className="px-4 py-4">
                            {l.reviewedBy ? (
                              <div>
                                <div className="text-xs font-medium text-white/85">
                                  {l.reviewedBy.username}
                                </div>
                                <div className="text-xs text-white/50">
                                  {l.reviewedBy.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-white/40">Chưa duyệt</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="admin-button-shell flex-col">
                              <button
                                className={`${btnDefault} admin-btn`}
                                onClick={() => dispatch(selectListing(l.id))}
                              >
                                Chi tiết
                              </button>

                              <button
                                className={`${btnSuccess} admin-btn`}
                                onClick={() => onApprove(l)}
                                disabled={isApproved || isMutating}
                              >
                                {isMutating && isSubmitted ? '...' : 'Duyệt bài đăng'}
                              </button>

                              <button
                                className={`${btnDanger} admin-btn`}
                                onClick={() => setRejectTarget(l)}
                                disabled={isRejected || isMutating}
                              >
                                Từ chối
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}

                    {listings.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-10 text-center text-sm text-white/50">
                          Không có dữ liệu phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 0 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:flex-row">
                  <p className="text-xs text-white/50">
                    Hiển thị <span className="font-medium text-white/80">{pageStart}–{pageEnd}</span>{' '}
                    trong <span className="font-medium text-white/80">{totalElements}</span> kết quả
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => handlePageChange(0)}
                      disabled={page === 0}
                    >
                      «
                    </button>

                    <button
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                    >
                      ‹ Trước
                    </button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let p
                      if (totalPages <= 7) {
                        p = i
                      } else if (page < 4) {
                        p = i
                      } else if (page > totalPages - 4) {
                        p = totalPages - 7 + i
                      } else {
                        p = page - 3 + i
                      }

                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            p === page
                              ? 'border-blue-400/60 bg-blue-500/20 text-white'
                              : 'border-white/10 text-white/70 hover:bg-white/[0.04]'
                          }`}
                        >
                          {p + 1}
                        </button>
                      )
                    })}

                    <button
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                    >
                      Sau ›
                    </button>

                    <button
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => handlePageChange(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <ListingDetailsModal />

        <RejectDialog
          listing={rejectTarget}
          onConfirm={onRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      </div>
    </div>
  )
}