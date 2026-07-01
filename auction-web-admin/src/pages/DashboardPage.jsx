import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Badge from '../components/Badge.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { fetchUsers, usersSelectors } from '../features/users/usersSlice.js'
import { fetchListings, listingsSelectors } from '../features/listings/listingsSlice.js'
import { auctionsSelectors, fetchAuctions } from '../features/Auctions/auctionSlice.js'
import { getAdminContacts } from '../api/contactsApi.js'

export default function DashboardPage() {
  const dispatch = useDispatch()
  const [contactsData, setContactsData] = useState([])
  const uStatus = useSelector((s) => s.users.status)
  const lStatus = useSelector((s) => s.listings.status)
  const aStatus = useSelector((s) => s.auctions.status)

  useEffect(() => {
    if (uStatus === 'idle') dispatch(fetchUsers())
  }, [dispatch, uStatus])

  useEffect(() => {
    if (lStatus === 'idle') dispatch(fetchListings())
  }, [dispatch, lStatus])

  useEffect(() => {
    if (aStatus === 'idle') dispatch(fetchAuctions())
  }, [dispatch, aStatus])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await getAdminContacts({ page: 0, size: 999 })
        setContactsData(Array.isArray(res?.content) ? res.content : [])
      } catch (err) {
        console.error('Lỗi khi tải liên hệ:', err)
      }
    })()
  }, [])

  const users = useSelector(usersSelectors.selectAll)
  const listings = useSelector(listingsSelectors.selectAll)
  const auctions = useSelector(auctionsSelectors.selectAll)

  const stats = useMemo(() => {
    const totalUsers = users.length
    const unverifiedUsers = users.filter((u) => !u.isVerified).length
    const lockedUsers = users.filter((u) => u.accountLocked).length

    const totalListings = listings.length
    const pendingListings = listings.filter((l) => String(l.status) === 'SUBMITTED').length
    const approvedListings = listings.filter((l) => String(l.status) === 'APPROVED').length
    const rejectedListings = listings.filter((l) => String(l.status) === 'REJECTED').length

    const totalAuctions = auctions.length
    const scheduledAuctions = auctions.filter((a) => String(a.status) === 'SCHEDULED').length
    const liveAuctions = auctions.filter((a) => String(a.status) === 'LIVE').length
    const endedAuctions = auctions.filter((a) => String(a.status) === 'ENDED').length
    const cancelledAuctions = auctions.filter((a) => String(a.status) === 'CANCELLED').length

    const totalContacts = contactsData.length

    return {
      totalUsers,
      unverifiedUsers,
      lockedUsers,
      totalListings,
      pendingListings,
      approvedListings,
      rejectedListings,
      totalAuctions,
      scheduledAuctions,
      liveAuctions,
      endedAuctions,
      cancelledAuctions,
      totalContacts,
    }
  }, [users, listings, auctions, contactsData])

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader title="Bảng điều khiển" subtitle="" />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-white/55">Người dùng</div>
            <div className="mt-1 text-3xl font-black text-white">{stats.totalUsers}</div>
            <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="warn" label={`Chưa xác thực: ${stats.unverifiedUsers}`} />
            <Badge variant="bad" label={`Đang khóa: ${stats.lockedUsers}`} />
            </div>
            <div className="my-4 border-t border-white/10" />
            <Link
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
              to="/admin/users"
            >
              Danh sách người dùng
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-white/55">Danh sách</div>
            <div className="mt-1 text-3xl font-black text-white">{stats.totalListings}</div>
            <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="warn" label={`Đã gửi: ${stats.pendingListings}`} />
            <Badge variant="ok" label={`Đã duyệt: ${stats.approvedListings}`} />
            <Badge variant="bad" label={`Từ chối: ${stats.rejectedListings}`} />
            </div>
            <div className="my-4 border-t border-white/10" />
            <Link
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
              to="/admin/listings"
            >
              Danh sách bài đăng
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-white/55">Đấu giá</div>
            <div className="mt-1 text-3xl font-black text-white">{stats.totalAuctions}</div>
            <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="warn" label={`Sắp diễn ra: ${stats.scheduledAuctions}`} />
            <Badge variant="ok" label={`Đang diễn ra: ${stats.liveAuctions}`} />
            <Badge variant="info" label={`Đã kết thúc: ${stats.endedAuctions}`} />
            <Badge variant="bad" label={`Đã hủy: ${stats.cancelledAuctions}`} />
            </div>
            <div className="my-4 border-t border-white/10" />
            <Link
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
              to="/admin/auctions"
            >
              Danh sách phiên đấu giá
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-sm">
            <div className="text-xs font-medium uppercase tracking-wide text-white/55">Liên hệ</div>
            <div className="mt-1 text-3xl font-black text-white">{stats.totalContacts}</div>
            <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="ok" label="Tin nhắn từ khách" />
            </div>
            <div className="my-4 border-t border-white/10" />
            <Link
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
              to="/admin/contacts"
            >
              Xem tất cả liên hệ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
