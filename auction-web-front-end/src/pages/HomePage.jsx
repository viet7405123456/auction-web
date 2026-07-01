import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowRight, FaBolt, FaCar, FaClock, FaEye, FaGavel, FaMapMarkerAlt, FaSearch, FaShieldAlt, FaStar } from 'react-icons/fa'
import { getListings } from '../api/listingsApi'

const STATUS_META = {
  LIVE: {
    label: 'Đang diễn ra',
    tone: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  },
  SCHEDULED: {
    label: 'Sắp đấu giá',
    tone: 'bg-sky-100 text-sky-800 ring-sky-200',
  },
  ENDED: {
    label: 'Đã kết thúc',
    tone: 'bg-slate-100 text-slate-700 ring-slate-200',
  },
}

const RESULT_LABEL = {
  SOLD: 'Có người thắng',
  RESERVE_NOT_MET: 'Chưa đạt giá dự trữ',
  CANCELLED: 'Đã hủy',
  NO_BIDS: 'Không có lượt đặt giá',
  PENDING: 'Đang xử lý',
}

function formatCurrency(value) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return 'Liên hệ'
  return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(numeric)} đ`
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function normalizeItem(item) {
  const auction = item?.auction || item?.currentAuction || item?.latestAuction || null
  const status = String(auction?.status || item?.auctionStatus || 'SCHEDULED').toUpperCase()
  const listingId = Number(item?.id || item?.listingId || auction?.listingId || 0) || null
  const auctionId = Number(auction?.auctionId || item?.auctionId || 0) || null

  return {
    id: `${listingId || 'x'}-${auctionId || '0'}`,
    listingId,
    auctionId,
    title: item?.title || item?.car?.name || 'Phiên đấu giá xe',
    city: item?.addressSell || 'Hà Nội',
    imageUrl:
      item?.thumbnailUrl ||
      item?.car?.thumbnailUrl ||
      item?.car?.images?.[0]?.imageUrl ||
      'https://placehold.co/960x640/e2e8f0/334155?text=Auction+Preview',
    status,
    startTime: auction?.startTime || item?.startTime || null,
    endTime: auction?.endTime || item?.endTime || null,
    startingPrice: auction?.startingPrice ?? item?.startingPrice ?? null,
    currentHighestBid: auction?.currentHighestBid ?? item?.currentHighestBid ?? null,
    auctionResultStatus: auction?.auctionResultStatus || item?.auctionResultStatus || null,
    viewCount: Number(item?.viewCount || 0),
    createdAt: item?.createdAt || item?.submittedAt || item?.auctionCreatedAt || null,
    brand: item?.car?.brand || 'Xe hơi',
    model: item?.car?.model || '',
  }
}

function HotListingCard({ item, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-[2rem] bg-white text-left shadow-[0_18px_40px_rgba(15,23,42,0.12)] ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-[0_26px_54px_rgba(15,23,42,0.18)]"
    >
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative h-72 overflow-hidden lg:h-full">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 backdrop-blur">
            <FaEye className="text-red-500" />
            Bài đăng hot nhất
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="text-[11px] uppercase tracking-[0.2em] text-white/70">Nhiều lượt xem nhất</div>
            <div className="mt-1 text-2xl font-black leading-tight md:text-3xl">{item.title}</div>
            <div className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-white/85">
              <FaMapMarkerAlt />
              {item.city}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 p-6 md:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 ring-1 ring-red-100">
              <FaEye />
              {Number(item.viewCount || 0).toLocaleString('vi-VN')} lượt xem
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">Thông tin nổi bật</div>
              <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Trạng thái</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{STATUS_META[item.status]?.label || item.status}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Bắt đầu</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{formatDate(item.startTime)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Kết thúc</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{formatDate(item.endTime)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Giá hiện tại</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(item.currentHighestBid ?? item.startingPrice)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600">Mở chi tiết để xem toàn bộ bài đăng, ảnh xe và phiên đấu giá liên quan.</div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-xs font-extrabold text-white transition group-hover:bg-red-700">
              Xem chi tiết
              <FaArrowRight />
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

function PreviewCard({ item, onOpen }) {
  const meta = STATUS_META[item.status] || STATUS_META.SCHEDULED
  const resultLabel = item.auctionResultStatus ? RESULT_LABEL[String(item.auctionResultStatus).toUpperCase()] || item.auctionResultStatus : 'Chưa xác định'
  const priceLabel = item.status === 'SCHEDULED' ? 'Giá khởi điểm' : 'Giá cao nhất'
  const priceValue = item.status === 'SCHEDULED' ? item.startingPrice : (item.currentHighestBid ?? item.startingPrice)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-3xl bg-white text-left shadow-[0_18px_40px_rgba(15,23,42,0.12)] ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-[0_26px_54px_rgba(15,23,42,0.18)]"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 backdrop-blur">
          <FaBolt className="text-amber-500" />
          {meta.label}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between gap-3 text-white">
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/70">{item.status === 'ENDED' ? 'Kết quả phiên' : 'Phiên nổi bật'}</div>
              <div className="mt-1 text-lg font-black leading-tight">{item.status === 'ENDED' ? resultLabel : item.title}</div>
            </div>
            <div className="rounded-2xl bg-black/35 px-3 py-2 text-right backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-wide text-white/70">{priceLabel}</div>
              <div className="text-sm font-black">{formatCurrency(priceValue)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="line-clamp-1 text-lg font-black text-slate-900">{item.title}</div>
          <div className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-slate-600">
            <FaMapMarkerAlt />
            {item.city}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Bắt đầu</div>
            <div className="mt-1 font-semibold text-slate-900">{formatDate(item.startTime)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Kết thúc</div>
            <div className="mt-1 font-semibold text-slate-900">{formatDate(item.endTime)}</div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ${meta.tone}`}>
            {meta.label}
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white transition group-hover:bg-red-700">
            Xem chi tiết
            <FaArrowRight />
          </div>
        </div>
      </div>
    </button>
  )
}

function QuickStat({ label, value }) {
  return (
    <div className="rounded-3xl bg-white/85 p-5 ring-1 ring-white/60 backdrop-blur-sm">
      <div className="text-sm font-semibold text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState({ LIVE: [], SCHEDULED: [], ENDED: [] })
  const [totals, setTotals] = useState({ LIVE: 0, SCHEDULED: 0, ENDED: 0 })
  const [hotListings, setHotListings] = useState([])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const statuses = ['LIVE', 'SCHEDULED', 'ENDED']
        const [responses, hotResponse] = await Promise.all([
          Promise.all(
            statuses.map(async (status) => {
              const res = await getListings({ auctionStatus: status, page: 0, size: 3 })
              return [
                status,
                {
                  items: Array.isArray(res?.content) ? res.content.map(normalizeItem) : [],
                  total: Number(res?.totalElements || 0),
                },
              ]
            }),
          ),
          getListings({ page: 0, size: 24 }),
        ])

        if (cancelled) return

        const nextSections = {}
        const nextTotals = {}
        for (const [status, payload] of responses) {
          nextSections[status] = payload.items
          nextTotals[status] = payload.total
        }

        const hotItems = Array.isArray(hotResponse?.content)
          ? hotResponse.content.map(normalizeItem)
          : []

        setSections(nextSections)
        setTotals(nextTotals)
        setHotListings(
          hotItems
            .slice()
            .sort((left, right) => {
              const rightViews = Number(right.viewCount || 0)
              const leftViews = Number(left.viewCount || 0)
              if (rightViews !== leftViews) return rightViews - leftViews
              const rightTime = new Date(right.createdAt || right.startTime || 0).getTime()
              const leftTime = new Date(left.createdAt || left.startTime || 0).getTime()
              return rightTime - leftTime
            }),
        )
      } catch {
        if (!cancelled) {
          setSections({ LIVE: [], SCHEDULED: [], ENDED: [] })
          setTotals({ LIVE: 0, SCHEDULED: 0, ENDED: 0 })
          setHotListings([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const totalAuctions = useMemo(
    () => totals.LIVE + totals.SCHEDULED + totals.ENDED,
    [totals],
  )

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (keyword.trim()) params.set('keyword', keyword.trim())
    navigate(`/auctions${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const openListing = (item) => {
    if (!item?.listingId) return
    if (item.status === 'ENDED' && item.auctionId) {
      navigate(`/listings/${item.listingId}?auctionId=${item.auctionId}`)
      return
    }
    navigate(`/listings/${item.listingId}`)
  }

  const featuredLive = sections.LIVE[0]
  const featuredUpcoming = sections.SCHEDULED[0]
  const hotListing = hotListings[0]

  return (
    <div className="space-y-10 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] px-4 py-6 md:px-6 md:py-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-[0_24px_60px_rgba(15,23,42,0.24)] md:px-10 md:py-14">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(248,250,252,0.1),transparent_35%,rgba(239,68,68,0.15)_70%,transparent)]" />
        <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-red-500/25 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 ring-1 ring-white/15 backdrop-blur">
              <FaStar className="text-amber-300" />
              Nền tảng đấu giá xe đã qua sử dụng
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">
                Phiên đấu giá rõ ràng, tốc độ cao, và dễ theo dõi ngay từ trang chủ.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200 md:text-lg">
                Xem nhanh các phiên đang diễn ra, sắp bắt đầu và đã kết thúc. Từ đây bạn có thể đi thẳng vào phiên phù hợp, kiểm tra giá, thời gian, và kết quả chỉ trong vài cú nhấp.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-slate-900 shadow-lg shadow-black/10 ring-1 ring-slate-200">
                <FaSearch className="text-slate-400" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch()
                  }}
                  placeholder="Tìm phiên theo tên xe, hãng, hoặc từ khóa..."
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </label>
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-red-700 hover:cursor-pointer"
              >
                <FaSearch />
                Tìm phiên
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/auctions"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-slate-100"
              >
                Xem tất cả phiên
                <FaArrowRight />
              </Link>
              <Link
                to="/listings"
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
              >
                Xem bài đăng xe
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <QuickStat
              label="Tổng phiên"
              value={loading ? '...' : totalAuctions.toLocaleString('vi-VN')}
            />
            <QuickStat
              label="Đang diễn ra"
              value={loading ? '...' : totals.LIVE.toLocaleString('vi-VN')}
            />
            <QuickStat
              label="Sắp đấu giá"
              value={loading ? '...' : totals.SCHEDULED.toLocaleString('vi-VN')}
            />
            <QuickStat
              label="Đã kết thúc"
              value={loading ? '...' : totals.ENDED.toLocaleString('vi-VN')}
            />
          </div>
        </div>
      </section>


      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Phiên đang diễn ra</h2>
            <p className="mt-1 text-sm text-slate-600">Danh sách nổi bật để vào đấu giá ngay.</p>
          </div>
          <Link to="/auctions?status=LIVE" className="text-sm font-bold text-red-600 hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {(sections.LIVE.length > 0 ? sections.LIVE : [featuredUpcoming].filter(Boolean)).slice(0, 3).map((item) => (
            <PreviewCard key={item.id} item={item} onOpen={() => openListing(item)} />
          ))}
          {!loading && sections.LIVE.length === 0 && !featuredUpcoming && (
            <div className="rounded-3xl bg-white p-6 text-sm text-slate-600 ring-1 ring-slate-200">
              Chưa có phiên đang diễn ra.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Phiên sắp bắt đầu</h2>
            <p className="mt-1 text-sm text-slate-600">Chuẩn bị theo dõi các phiên sẽ mở trong thời gian tới.</p>
          </div>
          <Link to="/auctions?status=UPCOMING" className="text-sm font-bold text-red-600 hover:underline">
            Xem tất cả
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {(sections.SCHEDULED.length > 0 ? sections.SCHEDULED : [featuredLive].filter(Boolean)).slice(0, 3).map((item) => (
            <PreviewCard key={item.id} item={item} onOpen={() => openListing(item)} />
          ))}
          {!loading && sections.SCHEDULED.length === 0 && !featuredLive && (
            <div className="rounded-3xl bg-white p-6 text-sm text-slate-600 ring-1 ring-slate-200">
              Chưa có phiên sắp bắt đầu.
            </div>
          )}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Bài đăng hot nhất</h2>
            <p className="mt-1 text-sm text-slate-600">Bài đăng có nhiều lượt xem nhất trong hệ thống.</p>
          </div>
          <Link to="/listings" className="text-sm font-bold text-red-600 hover:underline">
            Xem tất cả bài đăng
          </Link>
        </div>

        {hotListing ? (
          <HotListingCard item={hotListing} onOpen={() => openListing(hotListing)} />
        ) : (
          <div className="rounded-3xl bg-white p-6 text-sm text-slate-600 ring-1 ring-slate-200">
            Chưa có bài đăng nào đủ dữ liệu lượt xem.
          </div>
        )}
      </section>
    </div>
  )
}
