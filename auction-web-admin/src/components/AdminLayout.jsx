import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiChevronDown, FiCreditCard, FiFileText, FiHome, FiLogOut, FiMessageCircle, FiTarget, FiUsers } from 'react-icons/fi'
import { logout } from '../features/auth/authSlice.js'
import { resetDemoData } from '../utils/storage.js'

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/admin'}
      className={({ isActive }) =>
        [
          'block rounded-xl border px-3 py-2.5 transition',
          isActive
            ? 'border-blue-400/50 bg-blue-500/20 text-white'
            : 'border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-blue-400',
        ].join(' ')
      }
    >
      <span className="inline-flex items-center gap-2.5">
        <Icon className="h-4 w-4 opacity-90" />
        <span>{label}</span>
      </span>
    </NavLink>
  )
}

function getInitials(name, email) {
  const raw = String(name || email || 'A').trim()
  if (!raw) return 'A'
  const words = raw.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase()
}

export default function AdminLayout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const [showAdminInfo, setShowAdminInfo] = useState(false)

  const profileLabel = useMemo(
    () => user?.username || user?.email || 'Quản trị viên',
    [user?.email, user?.username],
  )
  const avatarText = useMemo(() => getInitials(user?.username, user?.email), [user?.email, user?.username])

  const onLogout = async () => {
    await dispatch(logout())
    navigate('/admin/login')
  }


  return (
    <div className="grid min-h-screen grid-cols-[260px_1fr]">
      <aside className="border-r border-white/10 bg-white/[0.02] p-4">
        <div className="mb-3 font-extrabold tracking-[0.3px] text-white">
          Trang quản trị
        </div>

        <div className="flex flex-col gap-3">
          <NavItem to="/admin" label="Tổng quan" icon={FiHome} />
          <NavItem to="/admin/users" label="Người dùng" icon={FiUsers} />
          <NavItem to="/admin/listings" label="Bài đăng" icon={FiFileText} />
          <NavItem to="/admin/auctions" label="Phiên đấu giá" icon={FiTarget} />
          <NavItem to="/admin/payments" label="Thanh toán" icon={FiCreditCard} />
          <NavItem to="/admin/contacts" label="Liên hệ khách hàng" icon={FiMessageCircle} />
        </div>

        <div className="my-3 h-px bg-white/10" />

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs text-white/70">Tài khoản quản trị</div>

          <button
            className="admin-profile-trigger mt-2"
            onClick={() => setShowAdminInfo((prev) => !prev)}
            type="button"
          >
            <span className="admin-avatar" aria-hidden>
              {avatarText}
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-sm font-semibold text-white">{profileLabel}</span>
              <span className="block truncate text-xs text-white/65">{user?.email || 'admin@localhost'}</span>
            </span>
            <FiChevronDown
              className={[
                'h-4 w-4 text-white/70 transition-transform duration-200',
                showAdminInfo ? 'rotate-180' : 'rotate-0',
              ].join(' ')}
            />
          </button>

          {showAdminInfo && (
            <div className="admin-info-panel mt-3">
              <div className="grid grid-cols-[88px_1fr] gap-y-2 text-xs text-white/75">
                <div>Username</div>
                <div className="font-medium text-white">{user?.username || 'admin'}</div>
                <div>Email</div>
                <div className="font-medium text-white">{user?.email || 'admin@localhost'}</div>
                <div>Vai trò</div>
                <div className="font-medium text-white">{user?.role || 'ADMIN'}</div>
                <div>ID</div>
                <div className="font-medium text-white">{user?.userId ?? '—'}</div>
              </div>

              <div className="admin-button-shell mt-3">
                <button className="admin-btn admin-btn-danger" onClick={onLogout} type="button">
                  <FiLogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-3">
          </div>

        </div>
      </aside>

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
