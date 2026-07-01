import { useEffect, useMemo, useState } from 'react'
import { FiChevronDown, FiLayers, FiRefreshCw, FiSearch } from 'react-icons/fi'
import PageHeader from '../../components/PageHeader.jsx'
import { getAdminContacts } from '../../api/contactsApi.js'
import { formatDateTime } from '../../utils/format.js'

const selectClass =
  'admin-select w-full appearance-none rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 pr-11 text-sm text-white outline-none transition focus:border-blue-500/70'

function SelectShell({ children }) {
  return (
    <div className="admin-select-wrap">
      {children}
      <FiChevronDown className="admin-select-chevron" />
    </div>
  )
}

export default function ContactsPage() {
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])

  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  const fetchData = async () => {
    setStatus('loading')
    setError(null)
    try {
      const res = await getAdminContacts({ page, size })
      const content = Array.isArray(res?.content) ? res.content : []
      setItems(content)
      setTotalPages(res?.totalPages ?? 1)
      setTotalElements(res?.totalElements ?? content.length)
      setStatus('succeeded')
    } catch (err) {
      setStatus('failed')
      setError(err?.response?.data || err?.message || 'Không tải được liên hệ khách hàng')
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, size])

  const filteredItems = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return items

    return items.filter((item) => {
      const hay = `${item.fullName || ''} ${item.email || ''} ${item.phone || ''} ${item.message || ''}`.toLowerCase()
      return hay.includes(needle)
    })
  }, [items, q])

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Liên hệ từ khách hàng"
          subtitle="Danh sách nội dung khách hàng gửi về hệ thống"
          right={
            <button
              className="admin-btn inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={fetchData}
              disabled={status === 'loading'}
            >
              <FiRefreshCw className="h-4 w-4" />
              Làm mới
            </button>
          }
        />

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_120px] md:items-end">
            <div>
              <div className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
              <FiSearch className="h-4 w-4" />
              Tìm kiếm
              </div>
              <input
                className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-500/70"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, email, số điện thoại, nội dung..."
              />
            </div>

            <div>
              <div className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
              <FiLayers className="h-4 w-4" />
              Số dòng
              </div>
              <SelectShell>
                <select
                  className={selectClass}
                  value={size}
                  onChange={(e) => {
                    setPage(0)
                    setSize(Number(e.target.value))
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </SelectShell>
            </div>
          </div>

          <div className="my-4 border-t border-white/10" />

          {status === 'loading' && <div className="text-sm text-white/65">Đang tải...</div>}
          {status === 'failed' && <div className="text-sm text-red-200">Lỗi: {String(error)}</div>}

          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/[0.04] text-white/70">
                  <tr>
                    <th className="w-20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Mã</th>
                    <th className="w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Họ và tên</th>
                    <th className="w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                    <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Số điện thoại</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Nội dung</th>
                    <th className="w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Thời gian gửi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] bg-transparent text-white/90">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3">{item.id}</td>
                      <td className="px-4 py-3">{item.fullName || '—'}</td>
                      <td className="px-4 py-3">{item.email || '—'}</td>
                      <td className="px-4 py-3">{item.phone || '—'}</td>
                      <td className="whitespace-pre-wrap px-4 py-3">{item.message || '—'}</td>
                      <td className="px-4 py-3 text-xs text-white/65">{formatDateTime(item.createdAt)}</td>
                    </tr>
                  ))}

                  {status !== 'loading' && filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-white/55">
                        Không có liên hệ phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="text-xs text-white/55">Tổng số liên hệ: {totalElements}</div>
            <div className="admin-button-shell">
              <button
                className="admin-btn inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Trang trước
              </button>
              <div className="text-xs text-white/55">
                Trang {totalPages === 0 ? 0 : page + 1}/{Math.max(totalPages, 1)}
              </div>
              <button
                className="admin-btn inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setPage((p) => p + 1)}
                disabled={page + 1 >= Math.max(totalPages, 1)}
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
