import { useEffect, useMemo, useRef, useState } from 'react'
import { FaCamera, FaSpinner } from 'react-icons/fa'
import { FiEye, FiEyeOff } from 'react-icons/fi'

import { fmtDate } from './formatters'
import { api as uploadApi } from '../../api/uploadApi'

export default function ProfileTab({ profile, authUser, onUpdateAvatar, onChangePassword }) {
  const fileInputRef = useRef(null)
  const [avatarUrl, setAvatarUrl] = useState(profile?.profile?.avatarUrl || '')
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  useEffect(() => {
    setAvatarUrl(profile?.profile?.avatarUrl || '')
  }, [profile?.profile?.avatarUrl])

  const isEnabled = Boolean(profile?.enabled)
  const isVerified = Boolean(profile?.isVerified)
  const isLocked = Boolean(profile?.accountLocked)

  const profileCreatedAt = profile?.createdAt || profile?.profile?.createdAt
  const profileUpdatedAt = profile?.updatedAt || profile?.profile?.updatedAt
  const username = profile?.username || '—'
  const email = profile?.email || authUser?.email || '—'
  const fullName = profile?.profile?.fullname || ''

  const avatarFallback = useMemo(
    () => (fullName || profile?.username || email || 'U').trim().charAt(0).toUpperCase(),
    [fullName, profile?.username, email],
  )

  const handleAvatarClick = () => {
    if (isUploadingAvatar) return
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setAvatarError('')

    if (!file.type?.startsWith('image/')) {
      setAvatarError('Vui lòng chọn file ảnh.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setAvatarError('Ảnh đại diện phải nhỏ hơn 10MB.')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await uploadApi.post('/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const uploadedUrl =
        typeof uploadResponse.data === 'string'
          ? uploadResponse.data
          : uploadResponse?.data?.secure_url || uploadResponse?.data?.url

      if (!uploadedUrl) {
        throw new Error('Server không trả về URL ảnh.')
      }

      if (onUpdateAvatar) {
        await onUpdateAvatar(uploadedUrl)
      }
      setAvatarUrl(uploadedUrl)
    } catch (error) {
      setAvatarError(
        error?.response?.data?.message ||
          (typeof error?.response?.data === 'string' ? error.response.data : null) ||
          error?.message ||
          'Không thể cập nhật ảnh đại diện.',
      )
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleChangePassword = async (event) => {
    event.preventDefault()
    if (!onChangePassword || isChangingPassword) return

    setPasswordError('')
    setPasswordSuccess('')

    if (!currentPassword) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.')
      return
    }

    if (!newPassword) {
      setPasswordError('Vui lòng nhập mật khẩu mới.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự.')
      return
    }

    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu hiện tại.')
      return
    }

    if (confirmPassword !== newPassword) {
      setPasswordError('Mật khẩu nhập lại không khớp.')
      return
    }

    setIsChangingPassword(true)
    try {
      await onChangePassword({ currentPassword, newPassword, confirmPassword })
      setPasswordSuccess('Đổi mật khẩu thành công.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        error?.message ||
        'Đổi mật khẩu thất bại.'
      setPasswordError(message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const formatDateOnly = (value) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d)
  }

  return (
    <section className="space-y-5 rounded-2xl bg-white p-5 ring-1 ring-slate-300 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-extrabold text-slate-900">Hồ sơ tài khoản</h2>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white p-5 ring-1 ring-slate-300">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Thông tin người dùng</div>

          <div className="mt-4 flex flex-col items-center">
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              title="Đổi ảnh đại diện"
              className="group relative h-28 w-28 overflow-hidden rounded-full bg-slate-200 ring-4 ring-white shadow-sm transition hover:ring-red-100 disabled:cursor-not-allowed"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3xl font-black text-slate-700">
                  {avatarFallback}
                </span>
              )}

              <span className="absolute inset-0 grid place-items-center bg-slate-950/0 text-white transition group-hover:bg-slate-950/45">
                {isUploadingAvatar ? (
                  <FaSpinner className="animate-spin text-xl opacity-100" />
                ) : (
                  <FaCamera className="text-xl opacity-0 transition group-hover:opacity-100" />
                )}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {avatarError && (
              <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                {avatarError}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Họ và tên</div>
              <div className="mt-1 text-sm font-black text-slate-900">{fullName || '—'}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Số điện thoại</div>
              <div className="mt-1 text-sm font-black text-slate-900">{profile?.profile?.phoneNumber || '—'}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Giới tính</div>
              <div className="mt-1 text-sm font-black text-slate-900">{profile?.profile?.gender === "MALE" ? 'Nam' : profile?.profile?.gender === "FEMALE" ? 'Nữ' : '—'}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ngày sinh</div>
              <div className="mt-1 text-sm font-black text-slate-900">{formatDateOnly(profile?.profile?.dateOfBirth)}</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-300">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Địa chỉ</div>
              <div className="mt-1 text-sm font-black text-slate-900">{profile?.profile?.address || '—'}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-b from-white to-slate-50 p-5 ring-1 ring-slate-300">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Thông tin tài khoản</div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-white p-4 ring-1 ring-slate-300">
              <div className="text-xs font-semibold text-slate-500">Username</div>
              <div className="mt-1 text-base font-black text-slate-900">{username}</div>
            </div>
            <div className="rounded-lg bg-white p-4 ring-1 ring-slate-300">
              <div className="text-xs font-semibold text-slate-500">Email</div>
              <div className="mt-1 break-all text-base font-black text-slate-900">{email}</div>
            </div>
            <div className="rounded-lg bg-white p-4 ring-1 ring-slate-300">
              <div className="text-xs font-semibold text-slate-500">Vai trò</div>
              <div className="mt-1 text-base font-black text-slate-900">{profile?.role === 'ADMIN' ? 'Quản trị viên' : profile?.role === 'USER' ? 'Người dùng' : authUser?.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}</div>
            </div>
            <div className="rounded-lg bg-white p-4 ring-1 ring-slate-300">
              <div className="text-xs font-semibold text-slate-500">Ngày tạo tài khoản</div>
              <div className="mt-1 text-base font-black text-slate-900">{fmtDate(profileCreatedAt)}</div>
            </div>
            <div className="rounded-lg bg-white p-4 ring-1 ring-slate-300">
              <div className="text-xs font-semibold text-slate-500">Cập nhật gần nhất</div>
              <div className="mt-1 text-base font-black text-slate-900">{fmtDate(profileUpdatedAt)}</div>
            </div>
            <div className="rounded-lg bg-white p-4 ring-1 ring-slate-300">
              <div className="text-xs font-semibold text-slate-500">Trạng thái kích hoạt</div>
              <div
                className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-extrabold ${isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
              >
                {isEnabled ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 ring-1 ring-slate-300">
              <div className="text-xs font-semibold text-slate-500">Xác minh</div>
              <div
                className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-extrabold ${isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
              >
                {isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
              </div>
            </div>
            <div className="rounded-lg bg-white p-4 ring-1 ring-slate-300">
              <div className="text-xs font-semibold text-slate-500">Khóa tài khoản</div>
              <div
                className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-extrabold ${isLocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}
              >
                {isLocked ? 'Đang bị khóa' : 'Bình thường'}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 ring-1 ring-slate-300">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Đổi mật khẩu</div>

            <form className="mt-4 space-y-4" onSubmit={handleChangePassword}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Mật khẩu hiện tại</label>
                  <div className="relative mt-2">
                    <input
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      type={showCurrentPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu hiện tại"
                      disabled={isChangingPassword}
                      className="w-full rounded-md border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50"
                      aria-label={showCurrentPassword ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
                    >
                      {showCurrentPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Mật khẩu mới</label>
                  <div className="relative mt-2">
                    <input
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      type={showNewPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Nhập mật khẩu mới"
                      disabled={isChangingPassword}
                      className="w-full rounded-md border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50"
                      aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                    >
                      {showNewPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-800">Nhập lại mật khẩu</label>
                  <div className="relative mt-2">
                    <input
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu mới"
                      disabled={isChangingPassword}
                      className="w-full rounded-md border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50"
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu nhập lại' : 'Hiện mật khẩu nhập lại'}
                    >
                      {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

              </div>

              {passwordError && (
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {passwordSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isChangingPassword}
                className={`h-11 rounded-md px-5 text-xs font-extrabold uppercase tracking-wide transition ${
                  isChangingPassword
                    ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isChangingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </div>
        </div>
      </div>

    </section>
  )
}
