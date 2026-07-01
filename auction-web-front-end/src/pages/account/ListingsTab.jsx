import { useState, useMemo, useEffect, useRef } from 'react'
import { FaPlus, FaEnvelopeOpenText, FaMapMarkerAlt, FaClock } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { ListingImageSlider } from './components'
import { fmtDate, fmtCurrency } from './formatters'
import CreateListingForm from '../../components/CreateListingForm'
import { checkListingNotSold } from '../../api/listingsApi'

function parseDateInputToIso(dateInputValue) {
  const normalized = String(dateInputValue || '').trim()
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null

  const probe = new Date(year, month - 1, day)
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) {
    return null
  }

  return normalized
}

function normalizeTimeParts(hourValue, minuteValue) {
  const hourSanitized = String(hourValue || '').replace(/\D/g, '').trim()
  const minuteSanitized = String(minuteValue || '').replace(/\D/g, '').trim()
  if (!hourSanitized || !minuteSanitized) return null

  const hour = Number(hourSanitized)
  const minute = Number(minuteSanitized)
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function composeStartTime(dateInputValue, hourValue, minuteValue) {
  const isoDate = parseDateInputToIso(dateInputValue)
  if (!isoDate) return null

  const normalizedTime = normalizeTimeParts(hourValue, minuteValue)
  if (!normalizedTime) return null

  return `${isoDate}T${normalizedTime}:00`
}

function getListingStatusMeta(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'SUBMITTED') {
    return {
      label: 'Đang chờ duyệt',
      description: 'Bài đăng đang chờ quản trị viên xem xét và phê duyệt.',
      box: 'bg-amber-50 ring-amber-300',
      text: 'text-amber-700',
    }
  }
  if (s === 'APPROVED') {
    return {
      label: 'Đã duyệt',
      description: 'Bài đăng đã được quản trị viên duyệt và đủ điều kiện hiển thị.',
      box: 'bg-emerald-50 ring-emerald-300',
      text: 'text-emerald-700',
    }
  }
  if (s === 'WAIT_FOR_PAYMENT') {
    return {
      label: 'Chờ thanh toán',
      description: 'Phiên đấu giá đã có người thắng. Đang chờ thanh toán trong 24 giờ.',
      box: 'bg-sky-50 ring-sky-300',
      text: 'text-sky-700',
    }
  }
  if (s === 'REJECTED') {
    return {
      label: 'Đã từ chối',
      description: 'Quản trị viên đã từ chối bài đăng. Hãy cập nhật và gửi lại.',
      box: 'bg-red-50 ring-red-300',
      text: 'text-red-700',
    }
  }
  if (s === 'SOLD') {
    return {
      label: 'Đã thanh toán',
      description: 'Người thắng đã thanh toán. Giao dịch đã hoàn tất.',
      box: 'bg-blue-50 ring-blue-300',
      text: 'text-blue-700',
    }
  }

  return {
    label: s || 'Không xác định',
    description: 'Trạng thái bài đăng hiện tại.',
    box: 'bg-slate-50 ring-slate-300',
    text: 'text-slate-700',
  }
}

function formatListingStatus(status) {
  return getListingStatusMeta(status).label
}

function formatOrderStatus(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'PENDING_PAYMENT') return 'Chờ thanh toán'
  if (s === 'PAID') return 'Đã thanh toán'
  if (s === 'EXPIRED') return 'Quá hạn'
  if (s === 'CANCELLED') return 'Đã hủy'
  return s || '—'
}

export default function ListingsTab({
  listings,
  selectedListingId,
  selectedListing,
  listingAuctions,
  authUser,
  isVerified = false,
  status,
  error,
  onSelectListing,
  onCreateListing,
  onCreateAuction,
  onPlaceBid,
  onContactSeller,
  onFetchBids,
  onFetchAuctionBids,
  selectedBidAuctionId,
  onSelectBidAuction,
  selectedAuctionBids,
}) {
  const navigate = useNavigate()
  const [showCreateListing, setShowCreateListing] = useState(false)
  const [auctionError, setAuctionError] = useState(null)
  const [showBidHistoryModal, setShowBidHistoryModal] = useState(false)
  const startMinuteInputRef = useRef(null)

  const [createAuctionForm, setCreateAuctionForm] = useState({
    startDateDisplay: '',
    startHour: '21',
    startMinute: '00',
    durationMinutes: 30,
    startingPrice: '',
    reservePrice: '',
    bidIncrement: '',
    softCloseEnabled: true,
    softCloseTriggerSeconds: 60,
    softCloseExtendSeconds: 60,
  })

  const [bidAmount, setBidAmount] = useState('')
  const [bidError, setBidError] = useState('')
  const [nowTs, setNowTs] = useState(Date.now())
  const [listingNotSold, setListingNotSold] = useState(true)
  const [checkingNotSold, setCheckingNotSold] = useState(false)
  const canCreateListing = Boolean(isVerified)

  const activeLiveAuction = useMemo(
    () => listingAuctions.find((a) => String(a.status) === 'LIVE'),
    [listingAuctions],
  )

  const highestBidValue = useMemo(() => {
    if (!activeLiveAuction) return null
    return activeLiveAuction.currentHighestBid ?? null
  }, [activeLiveAuction])

  const minimumNextBidValue = useMemo(() => {
    if (!activeLiveAuction) return null
    if (activeLiveAuction.minimumNextBid != null) return activeLiveAuction.minimumNextBid
    if (highestBidValue != null && activeLiveAuction.bidIncrement != null) {
      return Number(highestBidValue) + Number(activeLiveAuction.bidIncrement)
    }
    return activeLiveAuction.startingPrice ?? null
  }, [activeLiveAuction, highestBidValue])

  const listingStatusMeta = useMemo(
    () => getListingStatusMeta(selectedListing?.status),
    [selectedListing?.status],
  )

  const countdownText = useMemo(() => {
    if (!activeLiveAuction?.endTime) return '—'
    const endTs = new Date(activeLiveAuction.endTime).getTime()
    if (Number.isNaN(endTs)) return '—'
    const diffMs = endTs - nowTs
    if (diffMs <= 0) return '00:00:00'
    const totalSec = Math.floor(diffMs / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
  }, [activeLiveAuction?.endTime, nowTs])

  useEffect(() => {
    if (!activeLiveAuction?.auctionId) return undefined
    const timer = setInterval(() => {
      setNowTs(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [activeLiveAuction?.auctionId])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!selectedListingId) {
        setListingNotSold(true)
        return
      }

      setCheckingNotSold(true)
      try {
        const notSold = await checkListingNotSold(selectedListingId)
        if (!cancelled) {
          setListingNotSold(Boolean(notSold))
        }
      } catch {
        if (!cancelled) {
          setListingNotSold(true)
        }
      } finally {
        if (!cancelled) {
          setCheckingNotSold(false)
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [selectedListingId])

  const canCreateAuction = useMemo(() => {
    if (!selectedListing) return false
    if (!isVerified) return false
    const status = String(selectedListing.status || 'UNKNOWN')
    const isOwner = Number(selectedListing?.seller?.userId || selectedListing?.seller?.id) === Number(authUser?.userId)
    const hasActive = listingAuctions.some((a) => ['LIVE', 'SCHEDULED'].includes(String(a.status)))
    return isOwner && status === 'APPROVED' && !hasActive && listingNotSold
  }, [selectedListing, authUser?.userId, listingAuctions, listingNotSold, isVerified])

  const createAuctionBlockedReason = useMemo(() => {
    if (!selectedListing) return 'Vui lòng chọn bài đăng.'

    if (!isVerified) {
      return 'Chỉ tài khoản đã xác thực mới có thể tạo bài đăng và tạo phiên đấu giá.'
    }

    const isOwner = Number(selectedListing?.seller?.userId || selectedListing?.seller?.id) === Number(authUser?.userId)
    if (!isOwner) {
      return 'Chỉ người bán của bài đăng mới có thể tạo phiên đấu giá.'
    }

    const listingStatus = String(selectedListing.status || 'UNKNOWN')
    if (listingStatus === 'WAIT_FOR_PAYMENT') {
      return 'Bài đăng đang chờ người thắng thanh toán (24h). Nếu quá hạn hệ thống sẽ tiếp tục cho phép tạo phiên đấu giá mới.'
    }

    if (listingStatus === 'SOLD') {
      return 'Bài đăng đã được bán thành công, không thể tạo phiên mới.'
    }

    if (listingStatus !== 'APPROVED') {
      return `Yêu cầu đăng bài của bạn đã được gửi đến quản trị viên, bạn cần đợi quản trị viên xác thực để có thể tạo phiên đấu giá.`
    }

    const activeAuction = listingAuctions.find((a) => ['LIVE', 'SCHEDULED'].includes(String(a.status)))
    if (activeAuction) {
      return `Đã tồn tại phiên ${String(activeAuction.status)} (#${activeAuction.auctionId}), không thể tạo phiên mới.`
    }

    if (!listingNotSold) {
      return 'Xe trong bài đăng đã được thanh toán (PAID), không thể tạo phiên mới.'
    }

    if (checkingNotSold) {
      return 'Đang kiểm tra trạng thái thanh toán của bài đăng...'
    }

    return ''
  }, [selectedListing, authUser?.userId, listingAuctions, listingNotSold, checkingNotSold, isVerified])

  const handleCreateAuction = async () => {
    if (!selectedListingId) return

    if (!isVerified) {
      setAuctionError('Chỉ tài khoản đã xác thực mới có thể tạo bài đăng và phiên đấu giá.')
      return
    }

    if (!canCreateAuction) {
      setAuctionError(createAuctionBlockedReason || 'Không đủ điều kiện tạo phiên đấu giá')
      return
    }

    try {
      setAuctionError(null)

      const startTimeComposed = composeStartTime(
        createAuctionForm.startDateDisplay,
        createAuctionForm.startHour,
        createAuctionForm.startMinute,
      )
      if (!startTimeComposed) {
        setAuctionError('Vui lòng chọn ngày và nhập giờ/phút hợp lệ theo định dạng 24h (ví dụ 21:05)')
        return
      }

      const durationMinutes = Number(createAuctionForm.durationMinutes || 0)
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        setAuctionError('Thời lượng phiên (phút) phải lớn hơn 0')
        return
      }

      const startDate = new Date(startTimeComposed)
      if (Number.isNaN(startDate.getTime())) {
        setAuctionError('Thời gian bắt đầu không hợp lệ')
        return
      }
      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
      const endTimeLocal = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(
        endDate.getDate(),
      ).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}:${String(
        endDate.getMinutes(),
      ).padStart(2, '0')}:${String(endDate.getSeconds()).padStart(2, '0')}`
      
      const payload = {
        listingId: selectedListingId,
        startTime: startTimeComposed,
        endTime: endTimeLocal,
        startingPrice: Number(createAuctionForm.startingPrice || 0),
        reservePrice: createAuctionForm.reservePrice ? Number(createAuctionForm.reservePrice) : null,
        bidIncrement: Number(createAuctionForm.bidIncrement || 0),
        softCloseEnabled: createAuctionForm.softCloseEnabled,
        softCloseTriggerSeconds: Number(createAuctionForm.softCloseTriggerSeconds || 60),
        softCloseExtendSeconds: Number(createAuctionForm.softCloseExtendSeconds || 60),
      }
      
      console.log('Frontend: Creating auction with payload:', JSON.stringify(payload, null, 2))
      
      await onCreateAuction(payload)
      
      setCreateAuctionForm({
        startDateDisplay: '',
        startHour: '21',
        startMinute: '00',
        durationMinutes: 30,
        startingPrice: '',
        reservePrice: '',
        bidIncrement: '',
        softCloseEnabled: true,
        softCloseTriggerSeconds: 60,
        softCloseExtendSeconds: 60,
      })
    } catch (err) {
      console.error('Error creating auction:', err)
      setAuctionError(err || 'Không thể tạo phiên đấu giá')
    }
  }

  const handlePlaceBid = async () => {
    if (!activeLiveAuction?.auctionId || !bidAmount) return

    if (!isVerified) {
      setBidError('Chỉ tài khoản đã xác thực mới được tham gia đặt bid.')
      return
    }
    try {
      setBidError('')
      await onPlaceBid({ auctionId: activeLiveAuction.auctionId, bidAmount: Number(bidAmount) })
      onFetchAuctionBids(activeLiveAuction.auctionId)
      setBidAmount('')
    } catch (error) {
      setBidError(String(error?.message || error || 'Đặt giá thất bại'))
    }
  }

  const isOwner =
    Number(selectedListing?.seller?.userId || selectedListing?.seller?.id) === Number(authUser?.userId)

  const selectedAuctionMeta = useMemo(
    () => listingAuctions.find((a) => Number(a.auctionId) === Number(selectedBidAuctionId)) || null,
    [listingAuctions, selectedBidAuctionId],
  )

  return (
    <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-300 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Bài đăng của tôi</h3>
          <button
            onClick={() => setShowCreateListing(true)}
            disabled={!canCreateListing}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 hover:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            <FaPlus />
            Tạo mới
          </button>
        </div>

        {!canCreateListing && (
          <div className="mb-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            Tài khoản chưa được xác thực nên chưa thể tạo bài đăng.
          </div>
        )}

        <div className="space-y-2">
          {listings.map((l) => (
            <button
              key={l.id ?? l.listingId}
              onClick={() => onSelectListing(l.id ?? l.listingId)}
              className={`w-full rounded-lg p-3 text-left ring-1 transition hover:cursor-pointer ${
                selectedListingId === (l.id ?? l.listingId)
                    ? 'bg-red-50 ring-red-300'
                    : 'bg-white ring-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="text-sm font-bold text-slate-900">{l.title || '—'}</div>
              <div className="mt-1 text-xs text-slate-500">Trạng thái: {formatListingStatus(l.status)}</div>
              <div className="mt-1 text-xs text-slate-500">{fmtDate(l.createdAt || l.submittedAt)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-300 shadow-sm">
        {!selectedListing ? (
          <div className="grid min-h-[420px] place-items-center text-sm text-slate-500">
            Chọn một bài đăng để xem chi tiết.
          </div>
        ) : (
          <div className="space-y-6 max-h-[800px] overflow-y-auto">
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                <ListingImageSlider images={selectedListing?.car?.images || []} />
                <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-300">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold uppercase text-slate-500">Chi tiết bài đăng</div>
                    <button
                      onClick={() => navigate(`/listings/${selectedListing?.id || selectedListing?.listingId}`)}
                      className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-700 hover:cursor-pointer"
                    >
                      Xem chi tiết bài đăng
                    </button>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900">{selectedListing.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{selectedListing.description || 'Không có mô tả.'}</p>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <div>Hãng: <b>{selectedListing?.car?.brand || '—'}</b></div>
                    <div>Dòng xe: <b>{selectedListing?.car?.model || '—'}</b></div>
                    <div>Năm: <b>{selectedListing?.car?.year || '—'}</b></div>
                    <div>Màu: <b>{selectedListing?.car?.color || '—'}</b></div>
                    <div>Hộp số: <b>{selectedListing?.car?.transmission || '—'}</b></div>
                    <div>Nhiên liệu: <b>{selectedListing?.car?.fuelType || '—'}</b></div>
                  </div>

                  <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-slate-300">
                    <div className="flex items-start gap-2">
                      <div className="rounded-full bg-red-100 p-2 text-red-600">
                        <FaMapMarkerAlt />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">Nơi bán</div>
                        <div className="text-sm font-bold text-slate-900">{selectedListing?.addressSell || 'Chưa cập nhật'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-300">
                  <div className="text-xs font-semibold uppercase text-slate-500">Trạng thái bài đăng</div>
                  <div className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-extrabold ring-1 ${listingStatusMeta.box} ${listingStatusMeta.text}`}>{listingStatusMeta.label}</div>

                  {listingStatusMeta.description && (
                    <div className="mt-2 text-xs text-slate-600">{listingStatusMeta.description}</div>
                  )}

                  {selectedListing?.reviewedBy && (
                    <div className="mt-2 text-xs text-slate-500">Người duyệt: {selectedListing?.reviewedBy?.username || selectedListing?.reviewedBy?.email || '—'}</div>
                  )}

                  {selectedListing?.payment?.orderStatus && (
                    <div className="mt-2 text-xs text-slate-500">
                      Thanh toán: <b>{formatOrderStatus(selectedListing.payment.orderStatus)}</b>
                      {selectedListing?.payment?.expiresAt && (
                        <span> · Hạn: <b>{fmtDate(selectedListing.payment.expiresAt)}</b></span>
                      )}
                      {selectedListing?.payment?.paidAt && (
                        <span> · Đã trả: <b>{fmtDate(selectedListing.payment.paidAt)}</b></span>
                      )}
                    </div>
                  )}
                </div>

                {activeLiveAuction ? (
                  <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                    <div className="text-sm font-extrabold text-emerald-700">Phiên đấu giá đang diễn ra</div>
                    <div className="mt-2 text-xs text-slate-700">Bắt đầu: {fmtDate(activeLiveAuction.startTime)}</div>
                    <div className="text-xs text-slate-700">Kết thúc: {fmtDate(activeLiveAuction.endTime)}</div>
                    <div className="text-xs text-slate-700">Giá khởi điểm: {fmtCurrency(activeLiveAuction.startingPrice)}</div>
                    <div className="text-xs text-slate-700">
                      Giá cao nhất hiện tại: <b>{highestBidValue != null ? fmtCurrency(highestBidValue) : 'Chưa xác định'}</b>
                    </div>
                    <div className="text-xs text-slate-700">
                      Giá tối thiểu tiếp theo: <b>{minimumNextBidValue != null ? fmtCurrency(minimumNextBidValue) : '—'}</b>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                      <FaClock />
                      Còn lại: {countdownText}
                    </div>
                    {!isOwner && (
                      <>
                        <div className="mt-3 flex gap-2">
                          <input
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            type="number"
                            placeholder="Nhập giá đặt"
                            disabled={!isVerified}
                            className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          />
                          <button
                            onClick={handlePlaceBid}
                            disabled={!isVerified}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 hover:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                          >
                            Đặt giá
                          </button>
                        </div>
                        {bidError && <div className="mt-2 text-xs font-semibold text-red-600">{bidError}</div>}
                      </>
                    )}

                    {isOwner && (
                      <div className="mt-3 rounded-lg bg-white p-2.5 text-xs font-semibold text-slate-600 ring-1 ring-emerald-200">
                        Đây là bài đăng của bạn, nên bạn không thể tham gia đặt giá trong phiên này.
                      </div>
                    )}

                    <button
                      onClick={() => onFetchAuctionBids(activeLiveAuction.auctionId)}
                      className="mt-3 w-full rounded-lg bg-white px-3 py-2 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200 hover:cursor-pointer"
                    >
                      Tải lượt đặt giá mới nhất
                    </button>
                  </div>
                ) : (
                  <div className="rounded-lg bg-slate-50 p-4 ring-1 ring-slate-300">
                    <div className="text-sm font-extrabold text-slate-700">Hiện không có phiên đang diễn ra</div>
                    {canCreateAuction ? (
                      <div className="mt-3 space-y-3">
                        {!isVerified && (
                          <div className="rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                            Tài khoản chưa xác thực nên chưa thể tạo bài đăng mới.
                          </div>
                        )}
                        <div>
                          <label className="text-xs font-semibold text-slate-600">Thời gian bắt đầu</label>
                          <div className="mt-1 grid grid-cols-[1fr_auto] gap-2">
                            <input
                              type="date"
                              value={createAuctionForm.startDateDisplay}
                              onChange={(e) =>
                                setCreateAuctionForm((p) => ({ ...p, startDateDisplay: e.target.value }))
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                pattern="^([01]?\d|2[0-3])$"
                                title="Nhập giờ 24h: 00-23"
                                value={createAuctionForm.startHour}
                                onChange={(e) => {
                                  const hourValue = e.target.value.replace(/\D/g, '').slice(0, 2)
                                  setCreateAuctionForm((p) => ({ ...p, startHour: hourValue }))
                                  if (hourValue.length === 2) {
                                    startMinuteInputRef.current?.focus()
                                  }
                                }}
                                placeholder="21"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-sm"
                              />
                              <span className="text-sm font-bold text-slate-500">:</span>
                              <input
                                ref={startMinuteInputRef}
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                pattern="^[0-5]?\d$"
                                title="Nhập phút: 00-59"
                                value={createAuctionForm.startMinute}
                                onChange={(e) => {
                                  const minuteValue = e.target.value.replace(/\D/g, '').slice(0, 2)
                                  setCreateAuctionForm((p) => ({ ...p, startMinute: minuteValue }))
                                }}
                                placeholder="05"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-600">Thời lượng phiên (phút)</label>
                          <input
                            type="number"
                            min="1"
                            value={createAuctionForm.durationMinutes}
                            onChange={(e) =>
                              setCreateAuctionForm((p) => ({ ...p, durationMinutes: e.target.value }))
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-semibold text-slate-600">Giá khởi điểm</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={createAuctionForm.startingPrice}
                              onChange={(e) => setCreateAuctionForm((p) => ({ ...p, startingPrice: e.target.value }))}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-600">Bước giá</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={createAuctionForm.bidIncrement}
                              onChange={(e) => setCreateAuctionForm((p) => ({ ...p, bidIncrement: e.target.value }))}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-600">Giá dự trữ (tùy chọn)</label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={createAuctionForm.reservePrice}
                            onChange={(e) => setCreateAuctionForm((p) => ({ ...p, reservePrice: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mt-1"
                          />
                        </div>

                        <div className="border-t border-slate-200 pt-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={createAuctionForm.softCloseEnabled}
                              onChange={(e) => setCreateAuctionForm((p) => ({ ...p, softCloseEnabled: e.target.checked }))}
                              className="rounded border-slate-300"
                            />
                            <span className="text-xs font-semibold text-slate-600">Bật tính năng Soft Close (tự động gia hạn)</span>
                          </label>
                        </div>

                        {createAuctionForm.softCloseEnabled && (
                          <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-3">
                            <div>
                              <label className="text-xs font-semibold text-slate-600">Kích hoạt sau (giây)</label>
                              <input
                                type="number"
                                min="1"
                                placeholder="60"
                                value={createAuctionForm.softCloseTriggerSeconds}
                                onChange={(e) => setCreateAuctionForm((p) => ({ ...p, softCloseTriggerSeconds: e.target.value }))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-600">Gia hạn (giây)</label>
                              <input
                                type="number"
                                min="1"
                                placeholder="60"
                                value={createAuctionForm.softCloseExtendSeconds}
                                onChange={(e) => setCreateAuctionForm((p) => ({ ...p, softCloseExtendSeconds: e.target.value }))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mt-1"
                              />
                            </div>
                          </div>
                        )}

                        <button
                          onClick={handleCreateAuction}
                          disabled={status === 'loading' || !isVerified}
                          className="w-full rounded-lg bg-slate-700 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {status === 'loading' ? 'Đang tạo...' : 'Tạo phiên đấu giá'}
                        </button>
                        {auctionError && (
                          <div className="rounded-lg bg-red-50 p-3 ring-1 ring-red-200">
                            <p className="text-xs font-semibold text-red-700">{auctionError}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-600">
                        {createAuctionBlockedReason}
                      </p>
                    )}
                  </div>
                )}

                {Number(selectedListing?.seller?.userId || selectedListing?.seller?.id) !== Number(authUser?.userId) && (
                  <button
                    onClick={onContactSeller}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 hover:cursor-pointer"
                  >
                    <FaEnvelopeOpenText />
                    Liên hệ người đăng bài
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 ring-1 ring-slate-300">
              <div className="mb-3 text-sm font-extrabold text-slate-900">Lịch sử phiên đấu giá</div>
              <div className="grid gap-3 md:grid-cols-2">
                {listingAuctions.map((a) => (
                  <div key={a.auctionId} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-300">
                    <div className="text-sm font-bold text-slate-900">Phiên #{a.auctionId}</div>
                    <div className="mt-1 text-xs text-slate-600">Trạng thái: {a.status}</div>
                    <div className="text-xs text-slate-600">Từ: {fmtDate(a.startTime)}</div>
                    <div className="text-xs text-slate-600">Đến: {fmtDate(a.endTime)}</div>
                    <button
                      onClick={() => {
                        onSelectBidAuction(a.auctionId)
                        onFetchBids(a.auctionId)
                        setShowBidHistoryModal(true)
                      }}
                      className={`mt-2 rounded-lg px-3 py-1.5 text-xs font-bold text-white hover:cursor-pointer ${
                        Number(selectedBidAuctionId) === Number(a.auctionId)
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-slate-900 hover:bg-slate-700'
                      }`}
                    >
                      Xem lịch sử đặt giá
                    </button>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreateListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-sm"
          onClick={() => setShowCreateListing(false)}
        >
          <div
            className="w-full max-h-[92vh] max-w-5xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tạo mới bài đăng</div>
                <div className="text-lg font-black text-slate-900">Nhập đầy đủ thông tin xe và giấy tờ</div>
              </div>
              <button
                onClick={() => setShowCreateListing(false)}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 hover:cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <CreateListingForm
              onSubmit={async (payload) => {
                await onCreateListing(payload)
                setShowCreateListing(false)
              }}
              isLoading={status === 'loading'}
            />
          </div>
        </div>
      )}

      {showBidHistoryModal && selectedBidAuctionId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-sm"
          onClick={() => setShowBidHistoryModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lịch sử bid</div>
                <div className="text-lg font-black text-slate-900">Phiên #{selectedBidAuctionId}</div>
                {selectedAuctionMeta && (
                  <div className="mt-1 text-xs text-slate-500">
                    {fmtDate(selectedAuctionMeta.startTime)} - {fmtDate(selectedAuctionMeta.endTime)}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowBidHistoryModal(false)}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 hover:cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {selectedAuctionBids.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-slate-300">
                Phiên #{selectedBidAuctionId} chưa có lượt đặt giá nào.
              </div>
            ) : (
              <div className="max-h-[360px] space-y-2 overflow-auto pr-1">
                {selectedAuctionBids.map((b) => (
                  <div key={b.bidId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-300">
                    <div>
                      <div className="text-sm font-bold text-slate-800">{b.username || `Người dùng #${b.userId}`}</div>
                      <div className="text-xs text-slate-500">{fmtDate(b.bidTime)}</div>
                    </div>
                    <div className="text-xl font-black tracking-tight text-red-700">{fmtCurrency(b.bidAmount)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
