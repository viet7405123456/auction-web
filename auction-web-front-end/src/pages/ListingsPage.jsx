import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FaMapMarkerAlt, FaCar, FaRegHeart, FaHeart, FaRegCommentDots, FaComments } from 'react-icons/fa'
import debounce from 'lodash.debounce'
import {
  createListingComment,
  getListingComments,
  getListingEngagement,
  getListings,
  toggleListingReaction,
} from '../api/listingsApi'
import { startDirectConversation } from '../features/account/accountSlice'

const statusConfig = {
  APPROVED: 'bg-emerald-100 text-emerald-700',
  WAIT_FOR_PAYMENT: 'bg-emerald-100 text-emerald-700',
  SOLD: 'bg-amber-100 text-amber-700',
  SUBMITTED: 'bg-slate-100 text-slate-700',
  REJECTED: 'bg-rose-100 text-rose-700',
}

const statusLabel = {
  SUBMITTED: 'Đang chờ duyệt',
  APPROVED: 'Đã được kiểm duyệt',
  WAIT_FOR_PAYMENT: 'Đã được kiểm duyệt',
  SOLD: 'Đã bán thành công',
  REJECTED: 'Bị từ chối',
}

const fmtDate = (value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export default function ListingsPage() {
  const SEARCH_DEBOUNCE_MS = 450

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useSelector((s) => s.auth?.isAuthenticated)
  const authUser = useSelector((s) => s.auth?.user)

  const [draftFilters, setDraftFilters] = useState({
    title: '',
    brand: '',
    addressSell: '',
  })
  const [filters, setFilters] = useState(draftFilters)
  const [page, setPage] = useState(0)
  const [data, setData] = useState({ content: [], totalPages: 1, number: 0 })
  const [engagementByListingId, setEngagementByListingId] = useState({})
  const [commentsByListingId, setCommentsByListingId] = useState({})
  const [expandedCommentsByListingId, setExpandedCommentsByListingId] = useState({})
  const [commentDraftByListingId, setCommentDraftByListingId] = useState({})
  const [loadingCommentByListingId, setLoadingCommentByListingId] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const debouncedApplyFilters = useMemo(
    () =>
      debounce((nextFilters) => {
        setPage(0)
        setFilters(nextFilters)
      }, SEARCH_DEBOUNCE_MS),
    [],
  )

  useEffect(() => {
    debouncedApplyFilters(draftFilters)
    return () => debouncedApplyFilters.cancel()
  }, [draftFilters, debouncedApplyFilters])

  useEffect(() => {
    return () => debouncedApplyFilters.cancel()
  }, [debouncedApplyFilters])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getListings({ ...filters, page, size: 9 })
        setData(res || { content: [], totalPages: 1, number: 0 })
      } catch (e) {
        console.error('Load listings failed:', e)
        setError(e?.response?.data?.message || e?.message || 'Không tải được dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filters, page])

  useEffect(() => {
    const listings = data.content || []
    if (!listings.length) return

    const loadEngagement = async () => {
      try {
        const entries = await Promise.all(
          listings.map(async (item) => [item.id, await getListingEngagement(item.id)]),
        )
        setEngagementByListingId((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      } catch (e) {
        console.error('Load listing engagement failed:', e)
      }
    }

    loadEngagement()
  }, [data.content])

  const handleToggleLike = async (listingId) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      const summary = await toggleListingReaction(listingId)
      setEngagementByListingId((prev) => ({ ...prev, [listingId]: summary }))
    } catch (e) {
      console.error('Toggle like failed:', e)
    }
  }

  const handleToggleComments = async (listingId) => {
    const next = !expandedCommentsByListingId[listingId]
    setExpandedCommentsByListingId((prev) => ({ ...prev, [listingId]: next }))

    if (!next || commentsByListingId[listingId]) return
    setLoadingCommentByListingId((prev) => ({ ...prev, [listingId]: true }))
    try {
      const comments = await getListingComments(listingId)
      setCommentsByListingId((prev) => ({ ...prev, [listingId]: comments || [] }))
    } catch (e) {
      console.error('Load comments failed:', e)
      setCommentsByListingId((prev) => ({ ...prev, [listingId]: [] }))
    } finally {
      setLoadingCommentByListingId((prev) => ({ ...prev, [listingId]: false }))
    }
  }

  const handleSubmitComment = async (listingId) => {
    const draft = (commentDraftByListingId[listingId] || '').trim()
    if (!draft) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      const newComment = await createListingComment(listingId, { content: draft })
      setCommentsByListingId((prev) => ({
        ...prev,
        [listingId]: [newComment, ...(prev[listingId] || [])],
      }))
      setCommentDraftByListingId((prev) => ({ ...prev, [listingId]: '' }))
      const latestSummary = await getListingEngagement(listingId)
      setEngagementByListingId((prev) => ({ ...prev, [listingId]: latestSummary }))
      setExpandedCommentsByListingId((prev) => ({ ...prev, [listingId]: true }))
    } catch (e) {
      console.error('Create comment failed:', e)
    }
  }

  const handleContactSeller = async (sellerId) => {
    if (!sellerId) return

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    try {
      await dispatch(startDirectConversation({ targetUserId: sellerId })).unwrap()
      navigate('/account?tab=chat')
    } catch (e) {
      console.error('Start conversation failed:', e)
    }
  }

  return (
    <div className="space-y-6 rounded-3xl bg-slate-200/80 p-4 py-6 md:p-6">
      <section className="rounded-3xl bg-gradient-to-r from-red-800 via-orange-700 to-amber-600 p-6 text-white shadow-xl shadow-[0_14px_0_rgba(15,23,42,0.18)] ring-1 ring-slate-900/10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Bảng tin bài đăng xe đấu giá</h1>
            <p className="mt-1 text-sm text-orange-50">Nơi bạn tìm thấy những cơ hội đấu giá tuyệt vời nhất!</p>
          </div>
          <Link
            to="/account?tab=listings"
            className="inline-flex items-center rounded-xl bg-white/95 px-4 py-2 text-sm font-extrabold text-red-700 shadow-sm transition hover:bg-white"
          >
            Tạo bài đăng đấu giá xe
          </Link>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-300 shadow-lg shadow-[0_10px_0_rgba(15,23,42,0.16)]">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={draftFilters.title}
            onChange={(e) => {
              setDraftFilters((p) => ({ ...p, title: e.target.value }))
            }}
            placeholder="Tìm theo tiêu đề"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:border-red-400 focus:bg-white focus:outline-none"
          />
          <input
            value={draftFilters.brand}
            onChange={(e) => {
              setDraftFilters((p) => ({ ...p, brand: e.target.value }))
            }}
            placeholder="Hãng xe"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:border-red-400 focus:bg-white focus:outline-none"
          />
          <input
            value={draftFilters.addressSell}
            onChange={(e) => {
              setDraftFilters((p) => ({ ...p, addressSell: e.target.value }))
            }}
            placeholder="Địa điểm bán"
            className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:border-red-400 focus:bg-white focus:outline-none"
          />
        </div>
      </section>

      {loading ? (
        <div className="py-16 text-center text-slate-500">Đang tải danh sách...</div>
      ) : error ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
          Lỗi tải dữ liệu: {error}
        </div>
      ) : (
        <section className="mx-auto grid max-w-3xl gap-5">
          {(data.content || []).map((item) => (
            <article key={item.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-300 shadow-lg shadow-[0_10px_0_rgba(15,23,42,0.14)] transition  hover:shadow-xl hover:shadow-[0_14px_0_rgba(15,23,42,0.2)]">
              {(() => {
                const sellerId = Number(item?.seller?.userId || item?.seller?.id)
                const currentUserId = Number(authUser?.userId || authUser?.id)
                const isOwner = Number.isFinite(sellerId) && Number.isFinite(currentUserId) && sellerId === currentUserId

                return (
                  <>
                <div className="flex items-center justify-between bg-slate-50/80 px-4 py-3">
                <div className="flex items-center gap-3">
                  {item?.seller?.profile?.avatarUrl ? (
                    <img
                      src={item.seller.profile.avatarUrl}
                      alt="seller"
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-black text-slate-700">
                      {(item?.seller?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-extrabold text-slate-900">{item?.seller?.username || 'Người bán'}</div>
                    <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <FaMapMarkerAlt />
                      {item.addressSell || 'Chưa cập nhật vị trí bán'}
                    </div>
                  </div>
                </div>

                <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${statusConfig[item.status] || 'bg-slate-100 text-slate-700'}`}>
                  {statusLabel[String(item.status || '').toUpperCase()] || String(item.status || 'Không xác định')}
                </span>
              </div>

              <img
                src={item.thumbnailUrl || item?.car?.thumbnailUrl || 'https://placehold.co/800x500/e2e8f0/64748b?text=No+Image'}
                alt={item.title}
                className="h-72 w-full object-cover"
              />

                <div className="space-y-3 px-4 py-4">
                <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                <p className="line-clamp-3 text-sm text-slate-700">{item.description || 'Chưa có mô tả.'}</p>


                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <FaCar />
                    {item?.car?.brand || '—'} {item?.car?.model || ''}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isOwner && (
                      <button
                        onClick={() => handleContactSeller(item?.seller?.userId || item?.seller?.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-blue-700 hover:cursor-pointer"
                      >
                        <FaComments />
                        Liên hệ
                      </button>
                    )}
                    <Link
                      to={`/listings/${item.id}`}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </div>

                <div className="space-y-2 border-y border-slate-100 py-2">
                  <div className="flex items-center justify-between px-1 text-xs font-semibold text-slate-500">
                    <span>{engagementByListingId[item.id]?.likeCount || 0} lượt thích</span>
                    <span>{engagementByListingId[item.id]?.commentCount || 0} bình luận</span>
                  </div>

                  <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <button
                      onClick={() => handleToggleLike(item.id)}
                      className={`inline-flex items-center justify-center gap-2 py-2 text-sm font-bold transition hover:cursor-pointer ${
                        engagementByListingId[item.id]?.likedByCurrentUser
                          ? 'bg-rose-50 text-rose-600'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {engagementByListingId[item.id]?.likedByCurrentUser ? <FaHeart /> : <FaRegHeart />}
                      <span>Thích</span>
                    </button>

                    <button
                      onClick={() => handleToggleComments(item.id)}
                      className="inline-flex items-center justify-center gap-2 border-l border-slate-200 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:cursor-pointer"
                    >
                      <FaRegCommentDots />
                      <span>Bình luận</span>
                    </button>
                  </div>
                </div>

                {expandedCommentsByListingId[item.id] && (
                  <div className="space-y-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-600">Bình luận</div>

                    <div className="max-h-40 space-y-2 overflow-auto">
                      {loadingCommentByListingId[item.id] ? (
                        <div className="text-xs text-slate-500">Đang tải bình luận...</div>
                      ) : (commentsByListingId[item.id] || []).length === 0 ? (
                        <div className="text-xs text-slate-500">Chưa có bình luận nào.</div>
                      ) : (
                        (commentsByListingId[item.id] || []).map((c) => (
                          <div key={c.id} className="rounded-lg bg-white p-2 ring-1 ring-slate-200">
                            <div className="text-xs font-bold text-slate-800">{c.username || 'Người dùng'}</div>
                            <div className="mt-0.5 text-sm text-slate-700">{c.content}</div>
                            <div className="mt-1 text-[11px] text-slate-500">{fmtDate(c.createdAt)}</div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        value={commentDraftByListingId[item.id] || ''}
                        onChange={(e) =>
                          setCommentDraftByListingId((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder="Viết bình luận..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => handleSubmitComment(item.id)}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700 hover:cursor-pointer"
                      >
                        Gửi
                      </button>
                    </div>
                  </div>
                )}
              </div>
                  </>
                )
              })()}
            </article>
          ))}
        </section>
      )}

      <section className="flex items-center justify-end gap-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
          disabled={page <= 0}
        >
          Trước
        </button>
        <span className="text-xs text-slate-500">Trang {page + 1} / {Math.max(1, data.totalPages || 1)}</span>
        <button
          onClick={() => setPage((p) => (p + 1 < (data.totalPages || 1) ? p + 1 : p))}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold"
          disabled={page + 1 >= (data.totalPages || 1)}
        >
          Sau
        </button>
      </section>
    </div>
  )
}
