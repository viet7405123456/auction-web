import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Badge from '../../components/Badge.jsx'
import Modal from '../../components/Modal.jsx'
import { formatDateTime } from '../../utils/format.js'
import { auctionsSelectors, clearSelectedAuction, patchAuction } from './auctionSlice.js'

function formatVnd(value) {
  if (value == null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
}

function statusBadge(status) {
  const s = String(status || '')
  if (s === 'ENDED') return <Badge variant="info" label="ENDED" />
  if (s === 'APPROVED') return <Badge variant="ok" label="APPROVED" />
  if (s === 'REJECTED') return <Badge variant="bad" label="REJECTED" />
  return <Badge variant="warn" label={s || 'PENDING'} />
}

function isAuctionEnded(auction) {
  if (!auction) return false
  if (String(auction.status) === 'ENDED') return true
  if (auction.closeReason) return true
  if (auction.auctionResult?.closedAt) return true
  if (auction.endTime) {
    const end = new Date(auction.endTime)
    if (!Number.isNaN(end.getTime()) && end.getTime() <= Date.now()) return true
  }
  return false
}

export default function AuctionDetailsModal() {
  const dispatch = useDispatch()
  const selectedId = useSelector((s) => s.auctions.selectedAuctionId)
  const auction = useSelector((s) => (selectedId ? auctionsSelectors.selectById(s, selectedId) : null))
  const usersById = useSelector((s) => s.users.entities)
  const listingsById = useSelector((s) => s.listings.entities)
  const authUser = useSelector((s) => s.auth.user)

  const [reviewNote, setReviewNote] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const close = () => {
    dispatch(clearSelectedAuction())
    setReviewNote('')
    setRejectReason('')
  }

  const title = useMemo(() => {
    if (!auction) return ''
    return `Auction #${auction.auctionId} — ${auction.title || 'Phiên đấu giá'}`
  }, [auction])

  if (!auction) return null

  const seller = auction.sellerId ? usersById[auction.sellerId] : null
  const winner = auction.auctionResult?.winnerUserId ? usersById[auction.auctionResult.winnerUserId] : null
  const currentHighestBidder = auction.currentHighestBidderId ? usersById[auction.currentHighestBidderId] : null
  const listing = auction.listingId ? listingsById[auction.listingId] : null
  const ended = isAuctionEnded(auction)

  const approve = () => {
    dispatch(
      patchAuction({
        auctionId: auction.auctionId,
        patch: {
          status: 'APPROVED',
          approvedAt: new Date().toISOString(),
          rejectedReason: null,
          reviewedByUserId: authUser?.userId ?? 0,
          reviewNote: reviewNote.trim() ? reviewNote : auction.reviewNote || '',
        },
      }),
    )
  }

  const reject = () => {
    if (!rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối.')
      return
    }

    dispatch(
      patchAuction({
        auctionId: auction.auctionId,
        patch: {
          status: 'REJECTED',
          approvedAt: null,
          rejectedReason: rejectReason.trim(),
          closeReason: auction.closeReason || 'ADMIN_REJECTED',
          reviewedByUserId: authUser?.userId ?? 0,
          reviewNote: reviewNote.trim() ? reviewNote : auction.reviewNote || '',
        },
      }),
    )
  }

  const setPending = () => {
    dispatch(
      patchAuction({
        auctionId: auction.auctionId,
        patch: {
          status: 'PENDING',
          approvedAt: null,
          rejectedReason: null,
          closeReason: null,
        },
      }),
    )
  }

  return (
    <Modal title={title} onClose={close}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {statusBadge(auction.status)}
          {seller?.isVerified ? <Badge variant="ok" label="Seller verified" /> : <Badge variant="warn" label="Seller chưa verify" />}
          <Badge variant="info" label={`${auction.totalBids || 0} bids`} />
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]" onClick={setPending}>
            Chuyển về PENDING
          </button>
          <button className="inline-flex items-center justify-center rounded-xl border border-emerald-400/60 bg-emerald-500/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50" onClick={approve} disabled={String(auction.status) === 'APPROVED'}>
            Duyệt
          </button>
          <button className="inline-flex items-center justify-center rounded-xl border border-red-400/60 bg-red-500/20 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50" onClick={reject} disabled={String(auction.status) === 'REJECTED'}>
            Từ chối
          </button>
        </div>
      </div>

      <div className="my-4 border-t border-white/10" />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-3 text-base font-bold text-white">Thông tin phiên đấu giá</div>
          <div className="grid grid-cols-[170px_1fr] gap-x-4 gap-y-2 text-sm text-white/90">
            <div>Auction ID</div>
            <div>{auction.auctionId}</div>
            <div>Trạng thái</div>
            <div>{String(auction.status)}</div>
            <div>Tiêu đề</div>
            <div>{auction.title || '—'}</div>
            <div>Bài đăng liên kết</div>
            <div>
              <div>{auction.listingId || '—'}</div>
              <div className="text-xs text-white/60">{listing?.title || 'Không có dữ liệu bài đăng'}</div>
            </div>
            <div>Seller</div>
            <div>
              {seller ? (
                <>
                  <div className="font-semibold text-white">{seller.name}</div>
                  <div className="text-xs text-white/60">{seller.email}</div>
                </>
              ) : (
                '—'
              )}
            </div>
            <div>Current highest bidder</div>
            <div>{currentHighestBidder ? `${currentHighestBidder.name} (${currentHighestBidder.email})` : '—'}</div>
            <div>Start time</div>
            <div>{formatDateTime(auction.startTime)}</div>
            <div>End time</div>
            <div>{formatDateTime(auction.endTime)}</div>
            <div>Approved at</div>
            <div>{formatDateTime(auction.approvedAt)}</div>
            <div>Close reason</div>
            <div>{auction.closeReason || '—'}</div>
            <div>Reviewed by</div>
            <div>
              {auction.reviewedByUserId == null
                ? '—'
                : auction.reviewedByUserId === 0
                  ? 'Admin'
                  : usersById[auction.reviewedByUserId]?.name || '—'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-3 text-base font-bold text-white">Giá & KQ đấu giá</div>
          <div className="grid grid-cols-[170px_1fr] gap-x-4 gap-y-2 text-sm text-white/90">
            <div>Start price</div>
            <div>{formatVnd(auction.startingPrice)}</div>
            <div>Reserve price</div>
            <div>{formatVnd(auction.reservePrice)}</div>
            <div>Bid increment</div>
            <div>{formatVnd(auction.bidIncrement)}</div>
            <div>Current price</div>
            <div>{formatVnd(auction.currentHighestBid)}</div>
            <div>Total bids</div>
            <div>{auction.totalBids || 0}</div>
            <div>Version</div>
            <div>{auction.version ?? '—'}</div>
            <div>Extended count</div>
            <div>{auction.extendedCount ?? 0}</div>
            <div>Soft close</div>
            <div>{auction.softCloseEnabled ? 'Enabled' : 'Disabled'}</div>
            <div>Soft trigger / extend</div>
            <div>
              {auction.softCloseTriggerSeconds ?? '—'}s / {auction.softCloseExtendSeconds ?? '—'}s
            </div>
            <div>Cập nhật lần cuối</div>
            <div>{formatDateTime(auction.updatedAt)}</div>
          </div>

          <div className="my-4 border-t border-white/10" />
          <div className="mb-2 text-base font-bold text-white">Thông tin người thắng</div>
          {ended ? (
            auction.auctionResult?.winnerUserId ? (
              <div className="grid grid-cols-[170px_1fr] gap-x-4 gap-y-2 text-sm text-white/90">
                <div>Winner</div>
                <div>{winner ? `${winner.name} (${winner.email})` : `User #${auction.auctionResult.winnerUserId}`}</div>
                <div>Winner bid amount</div>
                <div>{formatVnd(auction.auctionResult.winnerBidAmount)}</div>
                <div>Closed at</div>
                <div>{formatDateTime(auction.auctionResult.closedAt)}</div>
              </div>
            ) : (
              <div className="text-sm text-white/60">Auction đã kết thúc nhưng chưa có winner.</div>
            )
          ) : (
            <div className="text-sm text-white/60">Chỉ xem được thông tin người thắng khi auction đã kết thúc.</div>
          )}

          {auction.rejectedReason && (
            <>
              <div className="my-4 border-t border-white/10" />
              <div className="mb-1 text-base font-bold text-white">Lý do từ chối hiện tại</div>
              <div className="whitespace-pre-wrap text-sm text-white/85">{auction.rejectedReason}</div>
            </>
          )}

          {auction.reviewNote && (
            <>
              <div className="my-4 border-t border-white/10" />
              <div className="mb-1 text-base font-bold text-white">Review note hiện tại</div>
              <div className="whitespace-pre-wrap text-sm text-white/85">{auction.reviewNote}</div>
            </>
          )}
        </div>
      </div>

      <div className="my-4 border-t border-white/10" />

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-2 text-base font-bold text-white">Review note (cập nhật)</div>
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-500/70"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Ghi chú admin khi duyệt/từ chối..."
          />
          <div className="mt-1.5 text-xs text-white/60">
            Nếu để trống, hệ thống sẽ giữ nguyên ghi chú cũ.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-2 text-base font-bold text-white">Lý do từ chối (cập nhật)</div>
          <textarea
            className="min-h-[120px] w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-500/70"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Bắt buộc nhập khi bấm Từ chối"
          />
        </div>
      </div>
    </Modal>
  )
}
