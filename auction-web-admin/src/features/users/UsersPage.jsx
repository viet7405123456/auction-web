import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiCheckCircle, FiChevronDown, FiLock, FiRefreshCw, FiSearch, FiSettings, FiShield, FiUsers, FiZap } from 'react-icons/fi'
import { formatDateTime } from '../../utils/format.js'
import Badge from '../../components/Badge.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import {
  fetchUsers,
  patchUser,
  selectFilteredUsers,
  selectUser,
  setUsersFilters,
  setUsersPage,
  setUsersPageSize,
} from './usersSlice.js'
import UserDetailsModal from './UserDetailsModal.jsx'

function uniqueRoles(users) {
  const set = new Set()
  users.forEach((u) => set.add(String(u.role)))
  return Array.from(set)
}

const btnBase =
  'inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60'

const btnDefault = `${btnBase} border-white/15 bg-white/[0.06] hover:bg-white/[0.1]`
const btnPrimary = `${btnBase} border-blue-400/60 bg-blue-500/20 hover:bg-blue-500/30`
const btnSuccess = `${btnBase} border-emerald-400/60 bg-emerald-500/20 hover:bg-emerald-500/30`
const btnDanger = `${btnBase} border-red-400/60 bg-red-500/20 hover:bg-red-500/30`

const inputClass =
  'w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-500/70'

const selectClass = `${inputClass} admin-select appearance-none pr-11`

function FilterLabel({ icon: Icon, text }) {
  return (
    <div className="mb-2 inline-flex items-center gap-1.5 text-xs text-white/65">
      <Icon className="h-3.5 w-3.5" />
      <span>{text}</span>
    </div>
  )
}

function SelectShell({ children }) {
  return (
    <div className="admin-select-wrap">
      {children}
      <FiChevronDown className="admin-select-chevron" />
    </div>
  )
}

export default function UsersPage() {
  const dispatch = useDispatch()
  const status = useSelector((s) => s.users.status)
  const error = useSelector((s) => s.users.error)
  const filters = useSelector((s) => s.users.filters)
  const pagination = useSelector((s) => s.users.pagination)
  const users = useSelector(selectFilteredUsers)

  useEffect(() => {
    dispatch(fetchUsers({ page: pagination.page, size: pagination.size }))
  }, [dispatch, pagination.page, pagination.size])

  const roles = useMemo(() => uniqueRoles(users), [users])

  const onQuickToggleVerify = (u) => {
    dispatch(patchUser({ userId: u.userId, patch: { verified: !u.verified } }))
  }

  const onQuickToggleLock = (u) => {
    dispatch(patchUser({ userId: u.userId, patch: { accountLocked: !u.accountLocked } }))
  }

  const onQuickToggleEnabled = (u) => {
    dispatch(patchUser({ userId: u.userId, patch: { enabled: !u.enabled } }))
  }

  const goToPage = (page) => {
    if (page < 0 || page >= pagination.totalPages) return
    dispatch(setUsersPage(page))
  }

  const pages = Array.from({ length: pagination.totalPages }, (_, i) => i)

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Quản lý người dùng"
          subtitle="Xác thực người dùng, khóa/mở khóa, bật/tắt tài khoản"
          right={
            <div className="flex flex-wrap gap-3">
              <button
                className={`${btnDefault} admin-btn`}
                onClick={() => dispatch(fetchUsers({ page: pagination.page, size: pagination.size }))}
                disabled={status === 'loading'}
              >
                <FiRefreshCw className="h-4 w-4" />
                Làm mới
              </button>
            </div>
          }
        />

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,2fr)_180px_180px_180px_180px_120px]">
            <div>
              <FilterLabel icon={FiSearch} text="Tìm kiếm" />
              <input
                className={inputClass}
                value={filters.q}
                onChange={(e) => dispatch(setUsersFilters({ q: e.target.value }))}
                placeholder="Tên hoặc email..."
              />
            </div>

            <div>
              <FilterLabel icon={FiCheckCircle} text="Verified" />
              <SelectShell>
                <select
                  className={selectClass}
                  value={filters.verified}
                  onChange={(e) => dispatch(setUsersFilters({ verified: e.target.value }))}
                >
                  <option value="all">Tất cả</option>
                  <option value="verified">Đã xác thực</option>
                  <option value="unverified">Chưa xác thực</option>
                </select>
              </SelectShell>
            </div>

            <div>
              <FilterLabel icon={FiLock} text="Khóa" />
              <SelectShell>
                <select
                  className={selectClass}
                  value={filters.locked}
                  onChange={(e) => dispatch(setUsersFilters({ locked: e.target.value }))}
                >
                  <option value="all">Tất cả</option>
                  <option value="locked">Đang khóa</option>
                  <option value="unlocked">Không khóa</option>
                </select>
              </SelectShell>
            </div>

            <div>
              <FilterLabel icon={FiZap} text="Kích hoạt" />
              <SelectShell>
                <select
                  className={selectClass}
                  value={filters.enabled}
                  onChange={(e) => dispatch(setUsersFilters({ enabled: e.target.value }))}
                >
                  <option value="all">Tất cả</option>
                  <option value="enabled">Bật</option>
                  <option value="disabled">Tắt</option>
                </select>
              </SelectShell>
            </div>

            <div>
              <FilterLabel icon={FiShield} text="Vai trò" />
              <SelectShell>
                <select
                  className={selectClass}
                  value={filters.role}
                  onChange={(e) => dispatch(setUsersFilters({ role: e.target.value }))}
                >
                  <option value="all">Tất cả</option>
                  <option value="ADMIN">Quản trị viên</option>
                  <option value="USER">Người dùng</option>
                </select>
              </SelectShell>
            </div>

            <div>
              <FilterLabel icon={FiSettings} text="Kích thước trang" />
              <SelectShell>
                <select
                  className={selectClass}
                  value={pagination.size}
                  onChange={(e) => dispatch(setUsersPageSize(Number(e.target.value)))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </SelectShell>
            </div>
          </div>
        </div>

        
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm md:p-5">
          {status === 'loading' && (
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
              Đang tải...
            </div>
          )}

          {status === 'failed' && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Lỗi: {String(error)}
            </div>
          )}

          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full border-collapse text-sm">
                <thead className="bg-white/[0.04]">
                  <tr className="text-white/85">
                    <th className="w-20 px-4 py-3 text-left font-semibold">ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Người dùng</th>
                    <th className="w-[120px] px-4 py-3 text-left font-semibold">Vai trò</th>
                    <th className="w-[140px] px-4 py-3 text-left font-semibold">Xác thực</th>
                    <th className="w-[140px] px-4 py-3 text-left font-semibold">Khóa</th>
                    <th className="w-[140px] px-4 py-3 text-left font-semibold">Kích hoạt</th>
                    <th className="w-[160px] px-4 py-3 text-left font-semibold">Cập nhật</th>
                    <th className="w-[320px] px-4 py-3 text-left font-semibold">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.userId}
                      className="border-t border-white/10 transition hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4 text-white/80">{u.userId}</td>

                      <td className="px-4 py-4">
                        <div className="font-semibold text-white">{u.username}</div>
                        <div className="text-xs text-white/55">{u.email}</div>
                      </td>

                      <td className="px-4 py-4">
                        <Badge variant="info" label={String(u.role) == 'ADMIN' ? 'Quản trị viên' : 'Người dùng'} />
                      </td>

                      <td className="px-4 py-4">
                        {u.verified ? (
                          <Badge variant="ok" label="Đã xác thực" />
                        ) : (
                          <Badge variant="warn" label="Chưa xác thực" />
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {u.accountLocked ? (
                          <Badge variant="bad" label="Đang khóa" />
                        ) : (
                          <Badge variant="ok" label="Không khóa" />
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {u.enabled ? (
                          <Badge variant="ok" label="Bật" />
                        ) : (
                          <Badge variant="bad" label="Tắt" />
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs text-white/65">
                        {formatDateTime(u.updatedAt)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="admin-button-shell">
                          <button
                            className={`${btnDefault} admin-btn`}
                            onClick={() => dispatch(selectUser(u.userId))}
                          >
                            Chi tiết
                          </button>

                          <button
                            className={`${btnSuccess} admin-btn`}
                            onClick={() => onQuickToggleVerify(u)}
                          >
                            {u.verified ? 'Bỏ xác thực' : 'Xác thực'}
                          </button>

                          <button
                            className={`${btnDanger} admin-btn`}
                            onClick={() => onQuickToggleLock(u)}
                          >
                            {u.accountLocked ? 'Mở khóa' : 'Khóa'}
                          </button>

                          <button
                            className={`${btnDefault} admin-btn`}
                            onClick={() => onQuickToggleEnabled(u)}
                          >
                            {u.enabled ? 'Tắt' : 'Bật'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {status !== 'loading' && users.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-sm text-white/55"
                      >
                        Không có dữ liệu phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/65">
              Tổng {pagination.totalElements} người dùng • Trang {pagination.page + 1}/
              {pagination.totalPages || 1}
            </div>

            <div className="admin-button-shell">
              <button
                className={`${btnDefault} admin-btn`}
                onClick={() => goToPage(pagination.page - 1)}
                disabled={pagination.page === 0 || status === 'loading'}
              >
                Trước
              </button>

              {pages.map((p) => (
                <button
                  key={p}
                  className={`${p === pagination.page ? btnPrimary : btnDefault} admin-btn`}
                  onClick={() => goToPage(p)}
                  disabled={status === 'loading'}
                >
                  {p + 1}
                </button>
              ))}

              <button
                className={`${btnDefault} admin-btn`}
                onClick={() => goToPage(pagination.page + 1)}
                disabled={pagination.last || status === 'loading'}
              >
                Sau
              </button>
            </div>
          </div>
        </div>

        <UserDetailsModal />
      </div>
    </div>
  )
}