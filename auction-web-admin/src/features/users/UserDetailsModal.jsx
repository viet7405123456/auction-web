import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Modal from '../../components/Modal.jsx'
import Badge from '../../components/Badge.jsx'
import { formatDate, formatDateTime } from '../../utils/format.js'
import { clearSelectedUser, patchUser, usersSelectors } from './usersSlice.js'

const btnBase =
  'inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60'

const btnDefault = `${btnBase} border-white/15 bg-white/[0.06] hover:bg-white/[0.1]`
const btnSuccess = `${btnBase} border-emerald-400/60 bg-emerald-500/20 hover:bg-emerald-500/30`
const btnDanger = `${btnBase} border-red-400/60 bg-red-500/20 hover:bg-red-500/30`

const inputClass =
  'min-h-[110px] w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-500/70'

function InfoRow({ label, children }) {
  return (
    <>
      <div className="text-white/60">{label}</div>
      <div className="text-white">{children || '—'}</div>
    </>
  )
}

export default function UserDetailsModal() {
  const dispatch = useDispatch()
  const selectedUserId = useSelector((s) => s.users.selectedUserId)
  const user = useSelector((s) =>
    selectedUserId ? usersSelectors.selectById(s, selectedUserId) : null,
  )

  const [note, setNote] = useState('')

  const title = useMemo(() => {
    if (!user) return ''
    return `User #${user.userId} — ${user.username}`
  }, [user])

  const close = () => dispatch(clearSelectedUser())

  if (!user) return null

  const p = user.profile || {}

  const onVerify = () => {
    dispatch(patchUser({ userId: user.userId, patch: { verified: true } }))
  }

  const onUnverify = () => {
    dispatch(patchUser({ userId: user.userId, patch: { verified: false } }))
  }

  const onToggleLock = () => {
    dispatch(
      patchUser({
        userId: user.userId,
        patch: { accountLocked: !user.accountLocked },
      }),
    )
  }

  const onToggleEnabled = () => {
    dispatch(
      patchUser({
        userId: user.userId,
        patch: { enabled: !user.enabled },
      }),
    )
  }

  const onSaveNote = () => {
    dispatch(patchUser({ userId: user.userId, patch: { adminNote: note } }))
    setNote('')
  }

  return (
    <Modal title={title} onClose={close}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {user.verified ? (
            <Badge variant="ok" label="Đã xác thực" />
          ) : (
            <Badge variant="warn" label="Chưa xác thực" />
          )}
          {user.accountLocked ? (
            <Badge variant="bad" label="Đang khóa" />
          ) : (
            <Badge variant="ok" label="Không khóa" />
          )}
          {user.enabled ? (
            <Badge variant="ok" label="Bật" />
          ) : (
            <Badge variant="bad" label="Tắt" />
          )}
          <Badge variant="info" label={String(user.role || 'USER') == 'ADMIN' ? 'Quản trị viên' : 'Người dùng'} />
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={btnSuccess} onClick={onVerify} disabled={user.verified}>
            Xác thực
          </button>
          <button className={btnDefault} onClick={onUnverify} disabled={!user.verified}>
            Bỏ xác thực
          </button>
          <button className={btnDanger} onClick={onToggleLock}>
            {user.accountLocked ? 'Mở khóa' : 'Khóa'}
          </button>
          <button className={btnDefault} onClick={onToggleEnabled}>
            {user.enabled ? 'Tắt' : 'Bật'}
          </button>
        </div>
      </div>

      <div className="my-4 h-px bg-white/10" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 text-base font-semibold text-white">Tài khoản</div>

          <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
            <InfoRow label="Ảnh đại diện">
              {p.avatarUrl ? (
                <img
                  src={p.avatarUrl}
                  alt="avatar"
                  className="h-24 w-24 rounded-xl border border-white/10 object-cover"
                />
              ) : (
                '—'
              )}
            </InfoRow>

            <InfoRow label="User ID">{user.userId}</InfoRow>
            <InfoRow label="Username">{user.username}</InfoRow>
            <InfoRow label="Email">{user.email}</InfoRow>
            <InfoRow label="Role">{String(user.role || 'USER') == 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}</InfoRow>
            <InfoRow label="Created">{formatDateTime(user.createdAt)}</InfoRow>
            <InfoRow label="Updated">{formatDateTime(user.updatedAt)}</InfoRow>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 text-base font-semibold text-white">Hồ sơ</div>

          <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-2 text-sm">
            <InfoRow label="Họ tên">{p.fullname || '—'}</InfoRow>
            <InfoRow label="SĐT">{p.phoneNumber || '—'}</InfoRow>
            <InfoRow label="Giới tính">{p.gender || '—'}</InfoRow>
            <InfoRow label="Ngày sinh">{formatDate(p.dateOfBirth)}</InfoRow>
            <InfoRow label="Địa chỉ">
              <div className="whitespace-pre-wrap">{p.address || '—'}</div>
            </InfoRow>
          </div>
        </div>
      </div>

      <div className="my-4 h-px bg-white/10" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 text-base font-semibold text-white">Ảnh / Giấy tờ</div>

          <div className="space-y-4">
            <div>
              <div className="mb-2 text-sm text-white/70">CCCD (trước)</div>
              <div className="flex flex-col gap-3">
                <a
                  className={btnDefault}
                  href={p.CCCDtruocUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở ảnh CCCD trước
                </a>
                {p.CCCDtruocUrl ? (
                  <img
                    src={p.CCCDtruocUrl}
                    alt="cccd front"
                    className="w-full max-w-[360px] rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="text-sm text-white/55">Không có ảnh.</div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm text-white/70">CCCD (sau)</div>
              <div className="flex flex-col gap-3">
                <a
                  className={btnDefault}
                  href={p.CCCDsauUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở ảnh CCCD sau
                </a>
                {p.CCCDsauUrl ? (
                  <img
                    src={p.CCCDsauUrl}
                    alt="cccd back"
                    className="w-full max-w-[360px] rounded-xl border border-white/10 object-cover"
                  />
                ) : (
                  <div className="text-sm text-white/55">Không có ảnh.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 text-base font-semibold text-white">Ghi chú admin</div>

          <textarea
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú nội bộ cho tài khoản này..."
          />

          <div className="mt-3 flex justify-end">
            <button className={btnSuccess} onClick={onSaveNote} disabled={!note.trim()}>
              Lưu ghi chú
            </button>
          </div>

          {user.adminNote && (
            <>
              <div className="my-4 h-px bg-white/10" />
              <div className="mb-2 text-sm font-medium text-white">Ghi chú hiện tại</div>
              <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
                {user.adminNote}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}