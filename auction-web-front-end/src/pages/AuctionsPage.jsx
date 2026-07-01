import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaClock, FaFilter, FaGavel, FaMapMarkerAlt, FaSearch, FaCar, FaTag } from 'react-icons/fa'

const STATUS = {
  LIVE: 'LIVE',
  UPCOMING: 'UPCOMING',
  ENDED: 'ENDED',
}

const STATUS_LABEL = {
  LIVE: 'Đang diễn ra',
  UPCOMING: 'Sắp đấu giá',
  ENDED: 'Đã kết thúc',
}

const AUCTION_RESULT_LABEL = {
  SOLD: 'Có người thắng',
  RESERVE_NOT_MET: 'Chưa đạt giá dự trữ',
  CANCELLED: 'Đã hủy',
  NO_BIDS: 'Không có lượt đặt giá',
  PENDING: 'Đang xử lý',
}

const API_STATUS_MAP = {
  LIVE: 'LIVE',
  UPCOMING: 'SCHEDULED',
  ENDED: 'ENDED',
}

const UI_STATUS_FROM_API = {
  LIVE: 'LIVE',
  SCHEDULED: 'UPCOMING',
  UPCOMING: 'UPCOMING',
  ENDED: 'ENDED',
}

const PAGE_SIZE = 9

const cx = (...classes) => classes.filter(Boolean).join(' ')

function buildUrlWithParams(baseUrl, searchParams) {
  const qs = searchParams.toString()
  return qs ? `${baseUrl}?${qs}` : baseUrl
}

function parseTime(value) {
  if (!value) return null
  const normalized = typeof value === 'string' ? value.replace(' ', 'T') : value
  const ts = new Date(normalized).getTime()
  return Number.isFinite(ts) ? ts : null
}

function formatClock(diffMs) {
  const totalSec = Math.max(0, Math.floor(diffMs / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatRemainingText(status, startTime, endTime, nowTs) {
  const startTs = parseTime(startTime)
  const endTs = parseTime(endTime)

  if (String(status) === STATUS.ENDED) return 'Đã kết thúc'

  if (String(status) === STATUS.UPCOMING) {
    if (!startTs) return 'Sắp diễn ra'
    const diff = startTs - nowTs
    if (diff <= 0) return 'Sắp bắt đầu'

    if (diff > 24 * 60 * 60 * 1000) {
      const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
      return `${days} ngày`
    }

    return formatClock(diff)
  }

  if (!endTs) return 'Đang diễn ra'
  const diff = endTs - nowTs
  if (diff <= 0) return 'Đã kết thúc'

  if (diff > 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const remain = diff % (24 * 60 * 60 * 1000)
    const hours = Math.floor(remain / (60 * 60 * 1000))
    return `${days} ngày ${String(hours).padStart(2, '0')} giờ`
  }

  return formatClock(diff)
}

function deriveUiStatus(rawStatus, startTime, endTime, nowTs) {
  const mapped = UI_STATUS_FROM_API[String(rawStatus || '').toUpperCase()] || String(rawStatus || '').toUpperCase()
  const startTs = parseTime(startTime)
  const endTs = parseTime(endTime)

  if (String(rawStatus).toUpperCase() === 'CANCELLED') return STATUS.ENDED
  if (endTs && nowTs >= endTs) return STATUS.ENDED
  if (startTs && nowTs >= startTs && (!endTs || nowTs < endTs)) return STATUS.LIVE
  if (mapped === STATUS.UPCOMING || mapped === STATUS.LIVE || mapped === STATUS.ENDED) return mapped
  return STATUS.UPCOMING
}

function formatAuctionResultLabel(status) {
  if (!status) return 'Chưa xác định'
  return AUCTION_RESULT_LABEL[String(status).toUpperCase()] || String(status)
}

function normalizeAuctionItem(item, nowTs) {
  const auction = item?.currentAuction || item?.auction || item?.latestAuction || null
  const rawStatus = String(item?.auctionStatus || auction?.status || STATUS.UPCOMING).toUpperCase()
  const startTime = item?.startTime || auction?.startTime || null
  const endTime = item?.endTime || auction?.endTime || null
  const status = deriveUiStatus(rawStatus, startTime, endTime, nowTs)
  const listingId = Number(item?.listingId || item?.id || auction?.listingId || item?.listing?.id || 0) || null
  const auctionId = Number(item?.auctionId || auction?.auctionId || item?.latestAuctionId || 0) || null
  const startingPrice = item?.startingPrice ?? auction?.startingPrice ?? null
  const auctionResultStatus = item?.auctionResultStatus || auction?.auctionResultStatus || null

  const highest =
    item?.currentHighestBid ??
    auction?.currentHighestBid ??
    item?.highestBid ??
    auction?.highestBid ??
    null
  const highestForDisplay = status === STATUS.ENDED && (highest == null || Number(highest) <= 0)
    ? startingPrice
    : highest

  const thumbnail =
    item?.thumbnailUrl ||
    item?.car?.thumbnailUrl ||
    item?.car?.images?.[0]?.imageUrl ||
    'https://placehold.co/960x640/e2e8f0/334155?text=Auction+Thumbnail'

  return {
    id: auctionId || listingId || item?.id,
    listingId,
    auctionId,
    title: item?.title || item?.car?.name || `Bài đăng #${item?.id ?? ''}`,
    city: item?.addressSell || 'Chưa cập nhật địa điểm',
    km: Number(item?.car?.mileage || 0),
    status,
    startTime,
    endTime,
    startingPrice,
    imageUrl: thumbnail,
    highestBid: highest,
    auctionResultStatus,
    highestText: Number.isFinite(Number(highestForDisplay)) && Number(highestForDisplay) > 0
      ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(highestForDisplay))} đ`
      : (status === STATUS.ENDED ? 'Chưa có giá' : 'Đặt giá ngay'),
    startingText: Number.isFinite(Number(startingPrice)) && Number(startingPrice) > 0 ? `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(startingPrice))} đ` : '—',
    remainingText: formatRemainingText(status, startTime, endTime, nowTs),
    raw: item,
  }
}

function FilterSection({ title, children }) {
  return (
    <div className="border-t border-slate-100 py-5 first:border-t-0 first:pt-0">
      <div className="text-sm font-extrabold text-slate-900">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function Chip({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-100">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="grid h-4 w-4 place-items-center rounded-full bg-red-100 text-red-800 hover:bg-red-200"
      >
        ×
      </button>
    </span>
  )
}

function AuctionCard({ item, onOpenDetail }) {
  const formatTime = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    } catch {
      return '—'
    }
  }

  const startLabel = formatTime(item.startTime)
  const endLabel = formatTime(item.endTime)
  const isLive = item.status === STATUS.LIVE
  const isUpcoming = item.status === STATUS.UPCOMING
  const isEnded = item.status === STATUS.ENDED

  const priceLabel = isUpcoming ? 'Giá khởi điểm' : 'Giá cao nhất'
  const priceValue = isUpcoming ? item.startingText : item.highestText
  const resultLabel = formatAuctionResultLabel(item.auctionResultStatus)

  const statusTone = isLive
    ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
    : isUpcoming
      ? 'bg-sky-100 text-sky-800 ring-sky-200'
      : 'bg-slate-100 text-slate-700 ring-slate-200'

  const progressText = isEnded
    ? resultLabel
    : isLive
      ? `Còn ${item.remainingText}`
      : `Bắt đầu sau ${item.remainingText}`

  const statusLabel = isEnded && item.auctionResultStatus
    ? resultLabel
    : STATUS_LABEL[item.status] || item.status

  const handleOpen = () => onOpenDetail(item)

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="group overflow-hidden rounded-3xl bg-white text-left shadow-[0_14px_34px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.16)]"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">

        </div>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="rounded-2xl border border-white/15 bg-black/35 p-4 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.2em] text-white/65">
                  {isEnded ? 'Kết quả phiên' : isLive ? 'Thời gian còn lại' : 'Thời gian đến phiên'}
                </div>
                <div className="mt-1 text-base font-black leading-tight sm:text-lg">
                  {progressText}
                </div>
              </div>

              <div className="shrink-0 rounded-2xl bg-white/12 px-3 py-2 text-right ring-1 ring-white/15">
                <div className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-white/65">
                  <FaGavel className="text-white/70" />
                  {priceLabel}
                </div>
                <div className="mt-0.5 text-sm font-black sm:text-base">{priceValue}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="line-clamp-2 text-xl font-black leading-tight tracking-tight text-slate-900">
            {item.title}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <FaMapMarkerAlt className="shrink-0 text-slate-400" />
            <span className="line-clamp-1">{item.city} • {item.km.toLocaleString('vi-VN')} km</span>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200">
            
            <div className="min-w-0">
              
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Bắt đầu</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{startLabel}</div>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200">
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Kết thúc</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">{endLabel}</div>
            </div>
          </div>

        </div>

        <div className="flex items-center justify-between gap-3">
          <div className={cx('inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1', statusTone)}>
            {STATUS_LABEL[item.status] || item.status}
          </div>

          <span className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white shadow-[0_10px_18px_rgba(220,38,38,0.22)] transition group-hover:bg-red-700">
            Xem chi tiết
            <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </button>
  )
}

function Pagination({ page, totalPages, onPage }) {
  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <button
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Trang trước
      </button>

      <div className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-800 ring-1 ring-slate-200">
        {page} / {totalPages}
      </div>

      <button
        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Trang sau
      </button>
    </div>
  )
}

export default function AuctionsPage() {
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [nowTs, setNowTs] = useState(Date.now())

  // Applied filters (từ URL - kích hoạt API)
  const appliedKeyword = sp.get('keyword') || ''
  const appliedBrand = sp.get('brand') || ''
  const appliedCity = sp.get('city') || ''
  const appliedStatus = sp.get('status') || 'LIVE'
  const appliedStartPriceMin = sp.get('startPriceMin') || ''
  const appliedStartPriceMax = sp.get('startPriceMax') || ''
  const page = Math.max(1, Number(sp.get('page') || 1))

  // Draft filters (form state - chỉ cập nhật khi ấn tìm kiếm)
  const [draftFilters, setDraftFilters] = useState({
    keyword: appliedKeyword,
    brand: appliedBrand,
    city: appliedCity,
    startPriceMin: appliedStartPriceMin,
    startPriceMax: appliedStartPriceMax,
    status: appliedStatus,
  })

  // Cập nhật draft khi URL thay đổi
  useEffect(() => {
    setDraftFilters({
      keyword: appliedKeyword,
      brand: appliedBrand,
      city: appliedCity,
      startPriceMin: appliedStartPriceMin,
      startPriceMax: appliedStartPriceMax,
      status: appliedStatus,
    })
  }, [appliedKeyword, appliedBrand, appliedCity, appliedStartPriceMin, appliedStartPriceMax, appliedStatus])

  // Helper: Cập nhật draft filter
  const setParam = (key, value) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }))
  }

  // Helper: Toggle status trong draft filters
  const toSearchParamsFromDraft = (draft, nextPage = '1') => {
    const next = new URLSearchParams()
    if (draft.keyword) next.set('keyword', draft.keyword)
    if (draft.brand) next.set('brand', draft.brand)
    if (draft.city) next.set('city', draft.city)
    if (draft.startPriceMin) next.set('startPriceMin', draft.startPriceMin)
    if (draft.startPriceMax) next.set('startPriceMax', draft.startPriceMax)
    next.set('status', draft.status || 'LIVE')
    next.set('page', nextPage)
    return next
  }

  const toSearchParamsFromAppliedWithStatus = (status, nextPage = '1') => {
    const next = new URLSearchParams()
    if (appliedKeyword) next.set('keyword', appliedKeyword)
    if (appliedBrand) next.set('brand', appliedBrand)
    if (appliedCity) next.set('city', appliedCity)
    if (appliedStartPriceMin) next.set('startPriceMin', appliedStartPriceMin)
    if (appliedStartPriceMax) next.set('startPriceMax', appliedStartPriceMax)
    next.set('status', status || 'LIVE')
    next.set('page', nextPage)
    return next
  }

  const toggleStatus = (status) => {
    setDraftFilters((prev) => ({ ...prev, status }))
    setSp(toSearchParamsFromAppliedWithStatus(status, '1'), { replace: true })
  }

  // Apply filters từ draft → URL (thực hiện khi ấn nút tìm kiếm)
  const handleApplyFilters = () => {
    setSp(toSearchParamsFromDraft(draftFilters, '1'), { replace: true })
    setMobileFilterOpen(false)
  }

  // Clear all filters
  const handleClearAll = () => {
    setDraftFilters({
      keyword: '',
      brand: '',
      city: '',
      startPriceMin: '',
      startPriceMax: '',
      status: 'LIVE',
    })
    setSp(toSearchParamsFromDraft({
      keyword: '',
      brand: '',
      city: '',
      startPriceMin: '',
      startPriceMax: '',
      status: 'LIVE',
    }), { replace: true })
  }

  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchAuctions() {
      try {
        setLoading(true)

        const params = new URLSearchParams()
        params.set('title', appliedKeyword)
        params.set('brand', appliedBrand)
        params.set('addressSell', appliedCity)
        params.set('page', String(Math.max(0, page - 1)))
        params.set('size', String(PAGE_SIZE))

        params.set('auctionStatus', API_STATUS_MAP[appliedStatus] || appliedStatus)

        const url = buildUrlWithParams(
          `http://localhost:8080/api/auctions/status/${encodeURIComponent(API_STATUS_MAP[appliedStatus] || appliedStatus)}`,
          params,
        )
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(await res.text())

        const data = await res.json()
        setItems(Array.isArray(data.content) ? data.content : [])
        setTotalItems(Number(data.totalElements || 0))
      } catch (e) {
        if (e.name !== 'AbortError') {
          setItems([])
          setTotalItems(0)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchAuctions()
    return () => controller.abort()
  }, [appliedKeyword, appliedBrand, appliedCity, appliedStartPriceMin, appliedStartPriceMax, appliedStatus, page])

  const cards = useMemo(() => {
    return items
      .map((item) => normalizeAuctionItem(item, nowTs))
      .filter((item) => {
        const highest = Number(item.highestBid || item.raw?.startingPrice || 0)
        if (appliedStartPriceMin && highest < Number(appliedStartPriceMin)) return false
        if (appliedStartPriceMax && highest > Number(appliedStartPriceMax)) return false

        return true
      })
  }, [items, nowTs, appliedStartPriceMin, appliedStartPriceMax])

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  const chips = useMemo(() => {
    const list = []
    if (appliedKeyword.trim()) list.push({ key: 'keyword', label: appliedKeyword })
    if (appliedBrand.trim()) list.push({ key: 'brand', label: `Hãng: ${appliedBrand}` })
    if (appliedCity.trim()) list.push({ key: 'city', label: `Vị trí: ${appliedCity}` })
    if (appliedStartPriceMin) list.push({ key: 'startPriceMin', label: `Giá từ: ${appliedStartPriceMin}` })
    if (appliedStartPriceMax) list.push({ key: 'startPriceMax', label: `Giá đến: ${appliedStartPriceMax}` })
    if (appliedStatus) list.push({ key: `status:${appliedStatus}`, label: STATUS_LABEL[appliedStatus] || appliedStatus })
    return list
  }, [appliedKeyword, appliedBrand, appliedCity, appliedStartPriceMin, appliedStartPriceMax, appliedStatus])

  const onOpenDetail = (item) => {
    if (!item) return
    const nextListingId = item?.listingId || item?.id
    const nextAuctionId = item?.auctionId
    if (item?.status === STATUS.ENDED && nextAuctionId) {
      navigate(`/listings/${nextListingId}?auctionId=${nextAuctionId}`)
      return
    }
    navigate(`/listings/${nextListingId}`)
  }

  const filterPanel = (
    <div className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="text-base font-extrabold text-slate-900">Bộ lọc tìm kiếm</div>
        <button
          type="button"
          className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          onClick={handleClearAll}
        >
          Xóa tất cả
        </button>
      </div>

      <FilterSection
        title={(
          <span className="inline-flex items-center gap-2">
            <FaSearch className="text-red-500" />
            Tìm kiếm
          </span>
        )}
      >
        <div className="relative">
          <input
            value={draftFilters.keyword}
            onChange={(e) => setParam('keyword', e.target.value)}
            placeholder="Tìm theo tiêu đề xe"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
          />
          <FaSearch className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </FilterSection>

      <FilterSection
        title={(
          <span className="inline-flex items-center gap-2">
            <FaCar className="text-red-500" />
            Hãng xe
          </span>
        )}
      >
        <input
          value={draftFilters.brand}
          onChange={(e) => setParam('brand', e.target.value)}
          placeholder="Ví dụ: Toyota"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
        />
      </FilterSection>

      <FilterSection
        title={(
          <span className="inline-flex items-center gap-2">
            <FaMapMarkerAlt className="text-red-500" />
            Vị trí
          </span>
        )}
      >
        <input
          value={draftFilters.city}
          onChange={(e) => setParam('city', e.target.value)}
          placeholder="Ví dụ: Hà Nội"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
        />
      </FilterSection>

      <FilterSection
        title={(
          <span className="inline-flex items-center gap-2">
            <FaTag className="text-red-500" />
            Giá (VNĐ)
          </span>
        )}
      >
        <div className="grid grid-cols-2 gap-3">
          <input
            value={draftFilters.startPriceMin}
            onChange={(e) => setParam('startPriceMin', e.target.value.replace(/\D/g, ''))}
            placeholder="Từ"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
          />
          <input
            value={draftFilters.startPriceMax}
            onChange={(e) => setParam('startPriceMax', e.target.value.replace(/\D/g, ''))}
            placeholder="Đến"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
          />
        </div>
      </FilterSection>

      <FilterSection
        title={(
          <span className="inline-flex items-center gap-2">
            <FaClock className="text-red-500" />
            Trạng thái phiên đấu giá
          </span>
        )}
      >
        <div className="space-y-3">
          {[STATUS.LIVE, STATUS.UPCOMING, STATUS.ENDED].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              className={cx(
                'flex w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-all duration-200',
                draftFilters.status === s
                  ? 'border-red-500 bg-gradient-to-b from-red-50 to-white shadow-[0_8px_22px_rgba(239,68,68,0.22)]'
                  : 'border-slate-200 bg-white hover:border-red-200 hover:shadow-[0_6px_16px_rgba(100,116,139,0.15)]',
              )}
            >
              <div>
                <div className={cx('text-sm font-bold', draftFilters.status === s ? 'text-red-700' : 'text-slate-800')}>
                  {STATUS_LABEL[s]}
                </div>
                <div className="text-xs text-slate-500">
                  {s === STATUS.LIVE
                    ? 'Chỉ các phiên đang mở'
                    : s === STATUS.UPCOMING
                      ? 'Phiên chuẩn bị diễn ra'
                      : 'Phiên đã kết thúc'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </FilterSection>

      <button
        type="button"
        onClick={handleApplyFilters}
        className="mt-6 w-full rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
      >
        Tìm kiếm
      </button>
    </div>
  )

  return (
    <div className="bg-slate-200/80">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="hidden lg:block">{filterPanel}</aside>

          <section>
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <div className="text-xl font-extrabold text-slate-900">Các phiên đấu giá</div>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
              >
                <FaFilter className="h-4 w-4" />
                Bộ lọc
              </button>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-200">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-2xl font-extrabold text-slate-900">Danh sách phiên đấu giá</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {loading ? 'Đang tải...' : `${cards.length} kết quả`} • Trang {page}/{totalPages}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="mr-1 text-sm font-semibold text-slate-700">Bộ lọc:</div>

                {chips.length === 0 ? (
                  <span className="text-sm text-slate-500">Chưa có bộ lọc</span>
                ) : (
                  <>
                    {chips.map((c) => (
                      <Chip
                        key={c.key}
                        onRemove={() => {
                          const nextDraft = { ...draftFilters }
                          if (c.key === 'keyword') nextDraft.keyword = ''
                          else if (c.key === 'brand') nextDraft.brand = ''
                          else if (c.key === 'city') nextDraft.city = ''
                          else if (c.key === 'startPriceMin') nextDraft.startPriceMin = ''
                          else if (c.key === 'startPriceMax') nextDraft.startPriceMax = ''
                          else if (c.key.startsWith('status:')) nextDraft.status = 'LIVE'

                          setDraftFilters(nextDraft)
                          setSp(toSearchParamsFromDraft(nextDraft, '1'), { replace: true })
                        }}
                      >
                        {c.label}
                      </Chip>
                    ))}

                    <button
                      type="button"
                      className="ml-2 text-sm font-semibold text-red-600 hover:underline"
                      onClick={handleClearAll}
                    >
                      Xóa tất cả ×
                    </button>
                  </>
                )}
              </div>
            </div>

            {loading ? (
              <div className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-600 ring-1 ring-slate-200">
                Đang tải dữ liệu...
              </div>
            ) : cards.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-white p-10 text-center text-slate-600 ring-1 ring-slate-200">
                Không có phiên đấu giá phù hợp bộ lọc.
              </div>
            ) : (
              <div className="mt-6 grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                {cards.map((item) => (
                  <AuctionCard key={item.id} item={item} onOpenDetail={onOpenDetail} />
                ))}
              </div>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              onPage={(p) => {
                const next = new URLSearchParams(sp)
                next.set('page', String(p))
                setSp(next, { replace: true })
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </section>
        </div>
      </div>

      {mobileFilterOpen ? (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[92%] max-w-sm overflow-auto bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-extrabold text-slate-900">Bộ lọc</div>
              <button
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                onClick={() => setMobileFilterOpen(false)}
              >
                Đóng
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      ) : null}
    </div>
  )
}
