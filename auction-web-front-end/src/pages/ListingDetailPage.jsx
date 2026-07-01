import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCar,
  FaCarSide,
  FaComments,
  FaCogs,
  FaMapMarkerAlt,
  FaGasPump,
  FaGlobeAsia,
  FaPalette,
  FaPlus,
  FaTag,
  FaTachometerAlt,
  FaClock,
  FaGavel,
  FaEye,
  FaUsers,
  FaTimes,
  FaBolt,
  FaPowerOff,
} from 'react-icons/fa'
import { MdVerified } from "react-icons/md";
import {
  bootstrapAccount,
  fetchListingDetail,
  fetchAuctionBids,
  submitBid,
  createListingAuction,
  startDirectConversation,
  receiveRealtimeBidUpdate,
} from '../features/account/accountSlice'
import { pushToast } from '../features/ui/uiSlice'
import { fmtDate, fmtCurrency } from './account/formatters'
import { ListingImageSlider } from './account/components'
import { connectWs, publishWs, subscribeWs, unregisterWsConnectedCallback } from '../realtime/wsClient'
import {
  checkListingNotSold,
  createListingComment,
  getAuctionRoomMessages,
  getListingComments,
  sendAuctionRoomMessage,
} from '../api/listingsApi'
import {
  disableProxyBid as disableProxyBidApi,
  getAuctionBids,
  getAuctionResult,
  getMyProxyBid,
  setProxyBid as setProxyBidApi,
} from '../api/auctionsApi'

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
  const hourRaw = String(hourValue || '').trim()
  const minuteRaw = String(minuteValue || '').trim()

  const compactTimeMatch = hourRaw.match(/^(\d{1,2})[:hH](\d{1,2})$/)
  if (compactTimeMatch) {
    const hh = Number(compactTimeMatch[1])
    const mm = Number(compactTimeMatch[2])
    if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }

  const hourSanitized = hourRaw.replace(/\D/g, '')
  const minuteSanitized = minuteRaw.replace(/\D/g, '')
  if (!hourSanitized) return null

  const effectiveMinute = minuteSanitized || '00'

  const hour = Number(hourSanitized)
  const minute = Number(effectiveMinute)
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function withUnit(value, unit) {
  if (value == null || value === '') return '—'
  const text = String(value).trim()
  if (!text) return '—'
  return /[a-zA-Z]/.test(text) ? text : `${text} ${unit}`
}

function composeStartTime(dateInputValue, hourValue, minuteValue) {
  const isoDate = parseDateInputToIso(dateInputValue)
  if (!isoDate) return null

  const normalizedTime = normalizeTimeParts(hourValue, minuteValue)
  if (!normalizedTime) return null

  return `${isoDate}T${normalizedTime}:00`
}

function getDigitDuration(placeFromRight) {
  return `${180 + placeFromRight * 90}ms`
}

function RollingDigit({ digit, previousDigit, duration }) {
  const safePrev = Number.isInteger(previousDigit) ? previousDigit : digit
  const shouldAnimate = safePrev !== digit

  const endOffset = shouldAnimate
    ? digit >= safePrev
      ? digit
      : digit + 10
    : digit

  const [offset, setOffset] = useState(safePrev)

  useEffect(() => {
    setOffset(safePrev)

    const raf = requestAnimationFrame(() => {
      setOffset(endOffset)
    })

    return () => cancelAnimationFrame(raf)
  }, [safePrev, endOffset])

  return (
    <span className="relative inline-block h-[1em] w-[0.72em] overflow-hidden align-bottom">
      <span
        className="flex flex-col will-change-transform transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{
          transform: `translateY(-${offset}em)`,
          transitionDuration: duration,
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className="flex h-[1em] items-center justify-center font-black leading-[1em]"
          >
            {i % 10}
          </span>
        ))}
      </span>
    </span>
  )
}

function RollingPriceDisplay({ value }) {
  const numericValue = Number(value)
  const hasValue = value != null && Number.isFinite(numericValue)

  const currentValue = hasValue ? Math.max(0, Math.floor(numericValue)) : 0

  const prevValueRef = useRef(currentValue)

  const previousValueRaw = prevValueRef.current
  const previousValue =
    Number.isFinite(previousValueRaw) && previousValueRaw <= currentValue
      ? Math.floor(previousValueRaw)
      : currentValue

  useEffect(() => {
    prevValueRef.current = currentValue
  }, [currentValue])

  if (!hasValue) {
    return <span className="font-black text-slate-400">Chưa xác định</span>
  }

  const formatted = currentValue.toLocaleString('vi-VN')
  const chars = formatted.split('')
  const previousDigits = String(previousValue).split('')

  const digitIndexes = chars.reduce((acc, c, idx) => {
    if (/\d/.test(c)) acc.push(idx)
    return acc
  }, [])

  return (
    <span className="inline-flex items-end gap-0 tabular-nums leading-none">
      {chars.map((char, idx) => {
        if (!/\d/.test(char)) {
          return (
            <span
              key={`sep-${idx}`}
              className="inline-flex h-[1em] items-end justify-center font-black leading-none"
            >
              {char}
            </span>
          )
        }

        const digit = Number(char)
        const placeFromRight = digitIndexes.length - 1 - digitIndexes.indexOf(idx)
        const previousDigit = Number(
          previousDigits[previousDigits.length - 1 - placeFromRight] ?? digit
        )

        return (
          <RollingDigit
            key={`digit-${idx}-${digit}`}
            digit={digit}
            previousDigit={previousDigit}
            duration={getDigitDuration(placeFromRight)}
          />
        )
      })}

      <span className="ml-0 text-[0.58em] font-extrabold leading-none">đ</span>
    </span>
  )
}

function normalizeBidItem(item, fallbackAuctionId, index = 0) {
  return {
    bidId: item?.bidId || `bid-${fallbackAuctionId}-${index}`,
    auctionId: item?.auctionId || fallbackAuctionId,
    username: item?.username || `User #${item?.userId || '-'}`,
    userId: item?.userId,
    bidAmount: item?.bidAmount,
    bidTime: item?.bidTime,
  }
}

function toFiniteNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function getListingStatusMeta(status) {
  const normalized = String(status || 'UNKNOWN')
  if (normalized === 'SUBMITTED') {
    return {
      label: 'Chưa được kiểm duyệt',
      description: 'Bài đăng đang chờ quản trị viên xem xét và phê duyệt.',
      badgeClass: 'bg-amber-100 text-amber-800 ring-amber-300',
    }
  }

  if (normalized === 'APPROVED') {
    return {
      label: 'Đã được kiểm duyệt',
      description: 'Bài đăng đã được quản trị viên duyệt và đủ điều kiện hiển thị.',
      badgeClass: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
    }
  }

  if (normalized === 'WAIT_FOR_PAYMENT') {
    return {
      label: 'Đã được kiểm duyệt',
      description: 'Phiên đấu giá đã có người thắng. Đang chờ thanh toán trong 24 giờ.',
      badgeClass: 'bg-sky-100 text-sky-800 ring-sky-300',
    }
  }

  if (normalized === 'SOLD') {
    return {
      label: 'Đã bán thành công',
      description: 'Người thắng đã thanh toán. Giao dịch đã hoàn tất.',
      badgeClass: 'bg-blue-100 text-blue-800 ring-blue-300',
    }
  }

  if (normalized === 'REJECTED') {
    return {
      label: 'Bị từ chối',
      description: 'Quản trị viên đã từ chối bài đăng. Hãy cập nhật và gửi lại.',
      badgeClass: 'bg-rose-100 text-rose-800 ring-rose-300',
    }
  }

  return {
    label: normalized,
    description: 'Trang thai bai dang hien tai.',
    badgeClass: 'bg-slate-100 text-slate-700 ring-slate-300',
  }
}

function formatAuctionResultLabel(status) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'SOLD') return 'Có người thắng'
  if (normalized === 'RESERVE_NOT_MET') return 'Chưa đạt giá dự trữ'
  if (normalized === 'CANCELLED') return 'Đã hủy'
  if (normalized === 'NO_BIDS') return 'Không có lượt đặt giá'
  if (normalized === 'PENDING') return 'Đang xử lý'
  return normalized || 'Chưa xác định'
}

function formatAuctionResultBadgeLabel(auctionResultStatus, listingStatus, includeListingStatus = false) {
  const normalizedResult = String(auctionResultStatus || '').toUpperCase()
  if (normalizedResult !== 'SOLD') {
    return formatAuctionResultLabel(normalizedResult)
  }

  if (!includeListingStatus) {
    return formatAuctionResultLabel(normalizedResult)
  }

  const normalizedListing = String(listingStatus || '').toUpperCase()
  if (normalizedListing === 'WAIT_FOR_PAYMENT') return 'Có người thắng · Chờ thanh toán'
  if (normalizedListing === 'SOLD') return 'Có người thắng · Đã thanh toán'
  return formatAuctionResultLabel(normalizedResult)
}

const AUCTION_HISTORY_PAGE_SIZE = 4
const LISTING_COMMENT_PAGE_SIZE = 8

function getDisplayInitial(value) {
  const normalized = String(value || 'U').trim()
  return (normalized.charAt(0) || 'U').toUpperCase()
}

function getCommentIdentity(comment) {
  if (comment?.id != null) return `id:${comment.id}`
  return [
    comment?.listingId || '',
    comment?.userId || '',
    comment?.createdAt || '',
    comment?.content || '',
  ].join(':')
}

function mergeCommentsByIdentity(existingComments, incomingComments) {
  const seen = new Set()
  const merged = []
  const allComments = [...(existingComments || []), ...(incomingComments || [])]

  allComments.forEach((comment) => {
    const key = getCommentIdentity(comment)
    if (seen.has(key)) return
    seen.add(key)
    merged.push(comment)
  })

  return merged
}

function normalizeCommentPageResponse(data, fallbackPage, fallbackSize) {
  const isArrayResponse = Array.isArray(data)
  const content = isArrayResponse ? data : Array.isArray(data?.content) ? data.content : []
  const pageValue = Number(data?.number ?? data?.page ?? fallbackPage)
  const totalElementsValue = Number(data?.totalElements)
  const totalPagesValue = Number(data?.totalPages)

  const page = Number.isFinite(pageValue) ? pageValue : fallbackPage
  const totalElements = Number.isFinite(totalElementsValue) ? totalElementsValue : content.length
  const isLast =
    typeof data?.last === 'boolean'
      ? data.last
      : Number.isFinite(totalPagesValue)
        ? page >= totalPagesValue - 1
        : content.length < fallbackSize

  return {
    content,
    page,
    totalElements,
    hasMore: !isArrayResponse && !isLast,
  }
}

export default function ListingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const dispatch = useDispatch()
  const isAuthenticated = useSelector((s) => Boolean(s.auth.isAuthenticated))
  const authUser = useSelector((s) => s.auth.user)
  const account = useSelector((s) => s.account)
  const isVerified = Boolean(account?.profile?.isVerified)
  const currentUserIdRaw = Number(authUser?.userId)
  const currentUserId = Number.isFinite(currentUserIdRaw) ? currentUserIdRaw : null

  const auctionRoomScrollRef = useRef(null)
  const listingCommentsSectionRef = useRef(null)
  const listingCommentsSentinelRef = useRef(null)
  const listingCommentsLoadingRef = useRef(false)
  const listingCommentsListingIdRef = useRef(null)
  const endedAuctionCardRefs = useRef({})
  const autoOpenedEndedAuctionRef = useRef(null)

  const [bidAmount, setBidAmount] = useState('')
  const [auctionRoomMessages, setAuctionRoomMessages] = useState({})
  const [auctionRoomDraft, setAuctionRoomDraft] = useState('')
  const [listingComments, setListingComments] = useState([])
  const [listingCommentsPage, setListingCommentsPage] = useState(0)
  const [listingCommentsTotal, setListingCommentsTotal] = useState(0)
  const [listingCommentsHasMore, setListingCommentsHasMore] = useState(true)
  const [listingCommentsLoading, setListingCommentsLoading] = useState(false)
  const [listingCommentsLoaded, setListingCommentsLoaded] = useState(false)
  const [listingCommentsError, setListingCommentsError] = useState('')
  const [listingCommentDraft, setListingCommentDraft] = useState('')
  const [submittingListingComment, setSubmittingListingComment] = useState(false)
  const [nowTs, setNowTs] = useState(Date.now())
  const [viewerCount, setViewerCount] = useState(1)
  const [liveBidHistory, setLiveBidHistory] = useState([])
  const [flashBidId, setFlashBidId] = useState(null)

  const [selectedEndedAuctionId, setSelectedEndedAuctionId] = useState(null)
  const [focusedEndedAuctionId, setFocusedEndedAuctionId] = useState(null)
  const [endedAuctionBidsById, setEndedAuctionBidsById] = useState({})
  const [endedAuctionResultById, setEndedAuctionResultById] = useState({})
  const [endedAuctionLoading, setEndedAuctionLoading] = useState(false)
  const [visibleAuctionHistoryCount, setVisibleAuctionHistoryCount] = useState(AUCTION_HISTORY_PAGE_SIZE)

  const [creatingAuction, setCreatingAuction] = useState(false)
  const [listingNotSold, setListingNotSold] = useState(true)
  const [checkingNotSold, setCheckingNotSold] = useState(false)
  const hasShownStartToastRef = useRef(false)
  const hasShownEndToastRef = useRef(false)
  const hasAutoRefetchedScheduledRef = useRef(false)
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
  const [proxyBidAmount, setProxyBidAmount] = useState('')
  const [proxyBidState, setProxyBidState] = useState(null)
  const [proxyBidLoading, setProxyBidLoading] = useState(false)
  const [proxyBidSaving, setProxyBidSaving] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(bootstrapAccount())
    }
    if (id) {
      dispatch(fetchListingDetail(id))
    }
  }, [dispatch, id, isAuthenticated])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!id) {
        setListingNotSold(true)
        return
      }

      setCheckingNotSold(true)
      try {
        const notSold = await checkListingNotSold(id)
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
  }, [id])

  const loadListingComments = useCallback(
    async (pageToLoad = 0, { replace = false } = {}) => {
      if (!id || listingCommentsLoadingRef.current) return

      const listingIdForRequest = String(id)
      listingCommentsLoadingRef.current = true
      setListingCommentsLoading(true)
      setListingCommentsError('')

      try {
        const response = await getListingComments(listingIdForRequest, {
          page: pageToLoad,
          size: LISTING_COMMENT_PAGE_SIZE,
        })

        if (listingCommentsListingIdRef.current !== listingIdForRequest) return

        const normalized = normalizeCommentPageResponse(
          response,
          pageToLoad,
          LISTING_COMMENT_PAGE_SIZE,
        )

        setListingComments((prev) =>
          replace
            ? normalized.content
            : mergeCommentsByIdentity(prev, normalized.content),
        )
        setListingCommentsPage(normalized.page)
        setListingCommentsTotal(normalized.totalElements)
        setListingCommentsHasMore(normalized.hasMore)
      } catch (error) {
        if (listingCommentsListingIdRef.current !== listingIdForRequest) return
        setListingCommentsError(
          error?.response?.data?.message ||
            error?.message ||
            'Không tải được bình luận.',
        )
      } finally {
        if (listingCommentsListingIdRef.current === listingIdForRequest) {
          setListingCommentsLoaded(true)
          setListingCommentsLoading(false)
        }
        listingCommentsLoadingRef.current = false
      }
    },
    [id],
  )

  useEffect(() => {
    const listingIdForComments = id ? String(id) : null
    listingCommentsListingIdRef.current = listingIdForComments
    listingCommentsLoadingRef.current = false
    setListingComments([])
    setListingCommentsPage(0)
    setListingCommentsTotal(0)
    setListingCommentsHasMore(true)
    setListingCommentsLoading(false)
    setListingCommentsLoaded(false)
    setListingCommentsError('')
    setListingCommentDraft('')

    if (listingIdForComments) {
      loadListingComments(0, { replace: true })
    }
  }, [id, loadListingComments])

  const listing = account.listings.selectedDetail
  const auctions = account.listings.auctionsByListingId[id] || []

  const activeLiveAuction = useMemo(
    () => auctions.find((a) => String(a.status) === 'LIVE'),
    [auctions],
  )

  const upcomingAuction = useMemo(
    () => auctions.find((a) => String(a.status) === 'SCHEDULED'),
    [auctions],
  )

  const auctionHistory = useMemo(
    () =>
      auctions
        .filter((a) => String(a.status) === 'ENDED')
        .slice()
        .sort((left, right) => {
          const rightTime = new Date(right.endTime || right.createdAt || 0).getTime()
          const leftTime = new Date(left.endTime || left.createdAt || 0).getTime()
          if (rightTime !== leftTime) return rightTime - leftTime
          return Number(right.auctionId || 0) - Number(left.auctionId || 0)
        }),
    [auctions],
  )

  const visibleAuctionHistory = useMemo(
    () => auctionHistory.slice(0, visibleAuctionHistoryCount),
    [auctionHistory, visibleAuctionHistoryCount],
  )

  const hasMoreAuctionHistory = visibleAuctionHistory.length < auctionHistory.length

  const selectedAuctionIdFromQuery = Number(searchParams.get('auctionId') || 0) || null

  const selectedBids = account.listings.bidsByAuctionId[activeLiveAuction?.auctionId] || []

  const currentHighestBidderId = useMemo(() => {
    if (!activeLiveAuction) return null

    const fromAuction = toFiniteNumber(
      activeLiveAuction.currentHighestBidderId ?? activeLiveAuction.highestBidderId,
    )
    if (fromAuction != null) return fromAuction

    return toFiniteNumber(selectedBids[0]?.userId)
  }, [activeLiveAuction, selectedBids])

  const highestBidValue = useMemo(() => {
    if (!activeLiveAuction) return null
    if (activeLiveAuction.currentHighestBid != null) return activeLiveAuction.currentHighestBid
    return selectedBids[0]?.bidAmount ?? null
  }, [activeLiveAuction, selectedBids])

  const minimumNextBidValue = useMemo(() => {
    if (!activeLiveAuction) return null
    if (activeLiveAuction.minimumNextBid != null) return activeLiveAuction.minimumNextBid
    if (highestBidValue != null && activeLiveAuction.bidIncrement != null) {
      return Number(highestBidValue) + Number(activeLiveAuction.bidIncrement)
    }
    return activeLiveAuction.startingPrice ?? null
  }, [activeLiveAuction, highestBidValue])

  const quickBidOptions = useMemo(() => {
    if (minimumNextBidValue == null || !Number.isFinite(Number(minimumNextBidValue))) return []

    const baseBid = Number(minimumNextBidValue)



    return [baseBid,500000,1000000, 5000000, 10000000,50000000].map((increment) => {
      if (increment === baseBid) {
        return {
          amount: baseBid,
          label: `+${fmtCurrency(increment)}`, // hoặc "Giá hiện tại"
        }
      }
      return {
      amount: baseBid + increment,
      label: `+${fmtCurrency(increment)}`,
      }
    })
  }, [minimumNextBidValue])

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

  const upcomingStartCountdownMs = useMemo(() => {
    if (!upcomingAuction?.startTime) return null
    const startTs = new Date(upcomingAuction.startTime).getTime()
    if (Number.isNaN(startTs)) return null
    return Math.max(0, startTs - nowTs)
  }, [upcomingAuction?.startTime, nowTs])

  const upcomingCountdownText = useMemo(() => {
    if (upcomingStartCountdownMs == null) return '—'
    const totalSec = Math.floor(upcomingStartCountdownMs / 1000)
    const h = Math.floor(totalSec / 3600)
    const m = Math.floor((totalSec % 3600) / 60)
    const s = totalSec % 60
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
  }, [upcomingStartCountdownMs])

  const websocketAuctionId = activeLiveAuction?.auctionId || upcomingAuction?.auctionId || null

  useEffect(() => {
    if (!activeLiveAuction?.auctionId && !upcomingAuction?.auctionId) return undefined
    const timer = setInterval(() => {
      setNowTs(Date.now())
    }, 1000)
    return () => clearInterval(timer)
  }, [activeLiveAuction?.auctionId, upcomingAuction?.auctionId])

  useEffect(() => {
    hasShownStartToastRef.current = false
    hasShownEndToastRef.current = false
  }, [websocketAuctionId])

  useEffect(() => {
    if (!upcomingAuction?.auctionId) {
      hasAutoRefetchedScheduledRef.current = false
      return
    }
    if (upcomingStartCountdownMs == null || upcomingStartCountdownMs > 0) return
    if (hasAutoRefetchedScheduledRef.current) return

    hasAutoRefetchedScheduledRef.current = true
    dispatch(fetchListingDetail(id))
  }, [dispatch, id, upcomingAuction?.auctionId, upcomingStartCountdownMs])

  useEffect(() => {
    if (!selectedAuctionIdFromQuery || auctionHistory.length === 0) return

    const target = auctionHistory.find((auction) => Number(auction.auctionId) === Number(selectedAuctionIdFromQuery))
    if (!target) return

    if (autoOpenedEndedAuctionRef.current === Number(selectedAuctionIdFromQuery)) return

    autoOpenedEndedAuctionRef.current = Number(selectedAuctionIdFromQuery)
    setFocusedEndedAuctionId(Number(selectedAuctionIdFromQuery))
    handleOpenEndedAuction(target)

    requestAnimationFrame(() => {
      const element = endedAuctionCardRefs.current[String(selectedAuctionIdFromQuery)]
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    })
  }, [auctionHistory, selectedAuctionIdFromQuery])

  useEffect(() => {
    setVisibleAuctionHistoryCount(AUCTION_HISTORY_PAGE_SIZE)
  }, [id])

  useEffect(() => {
    if (!activeLiveAuction?.auctionId) return
    dispatch(fetchAuctionBids(activeLiveAuction.auctionId))
    setLiveBidHistory([])
  }, [activeLiveAuction?.auctionId, dispatch])

  useEffect(() => {
    if (!activeLiveAuction?.auctionId) return
    const normalized = (selectedBids || []).map((b, idx) =>
      normalizeBidItem(b, activeLiveAuction.auctionId, idx),
    )
    setLiveBidHistory(normalized)
  }, [activeLiveAuction?.auctionId, selectedBids])

  useEffect(() => {
    let cancelled = false
    let bidSub
    let roomSub
    let presenceSub
    let lifecycleSub

    if (!websocketAuctionId) return undefined

    const onWsConnected = () => {
      if (cancelled) return
      bidSub = subscribeWs(`/topic/auctions/${websocketAuctionId}`, (event) => {
        const eventType = String(event?.eventType || event?.type || '').toUpperCase()
        const statusText = String(event?.auctionStatus || event?.status || '').toUpperCase()
        const started =
          statusText === 'LIVE' ||
          eventType === 'AUCTION_STARTED' ||
          eventType === 'STARTED' ||
          eventType === 'LIVE'
        const ended =
          statusText === 'ENDED' ||
          eventType === 'AUCTION_ENDED' ||
          eventType === 'ENDED'

        if (started && !hasShownStartToastRef.current) {
          hasShownStartToastRef.current = true
          dispatch(fetchListingDetail(id))
          dispatch(
            pushToast({
              type: 'info',
              title: 'Phiên đấu giá đã bắt đầu',
              message: `Phiên #${websocketAuctionId} đã chuyển sang LIVE.`,
              duration: 4200,
            }),
          )
        }

        if (ended && !hasShownEndToastRef.current) {
          hasShownEndToastRef.current = true
          dispatch(fetchListingDetail(id))
          dispatch(
            pushToast({
              type: 'info',
              title: 'Phiên đấu giá đã kết thúc',
              message: `Phiên #${websocketAuctionId} đã đóng.`,
              duration: 4200,
            }),
          )
        }

        const nextViewerCount =
          event?.viewerCount ??
          event?.watcherCount ??
          event?.currentViewers ??
          event?.viewCount ??
          event?.onlineCount

        const normalizedViewerCount =
          typeof nextViewerCount === 'number' ? nextViewerCount : Number(nextViewerCount)

        if (Number.isFinite(normalizedViewerCount)) {
          setViewerCount(normalizedViewerCount)
        }

        if (event?.newHighestBid != null || event?.minimumNextBid != null || event?.bidId != null) {
          dispatch(receiveRealtimeBidUpdate(event))

          const nextItem = normalizeBidItem(
            {
              bidId: event.bidId || `rt-${Date.now()}`,
              auctionId: event.auctionId || activeLiveAuction.auctionId,
              username: event.highestBidderDisplayName || `User #${event.highestBidderId || '-'}`,
              userId: event.highestBidderId,
              bidAmount: event.newHighestBid,
              bidTime: event.bidTime,
            },
            websocketAuctionId,
          )

          setLiveBidHistory((prev) => {
            const exists = prev.some((item) => item.bidId === nextItem.bidId)
            if (exists) return prev
            return [nextItem, ...prev]
          })

          setFlashBidId(nextItem.bidId)
          setTimeout(() => {
            setFlashBidId((curr) => (curr === nextItem.bidId ? null : curr))
          }, 900)
        }
      })

      lifecycleSub = subscribeWs(`/topic/auctions/${websocketAuctionId}/lifecycle`, (event) => {
        const lifecycleType = String(event?.lifecycle || event?.type || '').toUpperCase()
        const auctionIdFromEvent = Number(event?.auctionId)
        const currentAuctionId = Number(websocketAuctionId)

        if (!Number.isFinite(auctionIdFromEvent) || !Number.isFinite(currentAuctionId)) {
          return
        }

        if (auctionIdFromEvent !== currentAuctionId) {
          return
        }

        if (lifecycleType === 'STARTED' || lifecycleType === 'ENDED') {
          dispatch(fetchListingDetail(id))
        }
      })

      if (activeLiveAuction?.auctionId) {
        presenceSub = subscribeWs(`/topic/auctions/${activeLiveAuction.auctionId}/presence`, (event) => {
          const nextViewerCount =
            event?.viewerCount ??
            event?.watcherCount ??
            event?.currentViewers ??
            event?.viewCount ??
            event?.onlineCount

          const normalizedViewerCount =
            typeof nextViewerCount === 'number' ? nextViewerCount : Number(nextViewerCount)

          if (Number.isFinite(normalizedViewerCount)) {
            setViewerCount(normalizedViewerCount)
          }
        })

        roomSub = subscribeWs(`/topic/auctions/${activeLiveAuction.auctionId}/room/messages`, (event) => {
          setAuctionRoomMessages((prev) => ({
            ...prev,
            [activeLiveAuction.auctionId]: [...(prev[activeLiveAuction.auctionId] || []), event],
          }))
        })

        publishWs('/app/auction.room.join', { auctionId: activeLiveAuction.auctionId })
      }
    }

    connectWs(onWsConnected)

    return () => {
      cancelled = true
      unregisterWsConnectedCallback(onWsConnected)
      if (activeLiveAuction?.auctionId) {
        publishWs('/app/auction.room.leave', { auctionId: activeLiveAuction.auctionId })
      }
      bidSub?.unsubscribe?.()
      roomSub?.unsubscribe?.()
      presenceSub?.unsubscribe?.()
      lifecycleSub?.unsubscribe?.()
    }
  }, [activeLiveAuction?.auctionId, dispatch, id, websocketAuctionId])

  useEffect(() => {
    const loadRoom = async () => {
      if (!activeLiveAuction?.auctionId) return
      const data = await getAuctionRoomMessages(activeLiveAuction.auctionId)
      setAuctionRoomMessages((prev) => ({
        ...prev,
        [activeLiveAuction.auctionId]: Array.isArray(data) ? data : [],
      }))
    }
    loadRoom()
  }, [activeLiveAuction?.auctionId])

  const handlePlaceBid = async () => {
    if (!activeLiveAuction?.auctionId) return

    if (!isVerified) {
      showToastError('Chỉ tài khoản đã xác thực mới được tham gia đặt bid.', 'Không thể đặt giá')
      return
    }

    const numericBidAmount = Number(bidAmount)
    if (!bidAmount || !Number.isFinite(numericBidAmount) || numericBidAmount <= 0) {
      showToastError('Vui lòng nhập giá bid hợp lệ.', 'Thiếu thông tin')
      return
    }

    if (minimumNextBidValue != null && numericBidAmount < Number(minimumNextBidValue)) {
      showToastError(
        `Giá bid tối thiểu là ${fmtCurrency(minimumNextBidValue)}.`,
        'Giá bid chưa đạt yêu cầu',
      )
      return
    }

    try {
      await dispatch(
        submitBid({ auctionId: activeLiveAuction.auctionId, bidAmount: numericBidAmount }),
      ).unwrap()
      setBidAmount('')
      dispatch(
        pushToast({
          type: 'success',
          title: 'Đặt giá thành công!',
          message: 'Lượt đặt giá của bạn đã được ghi nhận.',
          duration: 3200,
        }),
      )
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (typeof err === 'string' ? err : null) ||
        'Đặt giá thất bại'
      showToastError(msg, 'Đặt giá thất bại')
    }
  }

  const handleContactSeller = async () => {
    if (!listing?.seller) return
    const targetUserId = listing.seller.userId || listing.seller.id
    await dispatch(startDirectConversation({ targetUserId }))
    navigate('/account?tab=chat')
  }

  const handleSendAuctionRoomMessage = async () => {
    if (!isAuthenticated || !activeLiveAuction?.auctionId || !auctionRoomDraft.trim()) return
    const auctionId = activeLiveAuction.auctionId
    const content = auctionRoomDraft.trim()

    const sentViaWs = publishWs('/app/auction.room.send', { auctionId, content })
    if (!sentViaWs) {
      await sendAuctionRoomMessage(auctionId, { content })
    }
    setAuctionRoomDraft('')
  }

  const handleSubmitListingComment = async () => {
    if (!id) return

    if (!isAuthenticated) {
      showToastError('Vui lòng đăng nhập để bình luận.', 'Không thể bình luận')
      return
    }

    const content = listingCommentDraft.trim()
    if (!content) {
      showToastError('Vui lòng nhập nội dung bình luận.', 'Thiếu nội dung')
      return
    }

    setSubmittingListingComment(true)
    try {
      const newComment = await createListingComment(id, { content })

      setListingComments((prev) => mergeCommentsByIdentity([newComment], prev))
      setListingCommentsTotal((prev) => {
        const currentTotal = Number(prev)
        return Number.isFinite(currentTotal) ? currentTotal + 1 : listingComments.length + 1
      })
      setListingCommentDraft('')
      setListingCommentsLoaded(true)
      setListingCommentsError('')
      dispatch(fetchListingDetail(id))

      requestAnimationFrame(() => {
        if (listingCommentsSectionRef.current) {
          listingCommentsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    } catch (error) {
      showToastError(
        error?.response?.data?.message ||
          (typeof error?.response?.data === 'string' ? error.response.data : null) ||
          error?.message ||
          'Không thể gửi bình luận.',
        'Gửi bình luận thất bại',
      )
    } finally {
      setSubmittingListingComment(false)
    }
  }

  const handleOpenEndedAuction = async (auction) => {
    if (!auction?.auctionId) return

    setSelectedEndedAuctionId(auction.auctionId)
    setEndedAuctionLoading(true)

    try {
      const [bids, result] = await Promise.all([
        endedAuctionBidsById[auction.auctionId]
          ? Promise.resolve(endedAuctionBidsById[auction.auctionId])
          : getAuctionBids(auction.auctionId),
        String(auction.status) === 'ENDED'
          ? (endedAuctionResultById[auction.auctionId]
              ? Promise.resolve(endedAuctionResultById[auction.auctionId])
              : getAuctionResult(auction.auctionId).catch(() => null))
          : Promise.resolve(null),
      ])

      setEndedAuctionBidsById((prev) => ({
        ...prev,
        [auction.auctionId]: Array.isArray(bids) ? bids : [],
      }))

      if (result) {
        setEndedAuctionResultById((prev) => ({
          ...prev,
          [auction.auctionId]: result,
        }))
      }
    } finally {
      setEndedAuctionLoading(false)
    }
  }

  const closeEndedAuctionModal = () => {
    setSelectedEndedAuctionId(null)
    setFocusedEndedAuctionId(null)

    if (!searchParams.has('auctionId')) return

    const next = new URLSearchParams(searchParams)
    next.delete('auctionId')
    navigate({ pathname: `/listings/${id}`, search: next.toString() ? `?${next.toString()}` : '' }, { replace: true })
  }

  const liveRoomMessages = auctionRoomMessages[activeLiveAuction?.auctionId] || []

  useEffect(() => {
    const el = auctionRoomScrollRef.current
    if (!el) return

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [liveRoomMessages.length])

  useEffect(() => {
    const sentinel = listingCommentsSentinelRef.current
    if (
      !sentinel ||
      typeof IntersectionObserver === 'undefined' ||
      !listingCommentsLoaded ||
      listingCommentsLoading ||
      !listingCommentsHasMore ||
      listingCommentsError
    ) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadListingComments(listingCommentsPage + 1)
        }
      },
      {
        root: null,
        rootMargin: '240px 0px 320px',
        threshold: 0.01,
      },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [
    listingCommentsError,
    listingCommentsHasMore,
    listingCommentsLoaded,
    listingCommentsLoading,
    listingCommentsPage,
    loadListingComments,
  ])

  

  const isOwner =
    authUser && Number(listing?.seller?.userId || listing?.seller?.id) === Number(authUser.userId)

  const hasActiveAuction = useMemo(
    () => auctions.some((a) => ['LIVE', 'SCHEDULED'].includes(String(a.status))),
    [auctions],
  )

  const canCreateAuction = useMemo(() => {
    if (!listing) return false
    const status = String(listing.status)
    return Boolean(isOwner) && status === 'APPROVED' && !hasActiveAuction && listingNotSold
  }, [listing, isOwner, hasActiveAuction, listingNotSold])

  const createAuctionBlockedReason = useMemo(() => {
    if (!listing || !isOwner) {
      return 'Chỉ người bán của bài đăng mới có thể tạo phiên đấu giá.'
    }

    const listingStatus = String(listing.status || 'UNKNOWN')

    if (listingStatus === 'WAIT_FOR_PAYMENT') {
      return 'Bài đăng đang chờ người thắng thanh toán (24h). Quá hạn hệ thống sẽ đưa bài về APPROVED để bạn tạo phiên mới.'
    }

    if (listingStatus === 'SOLD') {
      return 'Bài đăng đã được thanh toán (SOLD), không thể tạo phiên mới.'
    }

    if (listingStatus !== 'APPROVED') {
      return `Bài đăng hiện đang ở trạng thái ${listingStatus}, cần APPROVED để tạo phiên.`
    }

    const activeAuction = auctions.find((a) => ['LIVE', 'SCHEDULED'].includes(String(a.status)))
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
  }, [listing, isOwner, auctions, listingNotSold, checkingNotSold])

  const proxyMinimumRequiredValue = useMemo(() => {
    if (!activeLiveAuction) return null

    const startingPrice = toFiniteNumber(activeLiveAuction.startingPrice)
    if (startingPrice == null) return null

    const currentHighestBid = toFiniteNumber(highestBidValue)
    if (currentHighestBid == null) return startingPrice

    if (
      currentUserId != null &&
      currentHighestBidderId != null &&
      Number(currentHighestBidderId) === Number(currentUserId)
    ) {
      return currentHighestBid
    }

    const bidIncrement = toFiniteNumber(activeLiveAuction.bidIncrement)
    if (bidIncrement == null || bidIncrement <= 0) return null

    return currentHighestBid + bidIncrement
  }, [activeLiveAuction, currentHighestBidderId, currentUserId, highestBidValue])

  const proxyBidQuickOptions = useMemo(() => {
    const minimum = toFiniteNumber(proxyMinimumRequiredValue)
    if (minimum == null) return []

    const bidIncrement = toFiniteNumber(activeLiveAuction?.bidIncrement) || 0
    const rawOptions = [
      { amount: minimum, label: 'Tối thiểu' },
      bidIncrement > 0 ? { amount: minimum + bidIncrement, label: '+1 bước' } : null,
      { amount: minimum + 5000000, label: '+5 triệu' },
      { amount: minimum + 10000000, label: '+10 triệu' },
    ].filter(Boolean)

    const seen = new Set()
    return rawOptions.filter((option) => {
      const key = String(option.amount)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [activeLiveAuction?.bidIncrement, proxyMinimumRequiredValue])

  const proxyBidBlockedReason = useMemo(() => {
    if (!isAuthenticated) return 'Vui lòng đăng nhập để dùng đặt giá tự động.'
    return ''
  }, [isAuthenticated, isOwner, isVerified])

  const canManageProxyBid = Boolean(activeLiveAuction?.auctionId) && isAuthenticated && !isOwner
  const canUseProxyBid = canManageProxyBid && !proxyBidBlockedReason
  const proxyBidMaxNumber = toFiniteNumber(proxyBidState?.maxBidAmount)
  const isProxyBidCeilingLow =
    Boolean(proxyBidState?.active) &&
    proxyBidMaxNumber != null &&
    proxyMinimumRequiredValue != null &&
    proxyBidMaxNumber < Number(proxyMinimumRequiredValue)
  const proxyBidStatusLabel = proxyBidState?.active ? 'Đang bật' : proxyBidState ? 'Đã tắt' : 'Chưa bật'
  const proxyBidStatusClass = proxyBidState?.active
    ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
    : proxyBidState
      ? 'bg-slate-100 text-slate-600 ring-slate-200'
      : 'bg-amber-50 text-amber-700 ring-amber-200'

  const sellerUserId = Number(listing?.seller?.userId || listing?.seller?.id)
  const sellerName = listing?.seller?.username || listing?.seller?.email || 'Ẩn danh'
  const sellerAvatarUrl = listing?.seller?.profile?.avatarUrl || listing?.seller?.avatarUrl || ''
  const sellerInitial = String(sellerName || 'U').trim().charAt(0).toUpperCase()
  const currentUserName =
    authUser?.username ||
    authUser?.email ||
    account?.profile?.username ||
    account?.profile?.email ||
    'Bạn'
  const currentUserAvatarUrl =
    account?.profile?.profile?.avatarUrl ||
    authUser?.profile?.avatarUrl ||
    authUser?.avatarUrl ||
    ''
  const listingCommentsTotalNumber = Number(listingCommentsTotal)
  const listingCommentCount =
    listingCommentsLoaded &&
    Number.isFinite(listingCommentsTotalNumber) &&
    (!listingCommentsError || listingComments.length > 0)
      ? Math.max(listingCommentsTotalNumber, listingComments.length)
      : Number(listing?.commentCount || listingComments.length || 0)

  const selectedEndedAuction =
    auctionHistory.find((a) => Number(a.auctionId) === Number(selectedEndedAuctionId)) || null
  const selectedEndedBids = selectedEndedAuctionId
    ? endedAuctionBidsById[selectedEndedAuctionId] || []
    : []
  const selectedEndedResult = selectedEndedAuctionId
    ? endedAuctionResultById[selectedEndedAuctionId] || null
    : null

  const showToastError = (message, title = 'Có lỗi xảy ra') => {
    dispatch(
      pushToast({
        type: 'error',
        title,
        message: String(message),
        duration: 4200,
      }),
    )
  }

  useEffect(() => {
    const auctionId = activeLiveAuction?.auctionId
    let cancelled = false

    setProxyBidState(null)
    setProxyBidAmount('')

    if (!auctionId || !canManageProxyBid) {
      setProxyBidLoading(false)
      return undefined
    }

    setProxyBidLoading(true)
    getMyProxyBid(auctionId)
      .then((proxyBid) => {
        if (cancelled) return
        setProxyBidState(proxyBid || null)
        setProxyBidAmount(proxyBid?.maxBidAmount != null ? String(Number(proxyBid.maxBidAmount)) : '')
      })
      .catch((error) => {
        if (cancelled) return
        if (error?.response?.status === 404) {
          setProxyBidState(null)
          setProxyBidAmount('')
          return
        }


      })
      .finally(() => {
        if (!cancelled) {
          setProxyBidLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeLiveAuction?.auctionId, canManageProxyBid, dispatch])

  const handleQuickBidAmount = (amount) => {
    if (minimumNextBidValue == null || !Number.isFinite(Number(minimumNextBidValue))) {
      showToastError('Chưa xác định được giá tối thiểu có thể đặt.', 'Không thể đặt giá nhanh')
      return
    }

    setBidAmount(String(Number(amount)))
  }

  const handleQuickProxyBidAmount = (amount) => {
    setProxyBidAmount(String(Number(amount)))
  }

  const handleSetProxyBid = async () => {
    if (!activeLiveAuction?.auctionId) return

    if (proxyBidBlockedReason) {
      showToastError(proxyBidBlockedReason, 'Không thể dùng đặt giá tự động')
      return
    }

    const numericMaxBid = Number(proxyBidAmount)
    if (!proxyBidAmount || !Number.isFinite(numericMaxBid) || numericMaxBid <= 0) {
      showToastError('Vui lòng nhập mức trần đặt giá tự động hợp lệ.', 'Thiếu thông tin')
      return
    }

    if (proxyMinimumRequiredValue != null && numericMaxBid < Number(proxyMinimumRequiredValue)) {
      showToastError(
        `Mức trần đặt giá tự động tối thiểu là ${fmtCurrency(proxyMinimumRequiredValue)}.`,
        'Mức trần chưa đạt yêu cầu',
      )
      return
    }

    const auctionId = activeLiveAuction.auctionId
    setProxyBidSaving(true)

    try {
      const response = await setProxyBidApi(auctionId, numericMaxBid)
      setProxyBidState(response)
      setProxyBidAmount(
        response?.maxBidAmount != null ? String(Number(response.maxBidAmount)) : String(numericMaxBid),
      )

      await Promise.all([dispatch(fetchListingDetail(id)), dispatch(fetchAuctionBids(auctionId))])

      dispatch(
        pushToast({
          type: 'success',
          title: response?.active ? ' Đặt giá tự động đã bật' : 'Đặt giá tự động đã cập nhật',
          message: `Mức trần hiện tại: ${fmtCurrency(response?.maxBidAmount ?? numericMaxBid)}.`,
          duration: 3600,
        }),
      )
    } catch (error) {
      showToastError(
        error?.response?.data?.message ||
          error?.message ||
          (typeof error === 'string' ? error : 'Không thể lưu đặt giá tự động.'),
        'Lưu đặt giá tự động thất bại',
      )
    } finally {
      setProxyBidSaving(false)
    }
  }

  const handleDisableProxyBid = async () => {
    if (!activeLiveAuction?.auctionId) return

    const auctionId = activeLiveAuction.auctionId
    setProxyBidSaving(true)

    try {
      const response = await disableProxyBidApi(auctionId)
      setProxyBidState(response ? { ...response, active: false } : null)

      await dispatch(fetchListingDetail(id))

      dispatch(
        pushToast({
          type: 'success',
          title: 'Đặt giá tự động đã tắt',
          message: 'Bạn sẽ không còn đặt giá tự động cho phiên này nữa.',
          duration: 3200,
        }),
      )
    } catch (error) {
      if (error?.response?.status === 404) {
        setProxyBidState(null)
        setProxyBidAmount('')
        showToastError('Bạn chưa có đặt giá tự động trong phiên này.', 'Không có đặt giá tự động để tắt')
      } else {
        showToastError(
          error?.response?.data?.message ||
            error?.message ||
            (typeof error === 'string' ? error : 'Không thể tắt đặt giá tự động.'),
          'Tắt đặt giá tự động thất bại',
        )
      }
    } finally {
      setProxyBidSaving(false)
    }
  }

  const handleCreateAuction = async () => {
    if (!id) return

    if (!canCreateAuction) {
      showToastError(createAuctionBlockedReason || 'Không đủ điều kiện tạo phiên đấu giá', 'Không thể tạo phiên')
      return
    }

    try {
      const startTimeComposed = composeStartTime(
        createAuctionForm.startDateDisplay,
        createAuctionForm.startHour,
        createAuctionForm.startMinute,
      )
      if (!startTimeComposed) {
        showToastError('Vui lòng chọn ngày và nhập giờ/phút hợp lệ theo định dạng 24h (ví dụ 21:05).', 'Thiếu thông tin')
        return
      }

      const durationMinutes = Number(createAuctionForm.durationMinutes || 0)
      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        showToastError('Thời lượng phiên (phút) phải lớn hơn 0.', 'Thiếu thông tin')
        return
      }

      const startingPrice = Number(createAuctionForm.startingPrice || 0)
      if (!Number.isFinite(startingPrice) || startingPrice <= 0) {
        showToastError('Giá khởi điểm phải lớn hơn 0.', 'Thiếu thông tin')
        return
      }

      const bidIncrement = Number(createAuctionForm.bidIncrement || 0)
      if (!Number.isFinite(bidIncrement) || bidIncrement <= 0) {
        showToastError('Bước giá phải lớn hơn 0.', 'Thiếu thông tin')
        return
      }

      const startDate = new Date(startTimeComposed)
      if (Number.isNaN(startDate.getTime())) {
        showToastError('Thời gian bắt đầu không hợp lệ.', 'Thiếu thông tin')
        return
      }

      const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
      const endTimeLocal = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(
        endDate.getDate(),
      ).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}:${String(
        endDate.getMinutes(),
      ).padStart(2, '0')}:${String(endDate.getSeconds()).padStart(2, '0')}`

      const payload = {
        listingId: Number(id),
        startTime: startTimeComposed,
        endTime: endTimeLocal,
        startingPrice,
        reservePrice: createAuctionForm.reservePrice ? Number(createAuctionForm.reservePrice) : null,
        bidIncrement,
        softCloseEnabled: createAuctionForm.softCloseEnabled,
        softCloseTriggerSeconds: Number(createAuctionForm.softCloseTriggerSeconds || 60),
        softCloseExtendSeconds: Number(createAuctionForm.softCloseExtendSeconds || 60),
      }

      setCreatingAuction(true)
      await dispatch(createListingAuction(payload)).unwrap()
      await dispatch(fetchListingDetail(id))
      dispatch(
        pushToast({
          type: 'success',
          title: 'Tạo phiên đấu giá thành công',
          message: 'Phiên mới đã được tạo và sẽ sớm hiển thị cho người dùng.',
          duration: 3600,
        }),
      )

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
    } catch (error) {
      showToastError(
        error?.response?.data?.message ||
          error?.message ||
          (typeof error === 'string' ? error : 'Không thể tạo phiên đấu giá.'),
        'Tạo phiên thất bại',
      )
    } finally {
      setCreatingAuction(false)
    }
  }

  useEffect(() => {
    if (!selectedEndedAuctionId) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeEndedAuctionModal()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedEndedAuctionId])

  if (!listing) {
    return (
      <div className="py-12 text-center">
        <div className="text-slate-500">Đang tải...</div>
      </div>
    )
  }

  const listingStatusMeta = getListingStatusMeta(listing?.status)

  return (
    <div className="space-y-6 rounded-3xl bg-slate-200/80 p-4 py-6 md:p-6">
      <button
        onClick={() => navigate('/listings')}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-slate-900 hover:cursor-pointer"
      >
        <FaArrowLeft />
        Quay lại
      </button>

      <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-lg shadow-[0_10px_0_rgba(15,23,42,0.14)]">
            <ListingImageSlider images={listing?.car?.images || []} />
          </div>

          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-300 shadow-lg shadow-[0_12px_0_rgba(15,23,42,0.16)]">
            <h1 className="text-3xl font-black text-slate-900">{listing.title}</h1>
            <p className="mt-3 text-slate-700">{listing.description || 'Không có mô tả.'}</p>

            <div className="mt-6 rounded-2xl bg-slate-100 p-5 ring-1 ring-slate-300 shadow-sm">
              <div className="mb-4 text-sm font-extrabold uppercase tracking-wider text-slate-800">Thông tin xe</div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaCarSide />Tên xe</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{listing?.car?.name || '—'}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaTag />Hãng xe</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{listing?.car?.brand || '—'}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaCar />Model</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{listing?.car?.model || '—'}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaCalendarAlt />Năm sản xuất</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{withUnit(listing?.car?.year, '')}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaGlobeAsia />Xuất xứ</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{listing?.car?.origin || '—'}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaGasPump />Nhiên liệu</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{listing?.car?.fuelType || '—'}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaPalette />Màu sắc</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{listing?.car?.color || '—'}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaCarSide />Kiểu thân xe</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{listing?.car?.bodyType || '—'}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaCogs />Hộp số</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{listing?.car?.transmission || '—'}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaCogs />Động cơ</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{withUnit(listing?.car?.engine, 'cc')}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaTachometerAlt />Công suất</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{withUnit(listing?.car?.horsepower, 'HP')}</div>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-slate-300">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><FaTachometerAlt />Số km đã chạy</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{withUnit(listing?.car?.mileage, 'km')}</div>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 md:items-stretch">
              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-300">
                <div className="flex items-start gap-2">
                  <div className="rounded-lg bg-red-100 p-2 text-red-600">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nơi bán</div>
                    <div className="mt-1 text-sm font-bold text-slate-900">
                      {listing.addressSell || 'Chưa cập nhật'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-300">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300">
                      {sellerAvatarUrl ? (
                        <img
                          src={sellerAvatarUrl}
                          alt={sellerName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-sm font-black text-slate-700">
                          {sellerInitial}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Người bán</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">
                        {sellerName}
                      </div>
                    </div>
                  </div>

                  {!isOwner && (
                    <button
                      onClick={handleContactSeller}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 hover:cursor-pointer"
                    >
                      <FaComments />
                      Liên hệ
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-300">
                <div className="flex items-start gap-2">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
                    <FaEye />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Số người đã xem
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-900">
                      {Number.isFinite(Number(listing?.viewCount)) ? listing.viewCount : 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white p-2.5 ring-1 ring-slate-300">
  <div className="flex items-start gap-3">

    {/* Icon */}
    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
      <MdVerified className="text-lg" />
    </div>

    {/* Content */}
    <div className="flex flex-col gap-1">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Trạng thái bài đăng
      </div>

      <span
        className={`inline-flex w-fit rounded-md px-2 py-1 text-xs font-bold ring-1 ${listingStatusMeta.badgeClass}`}
      >
        {listingStatusMeta.label}
      </span>
    </div>

  </div>
</div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-300 shadow-lg shadow-[0_12px_0_rgba(15,23,42,0.16)]">
            <h2 className="mb-4 text-xl font-extrabold text-slate-900">Lịch sử phiên đấu giá</h2>
            {auctionHistory.length === 0 ? (
              <div className="text-center text-slate-500">Chưa có phiên đấu giá nào kết thúc.</div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleAuctionHistory.map((a, idx) => (
                  <div
                    key={a.auctionId}
                    ref={(el) => {
                      if (el) endedAuctionCardRefs.current[String(a.auctionId)] = el
                    }}
                    id={`auction-${a.auctionId}`}
                    className={`rounded-xl border bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition ${
                      focusedEndedAuctionId === Number(a.auctionId)
                        ? 'border-red-400 ring-2 ring-red-200 shadow-[0_10px_24px_rgba(239,68,68,0.15)]'
                        : 'border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-900">Phiên #{a.auctionId}</div>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-800">
                        {formatAuctionResultBadgeLabel(
                          a.auctionResultStatus || endedAuctionResultById[a.auctionId]?.auctionResultStatus,
                          listing?.status,
                        )}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <div>Bắt đầu: {fmtDate(a.startTime)}</div>
                      <div>Kết thúc: {fmtDate(a.endTime)}</div>
                      <div>Giá khởi điểm: {fmtCurrency(a.startingPrice)}</div>
                      <div>
                        Giá cao nhất:{' '}
                        {fmtCurrency(a.currentHighestBid ?? a.startingPrice)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenEndedAuction(a)}
                      className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700 hover:cursor-pointer"
                    >
                      Xem chi tiết phiên
                    </button>
                  </div>
                  ))}
                </div>

                {hasMoreAuctionHistory && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleAuctionHistoryCount((current) =>
                          Math.min(current + AUCTION_HISTORY_PAGE_SIZE, auctionHistory.length),
                        )
                      }
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 hover:cursor-pointer"
                    >
                      Xem thêm phiên cũ hơn
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {activeLiveAuction ? (
            <div className="rounded-2xl bg-emerald-50 p-4 ring-2 ring-emerald-200 shadow-lg shadow-[0_12px_0_rgba(15,23,42,0.16)]">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-600"></div>
                <div className="text-sm font-extrabold uppercase text-emerald-700">Phiên đấu giá LIVE</div>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg bg-white p-3 text-center">
                  <div className="text-xs text-slate-600">Giá khởi điểm</div>
                  <div className="text-2xl font-black text-emerald-600">{fmtCurrency(activeLiveAuction.startingPrice)}</div>
                </div>

                <div className="rounded-lg bg-white p-3 text-center">
                  <div className="text-xs text-slate-600">Giá cao nhất hiện tại</div>
                  <div className="mt-1 text-3xl font-black text-red-600">
                    <RollingPriceDisplay value={highestBidValue} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-3 text-center ring-1 ring-emerald-100">
                    <div className="inline-flex items-center gap-1 text-slate-600">
                      <FaGavel />
                      Lượt đặt giá
                    </div>
                    <div className="mt-1 text-xl font-black text-emerald-700">{liveBidHistory.length}</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 text-center ring-1 ring-emerald-100">
                    <div className="inline-flex items-center gap-1 text-slate-600">
                      <FaUsers />
                      Đang xem
                    </div>
                    <div className="mt-1 text-xl font-black text-sky-700">{viewerCount}</div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-3 text-center">
                  <div className="inline-flex items-center gap-2 text-xs text-slate-600">
                    <FaClock />
                    Thời gian còn lại
                  </div>
                  <div className="mt-1 text-2xl font-black text-emerald-700">{countdownText}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-white p-2 text-center">
                    <div className="text-slate-600">Bắt đầu</div>
                    <div className="mt-1 font-bold text-slate-900">{fmtDate(activeLiveAuction.startTime)}</div>
                  </div>
                  <div className="rounded-lg bg-white p-2 text-center">
                    <div className="text-slate-600">Kết thúc</div>
                    <div className="mt-1 font-bold text-slate-900">{fmtDate(activeLiveAuction.endTime)}</div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-3">
                  <div className="mb-2 text-xs font-semibold text-slate-600">
                    Giá tối thiểu có thể đặt tiếp theo:{' '}
                    <span className="font-black text-emerald-700">
                      {minimumNextBidValue != null ? fmtCurrency(minimumNextBidValue) : '—'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={minimumNextBidValue ?? undefined}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Nhập giá bid"
                      disabled={!isVerified}
                      className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <button
                      onClick={handlePlaceBid}
                      disabled={!isVerified || isOwner}
                      className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 hover:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                    >
                      <FaGavel className="text-xs" />
                      Đặt giá
                    </button>
                  </div>
                  {!isVerified && (
                    <div className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      Tài khoản chưa xác thực nên chưa thể tham gia đặt giá.
                    </div>
                  )}
                  {quickBidOptions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {quickBidOptions.map((option) => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => handleQuickBidAmount(option.amount)}
                          className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 hover:cursor-pointer"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {isAuthenticated && (
                  <div className="rounded-lg bg-white p-3 ring-1 ring-emerald-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-700">
                        Đặt giá tự động
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-slate-500">
                        {proxyMinimumRequiredValue != null
                          ? `Tối thiểu ${fmtCurrency(proxyMinimumRequiredValue)}`
                          : 'Đang xác định mức tối thiểu'}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-black ring-1 ${proxyBidStatusClass}`}
                    >
                      {proxyBidStatusLabel}
                    </span>
                  </div>
                  
                  {proxyBidLoading ? (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                      Đang tải đặt giá tự động...
                    </div>
                  ) : (
                    <>
                      {proxyBidState?.maxBidAmount != null && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg bg-emerald-50 p-2 ring-1 ring-emerald-100">
                            <div className="text-slate-600">Mức trần hiện tại</div>
                            <div className="mt-1 text-sm font-black text-emerald-700">
                              {fmtCurrency(proxyBidState.maxBidAmount)}
                            </div>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
                            <div className="text-slate-600">Cập nhật</div>
                            <div className="mt-1 truncate font-bold text-slate-800">
                              {fmtDate(proxyBidState.updatedAt || proxyBidState.createdAt)}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex gap-2">
                        <input
                          type="number"
                          min={proxyMinimumRequiredValue ?? undefined}
                          step={activeLiveAuction.bidIncrement || undefined}
                          value={proxyBidAmount}
                          onChange={(e) => setProxyBidAmount(e.target.value)}
                          placeholder="Mức trần đặt giá tự động"
                          disabled={!canUseProxyBid || proxyBidSaving}
                          className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <button
                          type="button"
                          onClick={handleSetProxyBid}
                          disabled={!canUseProxyBid || proxyBidSaving || proxyMinimumRequiredValue == null}
                          className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-white hover:bg-amber-600 hover:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          <FaBolt className="text-xs" />
                          {proxyBidSaving ? 'Đang lưu...' : proxyBidState?.active ? 'Cập nhật' : 'Bật'}
                        </button>
                      </div>

                      {proxyBidQuickOptions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {proxyBidQuickOptions.map((option) => (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => handleQuickProxyBidAmount(option.amount)}
                              disabled={!canUseProxyBid || proxyBidSaving}
                              className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 hover:cursor-pointer disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {proxyBidBlockedReason && (
                        <div className="mt-2 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          {proxyBidBlockedReason}
                        </div>
                      )}

                      {isProxyBidCeilingLow && (
                        <div className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                          Mức trần hiện thấp hơn giá tối thiểu kế tiếp.
                        </div>
                      )}

                      {proxyBidState?.active && (
                        <button
                          type="button"
                          onClick={handleDisableProxyBid}
                          disabled={!canManageProxyBid || proxyBidSaving}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FaPowerOff />
                          Tắt đặt giá tự động
                        </button>
                      )}
                    </>
                  )}
                </div>
                )}
                

                <div className="rounded-lg bg-white p-3 ring-1 ring-emerald-100">
                  <div className="mb-2 text-xs font-bold uppercase text-slate-700">Lịch sử đặt giá</div>
                  <div className="max-h-44 space-y-2 overflow-auto rounded-lg bg-emerald-50 p-2">
                    {liveBidHistory.length === 0 && (
                      <div className="text-xs text-slate-500">Chưa có lượt đặt giá nào.</div>
                    )}
                    {liveBidHistory.map((b, idx) => (
                      <div
                        key={b.bidId}
                        className={`rounded-lg px-2 py-2 text-xs ring-1 ${
                          idx === 0 ? 'bg-yellow-100 ring-yellow-300' : 'bg-white ring-emerald-100'
                        } ${flashBidId === b.bidId ? 'bid-feed-item-enter' : ''}`}
                      >
                        <div className="font-semibold text-slate-800">{b.username}</div>
                        <div className="mt-0.5 text-base font-black tracking-tight text-red-700">
                          {fmtCurrency(b.bidAmount)}
                        </div>
                        <div className="text-[11px] text-slate-500">{fmtDate(b.bidTime)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                
              </div>
            </div>
          ) : upcomingAuction ? (
            <div className="rounded-2xl bg-amber-50 p-4 ring-2 ring-amber-200 shadow-lg shadow-[0_12px_0_rgba(15,23,42,0.16)]">
              <div className="mb-3 text-sm font-extrabold uppercase text-amber-700">Phiên sắp tới</div>
              <div className="space-y-2 text-sm">
                <div className="rounded-lg bg-white p-2 text-center">
                  <div className="text-xs text-slate-600">Giá khởi điểm</div>
                  <div className="font-bold text-amber-600">{fmtCurrency(upcomingAuction.startingPrice)}</div>
                </div>
                <div className="rounded-lg bg-white p-2 text-center">
                  <div className="inline-flex items-center gap-1 text-xs text-slate-600">
                    <FaClock />
                    Bắt đầu sau
                  </div>
                  <div className="mt-1 text-xl font-black text-amber-700">{upcomingCountdownText}</div>
                </div>
                <div className="rounded-lg bg-white p-2 text-center">
                  <div className="text-xs text-slate-600">Bắt đầu vào</div>
                  <div className="font-bold text-slate-900">{fmtDate(upcomingAuction.startTime)}</div>
                </div>
              </div>
            </div>
          ) : String(listing?.status) === 'WAIT_FOR_PAYMENT' ? (
            <div className="rounded-2xl bg-sky-50 p-4 ring-2 ring-sky-200 shadow-lg shadow-[0_12px_0_rgba(15,23,42,0.16)]">
              <div className="text-sm font-extrabold uppercase text-sky-700">Chờ thanh toán</div>
              <div className="mt-2 text-sm font-semibold text-sky-900">
                Phiên đấu giá đã có người thắng và đang chờ thanh toán trong 24 giờ.
              </div>
              {listing?.payment?.expiresAt && (
                <div className="mt-2 text-xs font-semibold text-sky-700">Hạn thanh toán: {fmtDate(listing.payment.expiresAt)}</div>
              )}
            </div>
          ) : String(listing?.status) === 'SOLD' ? (
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-yellow-50 p-4 ring-2 ring-emerald-200 shadow-lg shadow-[0_12px_0_rgba(15,23,42,0.16)]">
              <div className="text-sm font-extrabold uppercase text-emerald-700">Giao dịch hoàn tất</div>
              <div className="mt-2 text-sm font-semibold text-emerald-900">Người thắng đã thanh toán cho bài đăng này.</div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-4 ring-2 ring-slate-300 shadow-lg shadow-[0_12px_0_rgba(15,23,42,0.16)]">
              <div className="text-sm font-bold text-slate-800">
                {isOwner ? 'Hiện tại chưa có phiên đấu giá' : 'Hiện không có phiên đấu giá'}
              </div>
              
              {!isOwner && auctionHistory.length > 0 && (
                <button
                  onClick={() => {
                    const nearestAuction = auctionHistory[0]
                    setSelectedEndedAuctionId(Number(nearestAuction.auctionId))
                    setFocusedEndedAuctionId(Number(nearestAuction.auctionId))
                    handleOpenEndedAuction(nearestAuction)
                  }}
                  className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-700 hover:cursor-pointer"
                >
                  Xem chi tiết phiên đấu giá gần nhất
                </button>
              )}


              {isOwner && canCreateAuction && (
                <div className="mt-3 space-y-3 rounded-xl bg-white p-3 ring-1 ring-slate-300">
                  <div className="text-xs font-semibold text-slate-600">
                    Bạn có thể tạo phiên đấu giá mới cho bài đăng này.
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Thời gian bắt đầu</label>
                    <div className="mt-1 grid grid-cols-[1fr_auto] gap-2">
                      <input
                        type="date"
                        value={createAuctionForm.startDateDisplay}
                        onChange={(e) =>
                          setCreateAuctionForm((prev) => ({ ...prev, startDateDisplay: e.target.value }))
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
                            setCreateAuctionForm((prev) => ({ ...prev, startHour: hourValue }))
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
                            setCreateAuctionForm((prev) => ({ ...prev, startMinute: minuteValue }))
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
                        setCreateAuctionForm((prev) => ({ ...prev, durationMinutes: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Giá khởi điểm</label>
                      <input
                        type="number"
                        step="0.01"
                        value={createAuctionForm.startingPrice}
                        onChange={(e) =>
                          setCreateAuctionForm((prev) => ({ ...prev, startingPrice: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Bước giá</label>
                      <input
                        type="number"
                        step="0.01"
                        value={createAuctionForm.bidIncrement}
                        onChange={(e) =>
                          setCreateAuctionForm((prev) => ({ ...prev, bidIncrement: e.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600">Giá dự trữ (tùy chọn)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={createAuctionForm.reservePrice}
                      onChange={(e) =>
                        setCreateAuctionForm((prev) => ({ ...prev, reservePrice: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={createAuctionForm.softCloseEnabled}
                      onChange={(e) =>
                        setCreateAuctionForm((prev) => ({ ...prev, softCloseEnabled: e.target.checked }))
                      }
                      className="rounded border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-700">Bật Soft Close (tự động gia hạn)</span>
                  </label>

                  {createAuctionForm.softCloseEnabled && (
                    <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600">Kích hoạt sau (giây)</label>
                        <input
                          type="number"
                          min="1"
                          value={createAuctionForm.softCloseTriggerSeconds}
                          onChange={(e) =>
                            setCreateAuctionForm((prev) => ({
                              ...prev,
                              softCloseTriggerSeconds: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600">Gia hạn (giây)</label>
                        <input
                          type="number"
                          min="1"
                          value={createAuctionForm.softCloseExtendSeconds}
                          onChange={(e) =>
                            setCreateAuctionForm((prev) => ({
                              ...prev,
                              softCloseExtendSeconds: e.target.value,
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCreateAuction}
                    disabled={creatingAuction}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaPlus />
                    {creatingAuction ? 'Đang tạo...' : 'Tạo phiên đấu giá'}
                  </button>
                </div>
              )}

              {isOwner && !canCreateAuction && (
                <div className="mt-2 text-xs text-slate-600">
                  {createAuctionBlockedReason}
                </div>
              )}
            </div>
          )}
          {/* Chat box riêng */}
          {activeLiveAuction && (
            <div className="rounded-2xl bg-gradient-to-b from-white to-emerald-50/30 p-4 ring-2 ring-emerald-200 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-extrabold uppercase text-emerald-700">
                  Kênh đấu giá
                </div>
                <div className="text-xs font-medium text-slate-500">
                  Phiên #{activeLiveAuction.auctionId}
                </div>
              </div>

              <div
                ref={auctionRoomScrollRef}
                className="h-[420px] space-y-2 overflow-y-auto overflow-x-hidden rounded-xl bg-white p-3 ring-1 ring-emerald-200"
              >
                {liveRoomMessages.length === 0 && (
                  <div className="text-xs text-slate-500 text-center align-middle ">Chưa có tin nhắn nào</div>
                )}

                {liveRoomMessages.map((m) => {
                  const senderId = Number(m.senderUserId || m.senderId || m.userId)
                  const isMine = currentUserId && senderId === currentUserId
                  const isSeller = sellerUserId && senderId === sellerUserId

                  return (
                    <div
                      key={m.messageId || m.id}
                      className={`flex justify-start`}
                    >
                      <div
                        className={[
                          'w-fit max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm ring-1',
                          isMine
                            ? 'bg-emerald-500 text-white ring-emerald-400'
                            : isSeller
                            ? 'bg-yellow-100 text-yellow-900 ring-yellow-300'
                            : 'bg-white text-slate-800 ring-slate-200',
                        ].join(' ')}
                      >
                        <div
                          className={`mb-1 text-[11px] font-semibold ${
                            isMine
                              ? 'text-emerald-50'
                              : isSeller
                              ? 'text-yellow-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {m.senderDisplayName || m.sender || 'Người dùng'}
                          {isSeller && !isMine ? ' • Người bán' : ''}
                        </div>

                        <div className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                          {m.content}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {isAuthenticated ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={auctionRoomDraft}
                    disabled={!isAuthenticated}
                    onChange={(e) => setAuctionRoomDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (!isAuthenticated) {
                        e.preventDefault()
                        return
                      }

                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendAuctionRoomMessage()
                    }
                  }}
                  placeholder="Gửi vào kênh..."
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                />
                <button
                  onClick={handleSendAuctionRoomMessage}
                  disabled={!isAuthenticated}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Gửi
                </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="mt-3 block rounded-lg bg-amber-50 p-3 text-center text-xs font-semibold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100 hover:text-amber-800"
                >
                  Đăng nhập để tham gia trò chuyện trong kênh đấu giá
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <section
        ref={listingCommentsSectionRef}
        className="rounded-2xl bg-white p-5 ring-1 ring-slate-300 shadow-lg shadow-[0_12px_0_rgba(15,23,42,0.16)] md:p-6"
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-xl font-black text-slate-950">Bình luận</h2>
            <span className="text-sm font-bold text-slate-600">{listingCommentCount}</span>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
            <FaComments className="text-slate-500" />
            Mới nhất trước
          </div>
        </div>

        {isAuthenticated ? (
          <div className="mb-8 flex gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300">
              <span className="flex h-full w-full items-center justify-center text-sm font-black text-slate-700">
                {getDisplayInitial(currentUserName)}
              </span>
              {currentUserAvatarUrl && (
                <img
                  src={currentUserAvatarUrl}
                  alt={currentUserName}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <textarea
                value={listingCommentDraft}
                onChange={(event) => setListingCommentDraft(event.target.value)}
                rows={1}
                placeholder="Thêm bình luận công khai..."
                className="min-h-10 w-full resize-y border-0 border-b border-slate-300 bg-transparent px-0 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-0"
              />
              <div className="mt-2 flex justify-end gap-2">
                {listingCommentDraft.trim() && (
                  <button
                    type="button"
                    onClick={() => setListingCommentDraft('')}
                    className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSubmitListingComment}
                  disabled={submittingListingComment || !listingCommentDraft.trim()}
                  className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-700 hover:cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {submittingListingComment ? 'Đang gửi' : 'Bình luận'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="mb-8 block rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Đăng nhập để bình luận
          </Link>
        )}

        <div className="space-y-6">
          {!listingCommentsLoaded && listingCommentsLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex animate-pulse gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-36 rounded bg-slate-200" />
                  <div className="h-3 w-full rounded bg-slate-200" />
                  <div className="h-3 w-2/3 rounded bg-slate-200" />
                </div>
              </div>
            ))
          ) : listingCommentsError && listingComments.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-5 text-center">
              <div className="text-sm font-semibold text-slate-600">{listingCommentsError}</div>
              <button
                type="button"
                onClick={() => loadListingComments(0, { replace: true })}
                className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 hover:cursor-pointer"
              >
                Tải lại
              </button>
            </div>
          ) : listingComments.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">
              Chưa có bình luận nào.
            </div>
          ) : (
            <>
              {listingComments.map((comment) => {
                const commenterId = Number(comment?.userId)
                const isSellerComment =
                  Number.isFinite(commenterId) &&
                  Number.isFinite(sellerUserId) &&
                  commenterId === sellerUserId
                const commenterName = comment?.username || 'Người dùng'
                const avatarUrl = comment?.avatarUrl || ''

                return (
                  <article key={getCommentIdentity(comment)} className="flex gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200 ring-1 ring-slate-300">
                      <span className="flex h-full w-full items-center justify-center text-sm font-black text-slate-700">
                        {getDisplayInitial(commenterName)}
                      </span>
                      {avatarUrl && (
                        <img
                          src={avatarUrl}
                          alt={commenterName}
                          className="absolute inset-0 h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display = 'none'
                          }}
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="max-w-full truncate text-sm font-black text-slate-950">
                          {commenterName}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {fmtDate(comment?.createdAt)}
                        </span>
                        {isSellerComment && (
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-black text-white">
                            Người bán
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800 [overflow-wrap:anywhere]">
                        {comment?.content}
                      </div>
                    </div>
                  </article>
                )
              })}

              {listingCommentsLoading && (
                <div className="flex animate-pulse gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-32 rounded bg-slate-200" />
                    <div className="h-3 w-full rounded bg-slate-200" />
                  </div>
                </div>
              )}

              {listingCommentsError && listingComments.length > 0 && (
                <div className="rounded-xl bg-slate-50 p-4 text-center">
                  <div className="text-xs font-semibold text-slate-500">{listingCommentsError}</div>
                  <button
                    type="button"
                    onClick={() => loadListingComments(listingCommentsPage + 1)}
                    className="mt-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700 hover:cursor-pointer"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {listingCommentsHasMore && !listingCommentsLoading && !listingCommentsError && (
                <div ref={listingCommentsSentinelRef} className="h-8" aria-hidden="true" />
              )}

              {!listingCommentsHasMore && listingComments.length > 0 && (
                <div className="py-2 text-center text-xs font-semibold text-slate-400">
                  Đã hết bình luận.
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {selectedEndedAuction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-sm"
          onClick={closeEndedAuctionModal}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-300 md:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chi tiết phiên đấu giá</div>
                <div className="mt-1 text-xl font-black text-slate-900">Phiên #{selectedEndedAuction.auctionId}</div>
              </div>
              <button
                onClick={closeEndedAuctionModal}
                className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-300">Bắt đầu: <b>{fmtDate(selectedEndedAuction.startTime)}</b></div>
              <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-300">Kết thúc: <b>{fmtDate(selectedEndedAuction.endTime)}</b></div>
              <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-300">Giá khởi điểm: <b>{fmtCurrency(selectedEndedAuction.startingPrice)}</b></div>
              <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-300">Giá cao nhất: <b>{fmtCurrency(selectedEndedAuction.currentHighestBid ?? selectedEndedBids[0]?.bidAmount ?? selectedEndedAuction.startingPrice)}</b></div>
            </div>

            {endedAuctionLoading && (
              <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                Đang tải kết quả phiên...
              </div>
            )}

            {selectedEndedResult && (
              <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-slate-200 ">
                <div className="text-xs text-slate-600">Kết quả phiên</div>
                <div className="mt-1 text-sm font-bold text-slate-900">
                  {formatAuctionResultLabel(selectedEndedResult.auctionResultStatus)}
                </div>
                {String(selectedEndedResult.auctionResultStatus || '').toUpperCase() === 'SOLD' &&
                  ['WAIT_FOR_PAYMENT', 'SOLD'].includes(String(listing?.status || '').toUpperCase()) && (
                    <div className="mt-1 text-xs text-slate-500">
                      Trạng thái bài đăng: <b>{listingStatusMeta.label}</b>
                    </div>
                  )}
                <div className='flex gap-4'>
                  {String(selectedEndedResult.auctionResultStatus) === 'SOLD' && (
                    <div className="mt-1 text-sm text-emerald-700">
                      Người thắng: <b>{selectedEndedResult.winnerUsername || 'Chưa xác định'}</b>
                    </div>
                    
                  )}
                  {String(selectedEndedResult.auctionResultStatus) === 'SOLD'&& isOwner && (
                      <button
                        onClick={handleContactSeller}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-green-700 hover:cursor-pointer"
                      >
                        <FaComments />
                        Liên hệ
                      </button>
                    )}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-300">
              <div className="mb-2 text-sm font-extrabold uppercase text-slate-800">Lịch sử đặt giá của phiên</div>
              <div className="max-h-72 space-y-2 overflow-auto">
                {selectedEndedBids.length === 0 && (
                  <div className="text-sm text-slate-500">Chưa có lượt đặt giá nào.</div>
                )}
                {selectedEndedBids.map((b, idx) => {
                  const row = normalizeBidItem(b, selectedEndedAuction.auctionId, idx)
                  return (
                      <div key={row.bidId} className={`rounded-lg px-3 py-2 ring-1 ${idx === 0 ? 'bg-yellow-100 ring-yellow-300' : 'bg-white ring-slate-300'}`}>
                      <div className="text-sm font-semibold text-slate-800">{row.username}</div>
                      <div className="mt-0.5 text-lg font-black tracking-tight text-red-700">{fmtCurrency(row.bidAmount)}</div>
                      <div className="text-xs text-slate-500">{fmtDate(row.bidTime)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
