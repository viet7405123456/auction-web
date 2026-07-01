import { useMemo, useState } from 'react'
import { FaCheckCircle, FaCreditCard, FaHourglassHalf } from 'react-icons/fa'
import { fmtCurrency, fmtDate } from './formatters'

const PAID_STATUSES = new Set(['SUCCESS', 'PAID'])
const EXPIRED_STATUSES = new Set(['EXPIRED', 'CANCELLED'])

function isPaid(payment) {
  const paymentStatus = String(payment?.paymentStatus || '').toUpperCase()
  const orderStatus = String(payment?.orderStatus || '').toUpperCase()
  return PAID_STATUSES.has(paymentStatus) || PAID_STATUSES.has(orderStatus)
}

function isExpired(payment) {
  const orderStatus = String(payment?.orderStatus || '').toUpperCase()
  if (EXPIRED_STATUSES.has(orderStatus)) return true

  const expiresAt = payment?.expiresAt
  if (!expiresAt) return false
  const expiresTs = new Date(expiresAt).getTime()
  if (Number.isNaN(expiresTs)) return false
  return expiresTs <= Date.now()
}

export default function PaymentTab({
  payments = [],
  paymentsPaging,
  onLoadMorePayments,
  onCompletePayment,
}) {
  const [processingPaymentId, setProcessingPaymentId] = useState(null)

  const pendingPayments = useMemo(
    () => payments.filter((payment) => !isPaid(payment)),
    [payments],
  )

  const paidPayments = useMemo(
    () => payments.filter((payment) => isPaid(payment)),
    [payments],
  )

  const hasMore = Number(paymentsPaging?.page || 0) + 1 < Number(paymentsPaging?.totalPages || 1)

  const handleComplete = async (paymentId) => {
    if (!paymentId || processingPaymentId) return
    setProcessingPaymentId(paymentId)
    try {
      await onCompletePayment?.(paymentId)
    } finally {
      setProcessingPaymentId(null)
    }
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Thanh toán sau đấu giá</h3>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
            <FaCreditCard />
            Tổng: {payments.length}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
        <div className="mb-3 inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <FaHourglassHalf className="text-amber-500" />
          Chờ thanh toán ({pendingPayments.length})
        </div>

        {!pendingPayments.length ? (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500 ring-1 ring-slate-200">Không có khoản thanh toán đang chờ.</div>
        ) : (
          <div className="space-y-3">
            {pendingPayments.map((payment) => (
              (() => {
                const expired = isExpired(payment)
                const isProcessing = processingPaymentId === payment.paymentId
                const buttonLabel = expired ? 'Quá hạn' : isProcessing ? 'Đang xử lý...' : 'Thanh toán'

                return (
              <article key={payment.paymentId} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900">{payment.listingTitle || 'Phiên đấu giá'}</div>
                    <div className="text-xs text-slate-500">Mã thanh toán: #{payment.paymentId}</div>
                    <div className="text-xs text-slate-500">Tạo lúc: {fmtDate(payment.createdAt)}</div>
                    {payment.expiresAt && (
                      <div className={`text-xs ${expired ? 'text-rose-600' : 'text-slate-500'}`}>
                        Hạn thanh toán: {fmtDate(payment.expiresAt)}
                      </div>
                    )}
                    <div className="text-xs text-slate-500">Số tiền: <span className="font-bold text-slate-700">{fmtCurrency(payment.amount)}</span></div>
                  </div>

                  <button
                    onClick={() => handleComplete(payment.paymentId)}
                    disabled={expired || isProcessing}
                    className={`rounded-lg px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                      expired
                        ? 'bg-slate-400'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {buttonLabel}
                  </button>
                </div>
              </article>
                )
              })()
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
        <div className="mb-3 inline-flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <FaCheckCircle className="text-emerald-500" />
          Đã thanh toán ({paidPayments.length})
        </div>

        {!paidPayments.length ? (
          <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-500 ring-1 ring-slate-200">Bạn chưa có giao dịch đã thanh toán.</div>
        ) : (
          <div className="space-y-3">
            {paidPayments.map((payment) => (
              <article key={payment.paymentId} className="rounded-xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-900">{payment.listingTitle || 'Phiên đấu giá'}</div>
                    <div className="text-xs text-slate-600">Mã thanh toán: #{payment.paymentId}</div>
                    <div className="text-xs text-slate-600">Đã thanh toán lúc: {fmtDate(payment.paidAt)}</div>
                  </div>
                  <div className="text-sm font-bold text-emerald-700">{fmtCurrency(payment.amount)}</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={onLoadMorePayments}
            disabled={paymentsPaging?.isLoading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paymentsPaging?.isLoading ? 'Đang tải...' : 'Tải thêm payment'}
          </button>
        </div>
      )}
    </section>
  )
}
