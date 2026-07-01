import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaPaperPlane, FaUser } from 'react-icons/fa'
import { submitContactMessage } from '../api/contactApi.js'

export default function ContactPage() {
  const authUser = useSelector((state) => state.auth.user)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  })

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authUser?.email) return
    setFormData((prev) => (prev.email ? prev : { ...prev, email: authUser.email }))
  }, [authUser?.email])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ tên')
      return
    }
    if (!formData.email.trim()) {
      setError('Vui lòng nhập email')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Email không hợp lệ')
      return
    }
    if (!formData.phone.trim()) {
      setError('Vui lòng nhập số điện thoại')
      return
    }
    if (!formData.message.trim()) {
      setError('Vui lòng nhập tin nhắn')
      return
    }

    try {
      setLoading(true)
      await submitContactMessage(formData)

      setSubmitted(true)
      setFormData({ fullName: '', email: '', phone: '', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (err) {
      setError(err?.message || 'Gửi tin nhắn thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Liên hệ với chúng tôi</h1>
          <p className="mt-2 text-lg text-slate-600">
            Có câu hỏi? Chúng tôi sẵn sàng giúp bạn
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contact Info Cards */}
          <div className="space-y-6">
            {/* Address Card */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-200">
              <div className="bg-gradient-to-r from-red-700 to-red-600 p-6 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <FaMapMarkerAlt className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Địa chỉ</h3>
              </div>
              <div className="p-6">
                <p className="text-slate-700">
                  Gia Lương
                  <br />
                  Đông Anh, Hà Nội
                  <br />
                  Việt Nam
                </p>
              </div>
            </div>

            {/* Phone Card */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-200">
              <div className="bg-gradient-to-r from-blue-700 to-blue-600 p-6 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <FaPhone className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Số điện thoại</h3>
              </div>
              <div className="p-6">
                <p className="text-lg font-bold text-slate-900">
                  <a href="tel:+84961859531" className="text-blue-600 hover:underline">
                    +84 96 185 9531
                  </a>
                </p>
                <p className="mt-1 text-sm text-slate-600">Thứ 2 - Thứ 6: 08:00 - 17:00</p>
                <p className="text-sm text-slate-600">Thứ 7 - Chủ nhật: 09:00 - 16:00</p>
              </div>
            </div>

            {/* Email Card */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-200">
              <div className="bg-gradient-to-r from-purple-700 to-purple-600 p-6 text-white">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <FaEnvelope className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-bold">Email</h3>
              </div>
              <div className="p-6">
                <p>
                  <a href="mailto:nguyenviet07042005@gmail.com" className="text-lg font-bold text-purple-600 hover:underline">
                    nguyenviet07042005@gmail.com
                  </a>
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Chúng tôi sẽ phản hồi email của bạn trong vòng 24 giờ
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-200">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
                <h3 className="text-2xl font-bold">Gửi tin nhắn cho chúng tôi</h3>
                <p className="mt-2 text-slate-300">Điền biểu mẫu dưới đây và chúng tôi sẽ liên hệ với bạn sớm nhất</p>
              </div>

              <div className="p-8">
                {submitted && (
                  <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                    <p className="font-semibold text-green-800">✓ Tin nhắn của bạn đã được gửi thành công!</p>
                    <p className="mt-1 text-sm text-green-700">Chúng tôi sẽ liên hệ với bạn sớm nhất.</p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="font-semibold text-red-800">⚠ {error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900">
                      <div className="mb-2 flex items-center gap-2">
                        <FaUser className="h-4 w-4 text-red-600" />
                        Họ và Tên <span className="text-red-600">*</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900">
                      <div className="mb-2 flex items-center gap-2">
                        <FaEnvelope className="h-4 w-4 text-red-600" />
                        Email <span className="text-red-600">*</span>
                      </div>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="example@email.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900">
                      <div className="mb-2 flex items-center gap-2">
                        <FaPhone className="h-4 w-4 text-red-600" />
                        Số điện thoại <span className="text-red-600">*</span>
                      </div>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+84 9 1234 5678"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900">
                      <div className="mb-2 flex items-center gap-2">
                        <FaPaperPlane className="h-4 w-4 text-red-600" />
                        Tin nhắn <span className="text-red-600">*</span>
                      </div>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Mô tả những vấn đề bạn gặp phải hoặc những câu hỏi của bạn..."
                      rows="6"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-600 px-6 py-3 text-base font-bold text-white shadow-lg transition hover:shadow-xl hover:brightness-110 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="h-4 w-4" />
                        Gửi tin nhắn
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section (Optional Enhancement) */}
        <div className="mt-12">
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] ring-1 ring-slate-200">
            <div className="h-96 bg-grey-200 flex items-center justify-center text-slate-500">
              <p className="text-lg">Bản đồ Google Maps sẽ được tích hợp tại đây</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}