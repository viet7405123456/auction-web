import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiChevronDown, FiFilter, FiLayers, FiRefreshCw, FiSearch } from 'react-icons/fi'
import Badge from '../../components/Badge.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Modal from '../../components/Modal.jsx'
import { getAdminAuctions, cancelAdminAuction, getAuctionResult } from '../../api/auctionsApi.js'
import { formatDateTime } from '../../utils/format.js'
import { fetchUsers, selectUser, usersSelectors } from '../users/usersSlice.js'
import UserDetailsModal from '../users/UserDetailsModal.jsx'

function formatVnd(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

function statusBadge(status) {
  const s = String(status || '')
  if (s === 'SCHEDULED') return <Badge variant="warn" label="SẮP DIỄN RA" />
  if (s === 'LIVE') return <Badge variant="ok" label="ĐANG DIỄN RA" />
  if (s === 'ENDED') return <Badge variant="info" label="ĐÃ KẾT THÚC" />
  if (s === 'CANCELLED') return <Badge variant="bad" label="ĐÃ HỦY" />
  return <Badge variant="info" label={s || 'KHÔNG XÁC ĐỊNH'} />
}

function canCancelAuction(auction) {
  if (!auction) return false
  if (String(auction.status) !== 'SCHEDULED') return false
  if (!auction.startTime) return false
  const start = new Date(auction.startTime)
  if (Number.isNaN(start.getTime())) return false
  return start.getTime() > Date.now()
}

const FALLBACK_IMG = 'https://placehold.co/400x300/1e293b/94a3b8?text=No+Image'
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

function normalizeListingForModal(listingLike) {
  if (!listingLike) return null
  const car = listingLike.car || {}
  return {
    id: listingLike.id,
    title: listingLike.title || '',
    description: listingLike.description || '',
    status: listingLike.status || '',
    addressSell: listingLike.addressSell || '',
    submittedAt: listingLike.submittedAt || null,
    approvedAt: listingLike.approvedAt || null,
    rejectedReason: listingLike.rejectedReason || null,
    thumbnailUrl: listingLike.thumbnailUrl || '',
    seller: listingLike.seller || null,
    reviewedBy: listingLike.reviewedBy || null,
    car: {
      name: car.name || '',
      brand: car.brand || '',
      model: car.model || '',
      year: car.year || '',
      fuelType: car.fuelType || '',
      transmission: car.transmission || '',
      bodyType: car.bodyType || '',
      engine: car.engine || '',
      horsepower: car.horsepower || '',
      mileage: car.mileage || '',
      color: car.color || '',
      seats: car.seats || '',
      origin: car.origin || '',
      images: Array.isArray(car.images) ? car.images : [],
    },
    documents: Array.isArray(listingLike.documents) ? listingLike.documents : [],
  }
}

function ListingDetailPreviewModal({ listing, onClose }) {
  if (!listing) return null

  const car = listing.car || {}
  const images = Array.isArray(car.images)
    ? [...car.images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : []
  const docs = Array.isArray(listing.documents) ? listing.documents : []

  const infoRow = (label, value) => (
    <>
      <div className="text-xs font-medium text-white/50">{label}</div>
      <div className="text-sm text-white">{value ?? '—'}</div>
    </>
  )

  return (
    <Modal title={`Bài đăng #${listing.id} - ${listing.title || 'Chi tiết'}`} onClose={onClose}>
      <div className="space-y-5 text-white">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="mb-4 text-base font-bold text-white">Thông tin bài đăng</h3>
            <div className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-3">
              {infoRow('ID', listing.id)}
              {infoRow('Tiêu đề', listing.title)}
              {infoRow('Trạng thái', listing.status)}
              {infoRow('Địa chỉ bán', listing.addressSell)}
              {infoRow('Ngày gửi', formatDateTime(listing.submittedAt))}
              {infoRow('Ngày duyệt', formatDateTime(listing.approvedAt))}
              {infoRow(
                'Người duyệt',
                listing.reviewedBy
                  ? `${listing.reviewedBy.name || listing.reviewedBy.username || ''}${
                      listing.reviewedBy.email ? ` (${listing.reviewedBy.email})` : ''
                    }`
                  : null,
              )}
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
                {infoRow('Tên', listing.seller.name || listing.seller.username)}
                {infoRow('Email', listing.seller.email)}
                {infoRow('Xác thực', listing.seller.verified ? 'Đã xác thực' : 'Chưa xác thực')}
              </div>
            ) : (
              <p className="text-sm text-white/45">Không có thông tin</p>
            )}

            <div className="mt-5 border-t border-white/10 pt-5">
              <h3 className="mb-4 text-base font-bold text-white">Thông tin xe</h3>
              <div className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-3">
                {infoRow('Tên xe', car.name)}
                {infoRow('Hãng / Dòng', `${car.brand || '—'} / ${car.model || '—'}`)}
                {infoRow('Năm SX', car.year)}
                {infoRow('Nhiên liệu', car.fuelType)}
                {infoRow('Hộp số', car.transmission)}
                {infoRow('Kiểu dáng', car.bodyType)}
                {infoRow('Động cơ', car.engine)}
                {infoRow('Công suất', car.horsepower)}
                {infoRow('Số km', car.mileage ? `${car.mileage} km` : null)}
                {infoRow('Màu', car.color)}
                {infoRow('Số ghế', car.seats)}
                {infoRow('Xuất xứ', car.origin)}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <h3 className="mb-4 text-base font-bold text-white">Ảnh xe</h3>
          {images.length === 0 ? (
            <div className="rounded-xl bg-black/20 p-4 text-sm text-white/45">Chưa có ảnh.</div>
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
            <div className="rounded-xl bg-black/20 p-4 text-sm text-white/45">Chưa có giấy tờ.</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/[0.04] text-white/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Loại</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">File</th>
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

function getWinnerInfo(auction, users = []) {
  if (!auction) return null

  const result = auction.auctionResult || {}
  const winnerUserId =
    result.winnerUserId ??
    auction?.winnerUserId ??
    auction?.winner?.userId ??
    auction?.winner?.id ??
    null

  const winnerName =
    result.winnerDisplayName ||
    result.winnerUsername ||
    auction?.winnerDisplayName ||
    auction?.winnerName ||
    auction?.winnerUsername ||
    auction?.winner?.name ||
    auction?.winner?.username ||
    null

  const winnerEmail =
    result.winnerEmail ||
    auction?.winnerEmail ||
    auction?.winner?.email ||
    null

  const winnerBidAmount =
    result.winnerBidAmount ??
    result.winningBidAmount ??
    auction?.winnerBidAmount ??
    auction?.currentHighestBid ??
    null

  const winnerUser =
    users.find((user) => {
      const userName = String(user?.username || '').toLowerCase()
      const userEmail = String(user?.email || '').toLowerCase()
      const targetName = String(winnerName || '').toLowerCase()
      return targetName && (userName === targetName || userEmail === targetName)
    }) || null

  if (!winnerUserId && !winnerName && !winnerUser) return null

  const closedAt = result.closedAt || auction?.endTime || null

  return {
    auctionId: auction.auctionId,
    userId: winnerUserId ?? winnerUser?.userId ?? null,
    name: winnerName || winnerUser?.username || null,
    email: winnerEmail || winnerUser?.email || null,
    winnerBidAmount,
    closedAt,
    user: winnerUser,
  }
}

function WinnerInfoModal({ winner, onClose }) {
  if (!winner) return null

  const displayName = winner.name || winner.user?.username || `User #${winner.userId}`

  const infoRow = (label, value) => (
    <>
      <div className="text-xs font-medium text-white/50">{label}</div>
      <div className="text-sm text-white">{value ?? '—'}</div>
    </>
  )

  return (
    <Modal title={`Người chiến thắng - Phiên #${winner.auctionId}`} onClose={onClose}>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-4 text-base font-bold text-white">Thông tin người chiến thắng</div>
        <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-3">
          {infoRow('Họ tên / Username', displayName)}
          {infoRow('User ID', winner.userId)}
          {infoRow('Email', winner.email)}
          {infoRow('Giá thắng', formatVnd(winner.winnerBidAmount))}
          {infoRow('Thời điểm kết thúc', formatDateTime(winner.closedAt))}
        </div>
      </div>
    </Modal>
  )
}

export default function AuctionsPage() {
  const dispatch = useDispatch()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])

  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [mutatingId, setMutatingId] = useState(null)
  const [selectedListing, setSelectedListing] = useState(null)
  const [selectedWinner, setSelectedWinner] = useState(null)
  const users = useSelector(usersSelectors.selectAll)

  useEffect(() => {
    dispatch(fetchUsers({ page: 0, size: 1000 }))
  }, [dispatch])

  const fetchData = async () => {
    setStatus('loading')
    setError(null)
    try {
      const res = await getAdminAuctions({ page, size, status: statusFilter })
      const content = Array.isArray(res?.content) ? res.content : []
      const resolved = await Promise.all(
        content.map(async (auction) => {
          if (String(auction?.status) !== 'ENDED') return auction

          try {
            const result = await getAuctionResult(auction.auctionId)
            return {
              ...auction,
              auctionResult: {
                ...(auction.auctionResult || {}),
                winnerUserId: result?.winnerUserId ?? auction?.auctionResult?.winnerUserId ?? null,
                auctionResultStatus: result?.auctionResultStatus ?? auction?.auctionResult?.auctionResultStatus ?? null,
                winnerDisplayName: result?.winnerDisplayName ?? auction?.auctionResult?.winnerDisplayName ?? null,
                winnerUsername: result?.winnerUsername ?? auction?.auctionResult?.winnerUsername ?? null,
                winnerEmail: result?.winnerEmail ?? auction?.auctionResult?.winnerEmail ?? null,
                winnerBidAmount: result?.winningBidAmount ?? auction?.auctionResult?.winnerBidAmount ?? null,
              },
            }
          } catch {
            return auction
          }
        }),
      )

      setItems(resolved)
      setTotalPages(res?.totalPages ?? 1)
      setTotalElements(res?.totalElements ?? 0)
      setStatus('succeeded')
    } catch (err) {
      setStatus('failed')
      setError(err?.response?.data || err?.message || 'Không tải được danh sách phiên đấu giá')
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, size, statusFilter])

  const filteredItems = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return items
    return items.filter((a) => {
      const hay = `${a.auctionId || ''} ${a.listingId || ''} ${a.status || ''}`.toLowerCase()
      return hay.includes(needle)
    })
  }, [items, q])

  const handleOpenWinner = (auction) => {
    const winnerInfo = getWinnerInfo(auction, users)
    if (!winnerInfo) return

    if (winnerInfo.user?.userId != null) {
      dispatch(selectUser(winnerInfo.user.userId))
      return
    }

    setSelectedWinner(winnerInfo)
  }

  const handleCancelAuction = async (auction) => {
    if (!canCancelAuction(auction)) return
    const ok = window.confirm(`Bạn có chắc muốn hủy phiên #${auction.auctionId} không?`)
    if (!ok) return

    setMutatingId(auction.auctionId)
    try {
      await cancelAdminAuction(auction.auctionId)
      await fetchData()
    } catch (err) {
      const message = err?.response?.data || err?.message || 'Không thể hủy phiên đấu giá'
      window.alert(String(message))
    } finally {
      setMutatingId(null)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Quản lý phiên đấu giá"
        subtitle="Theo dõi phiên, lọc theo trạng thái và hủy phiên chưa bắt đầu"
        right={
          <button
            className="admin-btn inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
            onClick={fetchData}
            disabled={status === 'loading'}
          >
            <FiRefreshCw className="h-4 w-4" />
            Làm mới
          </button>
        }
      />

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_120px] md:items-end">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
              <FiSearch className="h-4 w-4" />
              Tìm kiếm
            </div>
            <input
              className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-500/70"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo ID phiên, ID bài đăng, trạng thái..."
            />
          </div>

          <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
              <FiFilter className="h-4 w-4" />
              Trạng thái phiên
            </div>
            <SelectShell>
              <select
                className={selectClass}
                value={statusFilter}
                onChange={(e) => {
                  setPage(0)
                  setStatusFilter(e.target.value)
                }}
              >
                <option value="all">Tất cả</option>
                <option value="SCHEDULED">Sắp diễn ra</option>
                <option value="LIVE">Đang diễn ra</option>
                <option value="ENDED">Đã kết thúc</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </SelectShell>
          </div>

          <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
              <FiLayers className="h-4 w-4" />
              Số dòng
            </div>
            <SelectShell>
              <select
                className={selectClass}
                value={size}
                onChange={(e) => {
                  setPage(0)
                  setSize(Number(e.target.value))
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </SelectShell>
          </div>
        </div>

        <div className="my-4 border-t border-white/10" />

        {status === 'loading' && <div className="text-sm text-white/65">Đang tải...</div>}
        {status === 'failed' && <div className="text-sm text-red-200">Lỗi: {String(error)}</div>}

        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full divide-y divide-white/10 text-sm">
            <thead className="bg-white/[0.04] text-white/70">
              <tr>
                <th className="w-[110px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Mã phiên</th>
                <th className="w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Bài đăng</th>
                <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Giá khởi điểm</th>
                <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Giá dự trữ</th>
                <th className="w-[150px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Bước giá</th>
                <th className="w-[160px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Giá cao nhất hiện tại</th>
                <th className="w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Người chiến thắng</th>
                <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Trạng thái</th>
                <th className="w-[210px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Bắt đầu / Kết thúc</th>
                <th className="w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] bg-transparent text-white/90">
              {filteredItems.map((a) => (
                <tr key={a.auctionId} className="transition hover:bg-white/[0.03]">
                  <td className="px-4 py-3">{a.auctionId}</td>
                  <td className="px-4 py-3">
                    <button
                      className="admin-btn inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={() => setSelectedListing(normalizeListingForModal(a.listing))}
                      disabled={!a.listing}
                    >
                      {a.listing ? `Xem chi tiết` : `Bài đăng #${a.listingId || '—'}`}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/70">{formatVnd(a.startingPrice)}</td>
                  <td className="px-4 py-3 text-xs text-white/70">{formatVnd(a.reservePrice)}</td>
                  <td className="px-4 py-3 text-xs text-white/70">{formatVnd(a.bidIncrement)}</td>
                  <td className="px-4 py-3 text-xs text-white/70">{formatVnd(a.currentHighestBid)}</td>
                  <td className="px-4 py-3 text-xs text-white/70">
                    {(() => {
                      const winnerInfo = getWinnerInfo(a, users)
                      if (winnerInfo) {
                        return (
                          <button
                            className="admin-btn inline-flex items-center justify-center rounded-lg border border-blue-400/50 bg-blue-500/15 px-3 py-1.5 text-xs font-medium text-blue-100 transition hover:bg-blue-500/25"
                            onClick={() => handleOpenWinner(a)}
                          >
                            {winnerInfo.name || `User #${winnerInfo.userId}`}
                          </button>
                        )
                      }

                      return String(a.status) === 'LIVE' ? 'Chưa có người chiến thắng' : 'Không có người chiến thắng'
                    })()}
                  </td>
                  <td className="px-4 py-3">{statusBadge(a.status)}</td>
                  <td className="px-4 py-3 text-xs text-white/70">
                    <div>{formatDateTime(a.startTime)}</div>
                    <div>{formatDateTime(a.endTime)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="admin-btn inline-flex items-center justify-center rounded-lg border border-red-400/60 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => handleCancelAuction(a)}
                      disabled={!canCancelAuction(a) || mutatingId === a.auctionId}
                    >
                      {mutatingId === a.auctionId ? 'Đang hủy...' : 'Hủy phiên'}
                    </button>
                  </td>
                </tr>
              ))}

              {status !== 'loading' && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-sm text-white/55">
                    Không có phiên đấu giá phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="text-xs text-white/55">
            Tổng số phiên: {totalElements}
          </div>
          <div className="admin-button-shell">
            <button
              className="admin-btn inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Trang trước
            </button>
            <div className="text-xs text-white/55">
              Trang {totalPages === 0 ? 0 : page + 1}/{Math.max(totalPages, 1)}
            </div>
            <button
              className="admin-btn inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((p) => p + 1)}
              disabled={page + 1 >= Math.max(totalPages, 1)}
            >
              Trang sau
            </button>
          </div>
        </div>
      </div>

      <ListingDetailPreviewModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
      />
      <WinnerInfoModal
        winner={selectedWinner}
        onClose={() => setSelectedWinner(null)}
      />
      <UserDetailsModal />
      </div>
    </div>
  )
}
