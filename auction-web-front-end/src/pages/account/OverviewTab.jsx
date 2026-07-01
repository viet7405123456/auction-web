import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaCar, FaGavel, FaComments, FaBell, FaChevronLeft, FaChevronRight, FaHeart, FaTrophy } from 'react-icons/fa'
import { OverviewCard } from './components'
import { fmtDate } from './formatters'

const CARDS_PER_SLIDE = 3

export default function OverviewTab({
  overview,
  onSelectTab,
  likedListings = [],
  likedListingsPaging,
  onLoadMoreLikedListings,
  wonAuctions = [],
  wonAuctionsPaging,
  onLoadMoreWonAuctions,
}) {
  const navigate = useNavigate()
  const [likedSlideIndex, setLikedSlideIndex] = useState(0)
  const [wonSlideIndex, setWonSlideIndex] = useState(0)

  // Liked listings slide logic
  const likedTotalSlides = useMemo(() => {
    if (!likedListings.length) return 1
    return Math.ceil(likedListings.length / CARDS_PER_SLIDE)
  }, [likedListings.length])

  useEffect(() => {
    setLikedSlideIndex((prev) => Math.min(prev, Math.max(likedTotalSlides - 1, 0)))
  }, [likedTotalSlides])

  const likedCanGoPrev = likedSlideIndex > 0
  const likedHasMoreOnServer =
    Number(likedListingsPaging?.page || 0) + 1 < Number(likedListingsPaging?.totalPages || 1)
  const likedCanGoNext = likedSlideIndex < likedTotalSlides - 1 || likedHasMoreOnServer

  const visibleLikedListings = useMemo(() => {
    const start = likedSlideIndex * CARDS_PER_SLIDE
    return likedListings.slice(start, start + CARDS_PER_SLIDE)
  }, [likedSlideIndex, likedListings])

  const handleLikedNextSlide = async () => {
    if (likedSlideIndex < likedTotalSlides - 1) {
      setLikedSlideIndex((prev) => prev + 1)
      return
    }

    if (!likedHasMoreOnServer || likedListingsPaging?.isLoading) return

    const loaded = await onLoadMoreLikedListings?.()
    if (loaded) {
      setLikedSlideIndex((prev) => prev + 1)
    }
  }

  // Won auctions slide logic
  const wonTotalSlides = useMemo(() => {
    if (!wonAuctions.length) return 1
    return Math.ceil(wonAuctions.length / CARDS_PER_SLIDE)
  }, [wonAuctions.length])

  useEffect(() => {
    setWonSlideIndex((prev) => Math.min(prev, Math.max(wonTotalSlides - 1, 0)))
  }, [wonTotalSlides])

  const wonCanGoPrev = wonSlideIndex > 0
  const wonHasMoreOnServer =
    Number(wonAuctionsPaging?.page || 0) + 1 < Number(wonAuctionsPaging?.totalPages || 1)
  const wonCanGoNext = wonSlideIndex < wonTotalSlides - 1 || wonHasMoreOnServer

  const visibleWonAuctions = useMemo(() => {
    const start = wonSlideIndex * CARDS_PER_SLIDE
    return wonAuctions.slice(start, start + CARDS_PER_SLIDE)
  }, [wonSlideIndex, wonAuctions])

  const handleWonNextSlide = async () => {
    if (wonSlideIndex < wonTotalSlides - 1) {
      setWonSlideIndex((prev) => prev + 1)
      return
    }

    if (!wonHasMoreOnServer || wonAuctionsPaging?.isLoading) return

    const loaded = await onLoadMoreWonAuctions?.()
    if (loaded) {
      setWonSlideIndex((prev) => prev + 1)
    }
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          icon={FaCar}
          title="Bài đăng đã tạo"
          value={overview.listingsCreated}
          onClick={() => onSelectTab('listings')}
        />
        <OverviewCard
          icon={FaGavel}
          title="Phiên đấu giá đã tạo"
          value={overview.auctionsCreated}
          onClick={() => onSelectTab('listings')}
        />
        <OverviewCard
          icon={FaComments}
          title="Tin nhắn chưa xem"
          value={overview.unreadMessages}
          onClick={() => onSelectTab('chat')}
        />
        <OverviewCard
          icon={FaBell}
          title="Thông báo chưa xem"
          value={overview.unreadNotifications}
          onClick={() => onSelectTab('notifications')}
        />
      </div>

      {/* Liked listings section */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <FaHeart className="text-rose-500" />
              Bài viết đã tim
            </div>
            <div className="text-xs text-slate-500">
              Danh sách bài bạn đã thả tim. Bạn sẽ nhận được thông báo của bài đăng khi có hoạt động mới.
            </div>
          </div>

          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => likedCanGoPrev && setLikedSlideIndex((prev) => Math.max(prev - 1, 0))}
              disabled={!likedCanGoPrev}
              className="rounded-lg bg-slate-100 p-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Slide trước"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={handleLikedNextSlide}
              disabled={!likedCanGoNext || likedListingsPaging?.isLoading}
              className="rounded-lg bg-slate-900 p-2 text-white ring-1 ring-slate-900 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Slide tiếp theo"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {!likedListings.length ? (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Bạn chưa tim bài viết nào.
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              {visibleLikedListings.map((listing) => (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200"
                >
                  <img
                    src={listing.thumbnailUrl || 'https://placehold.co/640x360/e2e8f0/64748b?text=No+Image'}
                    alt={listing.title || 'listing'}
                    className="h-36 w-full object-cover"
                  />
                  <div className="space-y-2 p-3">
                    <h4 className="line-clamp-2 text-sm font-bold text-slate-900">{listing.title || '—'}</h4>
                    <div className="text-xs text-slate-500">Đăng lúc: {fmtDate(listing.createdAt || listing.submittedAt)}</div>
                    <button
                      onClick={() => navigate(`/listings/${listing.id}`)}
                      className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 hover:cursor-pointer"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                Trang slide {likedSlideIndex + 1}/{likedTotalSlides}
              </span>
              {likedListingsPaging?.isLoading && <span>Đang tải thêm bài đã tim...</span>}
            </div>
          </>
        )}
      </div>

      {/* Won auctions section */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <FaTrophy className="text-yellow-500" />
              Bài đăng đã thắng
            </div>
            <div className="text-xs text-slate-500">
              Danh sách phiên đấu giá bạn đã thắng. Bấm mũi tên phải để tải thêm các phiên thắng cũ hơn.
            </div>
          </div>

          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => wonCanGoPrev && setWonSlideIndex((prev) => Math.max(prev - 1, 0))}
              disabled={!wonCanGoPrev}
              className="rounded-lg bg-slate-100 p-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Slide trước"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={handleWonNextSlide}
              disabled={!wonCanGoNext || wonAuctionsPaging?.isLoading}
              className="rounded-lg bg-slate-900 p-2 text-white ring-1 ring-slate-900 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Slide tiếp theo"
            >
              <FaChevronRight />
            </button>
          </div>
        </div>

        {!wonAuctions.length ? (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500 ring-1 ring-slate-200">
            Bạn chưa thắng phiên đấu giá nào.
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              {visibleWonAuctions.map((listing) => (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200"
                >
                  <img
                    src={listing.thumbnailUrl || 'https://placehold.co/640x360/e2e8f0/64748b?text=No+Image'}
                    alt={listing.title || 'listing'}
                    className="h-36 w-full object-cover"
                  />
                  <div className="space-y-2 p-3">
                    <h4 className="line-clamp-2 text-sm font-bold text-slate-900">{listing.title || '—'}</h4>
                    <div className="text-xs text-slate-500">Đăng lúc: {fmtDate(listing.createdAt || listing.submittedAt)}</div>
                    <button
                      onClick={() => navigate(`/listings/${listing.id}`)}
                      className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                Trang slide {wonSlideIndex + 1}/{wonTotalSlides}
              </span>
              {wonAuctionsPaging?.isLoading && <span>Đang tải thêm bài đã thắng...</span>}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
