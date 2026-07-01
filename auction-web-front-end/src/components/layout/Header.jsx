import { FiBell, FiChevronDown, FiLogOut, FiMenu, FiMessageCircle, FiUser, FiX } from 'react-icons/fi'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../features/auth/authSlice.js'
import {
  bootstrapAccount,
  fetchNotificationsPage,
  receiveRealtimeNotification,
  readAllNotifications,
  readNotifications,
} from '../../features/account/accountSlice.js'
import { connectWs, disconnectWs, subscribeWs, unregisterWsConnectedCallback } from '../../realtime/wsClient.js'
import { pushToast } from '../../features/ui/uiSlice'
import { getAuctionDetail } from '../../api/auctionsApi.js'
import { buildNotificationNavigationTarget } from '../../utils/notificationNavigation.js'

const BELL_PAGE_SIZE = 5

const cx = (...classes) => classes.filter(Boolean).join(' ')

function ChevronDown(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function Dropdown({ label, items, open, onOpen, onClose }) {
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        className={cx(
          'inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium',
          'text-slate-800 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-200',
        )}
        onClick={() => {
          open ? onClose() : onOpen()
        }}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={cx('h-4 w-4 transition', open && 'rotate-180')} />
      </button>

      <div
        className={cx(
          'absolute left-0 top-full mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg',
          'transition origin-top',
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
        )}
        role="menu"
      >
        <div className="py-2">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                cx(
                  'block px-4 py-2 text-sm',
                  isActive ? 'bg-red-50 text-red-700' : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                )
              }
              role="menuitem"
              onClick={onClose}
            >
              {it.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  )
}

const fmtDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export default function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const rootRef = useRef(null)

  const { isAuthenticated, user: authUser } = useSelector((state) => state.auth)
  const account = useSelector((state) => state.account)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [openKey, setOpenKey] = useState(null)
  const [now, setNow] = useState(() => new Date())
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showBell, setShowBell] = useState(false)
  const [bellPage, setBellPage] = useState(0)

  const handleLogout = async () => {
    disconnectWs()
    await dispatch(logout())
    navigate('/login', { replace: true })
  }


  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setOpenKey(null)
    setMobileOpen(false)
    setShowBell(false)
    setShowAccountMenu(false)
  }, [location.pathname])

  useEffect(() => {
    const onDown = (e) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target)) {
        setOpenKey(null)
        setShowBell(false)
        setShowAccountMenu(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(bootstrapAccount())
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    let notificationSub

    const onWsConnected = () => {
      if (cancelled) return
      notificationSub = subscribeWs('/user/queue/notifications', (event) => {
        dispatch(receiveRealtimeNotification(event))
        dispatch(
          pushToast({
            type: 'info',
            title: event?.title || 'Thông báo mới',
            message: event?.message || '',
            duration: 4200,
          }),
        )
      })
    }

    connectWs(onWsConnected)

    return () => {
      cancelled = true
      unregisterWsConnectedCallback(onWsConnected)
      notificationSub?.unsubscribe?.()
    }
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    if (!showBell || !isAuthenticated) return
    setBellPage(0)
    dispatch(fetchNotificationsPage({ page: 0, size: BELL_PAGE_SIZE }))
  }, [dispatch, isAuthenticated, showBell])

  const timeStr = useMemo(() => now.toLocaleTimeString('vi-VN', { hour12: false }), [now])
  const dateStr = useMemo(
    () =>
      new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(now),
    [now],
  )

  const auctionsMenu = [
    { label: 'Phiên đấu giá sắp diễn ra', to: '/auctions/upcoming' },
    { label: 'Phiên đấu giá đang diễn ra', to: '/auctions/live' },
    { label: 'Phiên đấu giá đã kết thúc', to: '/auctions/ended' },
  ]

  const newsMenu = [
    { label: 'Thông báo', to: '/news/announcements' },
  ]

  const accountMenu = [
    { label: 'Thông tin tài khoản', to: '/account?tab=profile' },
    { label: 'Tổng quan', to: '/account?tab=overview' },
    { label: 'Quản lý bài đăng', to: '/account?tab=listings' },
    { label: 'Chat', to: '/account?tab=chat' },
    { label: 'Thông báo', to: '/account?tab=notifications' },
  ]

  const navLinkClass = ({ isActive }) =>
  `relative font-semibold transition-all duration-300
   ${isActive ? "text-red-600 after:w-full" : "text-gray-700"}
   after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-red-600 after:transition-all after:duration-300
   hover:text-red-600 hover:after:w-full`;

  const unreadNotifications = Number(account?.overview?.unreadNotifications || 0)
  const unreadChats = Number(account?.chats?.unreadCount || account?.overview?.unreadMessages || 0)
  const miniNotifications = account?.notifications?.items || []
  const bellLoading = Boolean(account?.notifications?.isLoading)
  const totalNotificationPages = Number(account?.notifications?.totalPages || 1)
  const canLoadOlderNotifications = bellPage + 1 < totalNotificationPages && !bellLoading
  const greetingName = useMemo(() => {
    const rawName =
      account?.profile?.profile?.fullname ||
      account?.profile?.profile?.fullName ||
      account?.profile?.fullname ||
      account?.profile?.fullName ||
      account?.profile?.name ||
      authUser?.fullName ||
      authUser?.name ||
      authUser?.username ||
      authUser?.email

    if (!rawName) return 'bạn'

    const trimmedName = String(rawName).trim()
    if (!trimmedName) return 'bạn'

    if (trimmedName.includes('@')) {
      return trimmedName.split('@')[0]
    }

    return trimmedName
  }, [account?.profile, authUser])

  const handleLoadOlderNotifications = () => {
    if (!canLoadOlderNotifications) return
    const nextPage = bellPage + 1
    dispatch(fetchNotificationsPage({ page: nextPage, size: BELL_PAGE_SIZE, append: true }))
    setBellPage(nextPage)
  }

  const handleNotificationClick = async (notification) => {
    if (!notification) return

    if (!notification.read) {
      dispatch(readNotifications([notification.id]))
    }

    setShowBell(false)

    const target = await buildNotificationNavigationTarget(notification, {
      auctionsByListingId: account?.listings?.auctionsByListingId,
      getAuctionById: getAuctionDetail,
    })

    if (target?.to) {
      navigate(target.to)
    }
  }

  return (
    <header ref={rootRef} className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="leading-tight">
              <div className="text-xs font-semibold text-slate-700">ĐẤU GIÁ</div>
              <div className="text-sm font-extrabold tracking-wide text-red-700">VIỆT 123</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-4 lg:flex">
            <NavLink to="/listings" className={navLinkClass}>Bài đăng</NavLink>
            <NavLink to="/auctions" className={navLinkClass}>Phiên đấu giá</NavLink>
            <NavLink to="/contact" className={navLinkClass}>Liên hệ</NavLink>
          </nav>

          <div className="flex items-center gap-2">

            <div className="hidden flex-col items-end leading-tight xl:flex">
              <div className="tabular-nums text-lg font-extrabold text-slate-900">{timeStr}</div>
              <div className="text-xs capitalize text-slate-600">{dateStr}</div>
            </div>

            {isAuthenticated ? (
              <div className="hidden items-center gap-2 sm:flex">
                <div className="hidden lg:flex items-center rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
                  Xin chào, {greetingName}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => navigate('/account?tab=chat')}
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:cursor-pointer"
                    title="Tin nhắn"
                  >
                    <FiMessageCircle className="h-5 w-5" />
                    {unreadChats > 0 && (
                      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 py-0.5 text-center text-[10px] font-bold text-white">
                        {unreadChats > 99 ? '99+' : unreadChats}
                      </span>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowBell((v) => !v)}
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:cursor-pointer"
                    title="Thông báo"
                  >
                    <FiBell className="h-5 w-5 hover:border-red-500" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 py-0.5 text-center text-[10px] font-bold text-white">
                        {unreadNotifications > 99 ? '99+' : unreadNotifications}
                      </span>
                    )}
                  </button>

                  {showBell && (
                    <div className="absolute right-0 top-12 z-[70] w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div className="text-sm font-extrabold text-slate-900">Thông báo</div>
                        <button
                          onClick={() => dispatch(readAllNotifications())}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Đánh dấu đã đọc
                        </button>
                      </div>

                      <div className="max-h-80 overflow-auto p-2">
                        {miniNotifications.length === 0 && (
                          <div className="p-3 text-xs text-slate-500">Chưa có thông báo.</div>
                        )}
                        {miniNotifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              void handleNotificationClick(n)
                            }}
                            className={`w-full rounded-xl p-3 text-left ${n.read ? 'hover:bg-slate-50' : 'bg-blue-50'}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-bold text-slate-800">{n.title}</div>
                              {!n.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                            </div>
                            <div className="mt-1 text-xs text-slate-600">{n.message}</div>
                            <div className="mt-1 text-[11px] text-slate-400">{fmtDate(n.createdAt)}</div>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                        <button
                          onClick={handleLoadOlderNotifications}
                          disabled={!canLoadOlderNotifications}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {bellLoading ? 'Đang tải...' : 'Xem các thông báo trước đó'}
                        </button>
                        <Link
                          to="/account?tab=notifications"
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                          onClick={() => setShowBell(false)}
                        >
                          Xem tất cả
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAccountMenu((v) => !v)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:cursor-pointer"
                    title="Menu tài khoản"
                  >
                    <FiUser className="h-5 w-5" />
                  </button>

                  {showAccountMenu && (
                    <div className="absolute right-0 top-12 z-[70] w-60 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                      {accountMenu.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setShowAccountMenu(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {item.label}
                        </Link>
                      ))}
                        <Link
                          to="/login"
                          onClick={handleLogout}
                          className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex gap-2 items-center"
                        >
                          <FiLogOut className="h-4 w-4" />
                          Đăng xuất
                        </Link>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <Link to="/login" className="hidden sm:inline-flex h-10 items-center justify-center rounded-md bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800">
                Đăng nhập
              </Link>
            )}

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label="Mở menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className={cx('lg:hidden', mobileOpen ? 'block' : 'hidden')}>
          <div className="border-t border-slate-200 py-3">
            <div className="mt-2 grid gap-1">
              {isAuthenticated && (
                <div className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                  Xin chào, {greetingName}
                </div>
              )}

              <div className="rounded-lg border border-slate-200">
                <div className="px-3 py-2 text-sm font-semibold text-slate-800">Phiên đấu giá</div>
                <div className="pb-2">
                  {auctionsMenu.map((it) => (
                    <NavLink key={it.to} to={it.to} className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      {it.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              <NavLink to="/about" className="rounded-md px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">Giới thiệu</NavLink>
              <NavLink to="/contact" className="rounded-md px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">Liên hệ</NavLink>
              {isAuthenticated && (
                <NavLink to="/account?tab=overview" className="rounded-md px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">Tài khoản</NavLink>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}