import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../features/auth/authSlice.js'

export default function LoginPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const { status, error, isAuthenticated, user } = useSelector((s) => s.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true })
  }, [isAuthenticated, navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    const action = await dispatch(login({ email, password }))
    if (login.fulfilled.match(action)) {
      const to = location.state?.from || '/admin'
      navigate(to, { replace: true })
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]">
        <div className="text-2xl font-black text-white">Quản trị viên web đấu giá</div>

        <div className="my-4 border-t border-white/10" />

        <form onSubmit={onSubmit}>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-white/60">
            Email
          </div>
          <input
            className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-500/70"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="mb-1.5 mt-3 text-xs font-medium uppercase tracking-wide text-white/60">
            Mật khẩu
          </div>
          <input
            className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-500/70"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="mt-3 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              className="inline-flex items-center justify-center rounded-xl border border-blue-400/60 bg-blue-500/25 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500/35 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
