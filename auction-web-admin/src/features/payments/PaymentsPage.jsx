import { useEffect, useMemo, useState } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import PageHeader from '../../components/PageHeader.jsx'
import Badge from '../../components/Badge.jsx'
import { formatDateTime } from '../../utils/format.js'
import { getAdminPayments } from '../../api/paymentsApi.js'

const btnBase =
  'inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60'
const btnDefault = `${btnBase} border-white/15 bg-white/[0.06] hover:bg-white/[0.1]`

function toFiniteNumber(value) {
  if (value == null || value === '') return null
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : null
}

function fmtCurrency(value) {
  const numeric = toFiniteNumber(value)
  if (numeric == null) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numeric)
}

function getOrderStatusLabel(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'PENDING_PAYMENT') return 'Chờ thanh toán'
  if (s === 'PAID') return 'Đã thanh toán'
  if (s === 'EXPIRED') return 'Quá hạn'
  if (s === 'CANCELLED') return 'Đã hủy'
  return s || '—'
}

function getPaymentStatusLabel(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'PENDING') return 'Đang chờ'
  if (s === 'SUCCESS') return 'Thành công'
  if (s === 'FAILED') return 'Thất bại'
  return s || '—'
}

function OrderStatusBadge({ status }) {
  const s = String(status || '').toUpperCase()
  if (s === 'PAID') return <Badge variant="ok" label={getOrderStatusLabel(s)} />
  if (s === 'PENDING_PAYMENT') return <Badge variant="warn" label={getOrderStatusLabel(s)} />
  if (s === 'EXPIRED' || s === 'CANCELLED') return <Badge variant="bad" label={getOrderStatusLabel(s)} />
  return <Badge variant="info" label={getOrderStatusLabel(s)} />
}

function PaymentStatusBadge({ status }) {
  const s = String(status || '').toUpperCase()
  if (s === 'SUCCESS') return <Badge variant="ok" label={getPaymentStatusLabel(s)} />
  if (s === 'PENDING') return <Badge variant="warn" label={getPaymentStatusLabel(s)} />
  if (s === 'FAILED') return <Badge variant="bad" label={getPaymentStatusLabel(s)} />
  return <Badge variant="info" label={getPaymentStatusLabel(s)} />
}

export default function PaymentsPage() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [payments, setPayments] = useState([])
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    last: true,
  })

  const doFetch = async (overrides = {}) => {
    setStatus('loading')
    setError(null)
    try {
      const data = await getAdminPayments({
        page: overrides.page ?? pagination.page,
        size: overrides.size ?? pagination.size,
        sortDirection: overrides.sortDirection ?? 'DESC',
      })

      setPayments(Array.isArray(data?.content) ? data.content : [])
      setPagination({
        page: Number(data?.page ?? 0) || 0,
        size: Number(data?.size ?? pagination.size) || pagination.size,
        totalElements: Number(data?.totalElements ?? 0) || 0,
        totalPages: Number(data?.totalPages ?? 0) || 0,
        last: Boolean(data?.last),
      })
      setStatus('succeeded')
    } catch (err) {
      setStatus('failed')
      setError(err?.response?.data?.message || err?.message || String(err))
    }
  }

  useEffect(() => {
    doFetch({ page: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePageChange = (newPage) => {
    doFetch({ page: newPage })
  }

  const { page, totalPages, totalElements, size } = pagination
  const pageStart = totalElements === 0 ? 0 : page * size + 1
  const pageEnd = Math.min((page + 1) * size, totalElements)

  const rows = useMemo(() => (Array.isArray(payments) ? payments : []), [payments])

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Quản lý thanh toán"
          subtitle="Theo dõi các payment phát sinh từ phiên đấu giá"
          right={
            <button
              className={`${btnDefault} admin-btn`}
              onClick={() => doFetch()}
              disabled={status === 'loading'}
              type="button"
            >
              <FiRefreshCw className="h-4 w-4" />
              {status === 'loading' ? 'Đang tải...' : 'Làm mới'}
            </button>
          }
        />

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-sm">
          {status === 'loading' && (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-white/65">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Đang tải dữ liệu...
            </div>
          )}

          {status === 'failed' && (
            <div className="m-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Lỗi tải dữ liệu: {String(error)}
            </div>
          )}

          {status !== 'loading' && (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-white/[0.04] text-white/75">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Bài đăng</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Số tiền</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Đơn hàng</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Thanh toán</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Tạo lúc</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Hạn</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Đã trả</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.06] bg-transparent">
                    {rows.map((p) => (
                      <tr key={p.paymentId ?? `${p.auctionResultId}-${p.createdAt}`} className="align-top transition hover:bg-white/[0.03]">
                        <td className="px-4 py-4 font-mono text-xs text-white/50">#{p.paymentId ?? '—'}</td>

                        <td className="max-w-[340px] px-4 py-4">
                          <div className="leading-snug font-semibold text-white">
                            {p.listingTitle || '—'}
                          </div>
                          <div className="mt-1 text-xs text-white/45">
                            {p.listingId != null ? `Listing #${p.listingId}` : '—'}
                            {p.auctionId != null ? ` · Auction #${p.auctionId}` : ''}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-white">
                          {fmtCurrency(p.amount)}
                        </td>

                        <td className="px-4 py-4">
                          <OrderStatusBadge status={p.orderStatus} />
                        </td>

                        <td className="px-4 py-4">
                          <PaymentStatusBadge status={p.paymentStatus} />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs text-white/60">
                          {formatDateTime(p.createdAt)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs text-white/60">
                          {formatDateTime(p.expiresAt)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs text-white/60">
                          {formatDateTime(p.paidAt)}
                        </td>
                      </tr>
                    ))}

                    {rows.length === 0 && status !== 'failed' && (
                      <tr>
                        <td colSpan={8} className="px-4 py-10 text-center text-sm text-white/50">
                          Chưa có payment nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 0 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:flex-row">
                  <p className="text-xs text-white/50">
                    Hiển thị <span className="font-medium text-white/80">{pageStart}–{pageEnd}</span>{' '}
                    trong <span className="font-medium text-white/80">{totalElements}</span> kết quả
                  </p>

                  <div className="flex items-center gap-1">
                    <button
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => handlePageChange(0)}
                      disabled={page === 0}
                      type="button"
                    >
                      «
                    </button>

                    <button
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                      type="button"
                    >
                      ‹ Trước
                    </button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let p
                      if (totalPages <= 7) {
                        p = i
                      } else if (page < 4) {
                        p = i
                      } else if (page > totalPages - 4) {
                        p = totalPages - 7 + i
                      } else {
                        p = page - 3 + i
                      }

                      return (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                            p === page
                              ? 'border-blue-400/60 bg-blue-500/20 text-white'
                              : 'border-white/10 text-white/70 hover:bg-white/[0.04]'
                          }`}
                          type="button"
                        >
                          {p + 1}
                        </button>
                      )
                    })}

                    <button
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                      type="button"
                    >
                      Sau ›
                    </button>

                    <button
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => handlePageChange(totalPages - 1)}
                      disabled={page >= totalPages - 1}
                      type="button"
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
