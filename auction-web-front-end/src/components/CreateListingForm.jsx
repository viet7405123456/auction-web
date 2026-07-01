import { useState } from 'react'
import { FaTimes, FaImage, FaFileUpload } from 'react-icons/fa'
import { api as uploadApi } from '../api/uploadApi'

const DOCUMENT_TYPES = [
  { value: 'REGISTRATION', label: 'Đăng ký xe' },
  { value: 'INSPECTION', label: 'Đăng kiểm' },
  { value: 'INSURANCE', label: 'Bảo hiểm' },
  { value: 'AUTHORIZATION', label: 'Giấy ủy quyền' },
  { value: 'INVOICE', label: 'Hóa đơn' },
  { value: 'OTHER', label: 'Khác' },
]

const FUEL_TYPES = ['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC', 'PETROL']
const BODY_TYPES = ['SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'PICKUP', 'Limousine', 'Coupe', 'Convertible', 'MPV', 'Crossover']
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC', 'CVT', 'DUAL_CLUTCH']
const FUEL_LABELS = {
  GASOLINE: 'Xăng',
  DIESEL: 'Dầu diesel',
  HYBRID: 'Hybrid',
  ELECTRIC: 'Điện',
  PETROL: 'Xăng',
}

const TRANSMISSION_LABELS = {
  MANUAL: 'Số sàn',
  AUTOMATIC: 'Số tự động',
  CVT: 'Vô cấp CVT',
  DUAL_CLUTCH: 'Ly hợp kép',
}

const BODY_TYPE_LABELS = {
  SEDAN: 'Sedan',
  SUV: 'SUV',
  HATCHBACK: 'Hatchback',
  COUPE: 'Coupe',
  PICKUP: 'Pickup',
  Limousine: 'Limousine',
  Convertible: 'Convertible',
  MPV: 'MPV',
  Crossover: 'Crossover',
}

const SELLING_LOCATIONS = [
  'Hà Nội',
  'TP. Hồ Chí Minh',
  'Hải Phòng',
  'Đà Nẵng',
  'Cần Thơ',
  'Thừa Thiên Huế',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
]

export default function CreateListingForm({ onSubmit, isLoading = false }) {
  const [step, setStep] = useState(1) // 1: basic, 2: car, 3: images, 4: documents
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingDocuments, setUploadingDocuments] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Basic Info
  const [basic, setBasic] = useState({
    title: '',
    description: '',
    addressSell: '',
  })

  // Car Info
    const [car, setCar] = useState({
        name: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        origin: '',
        fuelType: 'GASOLINE',
        horsepower: '',
        mileage: '',
        color: '',
        transmission: 'MANUAL',
        bodyType: 'SEDAN',
        engine: '',
        seats: 4,
        description: '',
    })

  // Images (CarImages)
  const [carImages, setCarImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [thumbnailUrl, setThumbnailUrl] = useState('')

  // Documents
  const [documents, setDocuments] = useState([])

  const handleAddImages = async (files) => {
    if (!files || files.length === 0) return
    setUploadingImages(true)
    try {
      const uploadedUrls = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        try {
          const res = await uploadApi.post('/image', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          const url = typeof res.data === 'string' ? res.data : res?.data?.secure_url
          if (url) {
            uploadedUrls.push({
              imageUrl: url,
              sortOrder: carImages.length + uploadedUrls.length,
            })
            setImagePreviews((prev) => [...prev, { src: url, name: file.name }])
          }
        } catch (err) {
          console.error('Upload failed for', file.name, err)
        }
      }
      setCarImages((prev) => [...prev, ...uploadedUrls])
      if (uploadedUrls.length > 0 && !thumbnailUrl) {
        setThumbnailUrl(uploadedUrls[0].imageUrl)
      }
    } finally {
      setUploadingImages(false)
    }
  }

  const handleRemoveImage = (index) => {
    const nextImages = carImages.filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, sortOrder: i }))
    const nextPreviews = imagePreviews.filter((_, i) => i !== index)

    setCarImages(nextImages)
    setImagePreviews(nextPreviews)
    if (!nextImages.length) {
      setThumbnailUrl('')
      return
    }
    if (imagePreviews[index]?.src === thumbnailUrl) {
      setThumbnailUrl(nextImages[0].imageUrl)
    }
  }

  const handleAddDocument = async (files) => {
    if (!files || files.length === 0) return
    setUploadingDocuments(true)
    try {
      const uploadedDocs = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        try {
          const res = await uploadApi.post('/image', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          const url = typeof res.data === 'string' ? res.data : res?.data?.secure_url
          if (url) {
            uploadedDocs.push({
              type: 'OTHER',
              fileUrl: url,
              fileName: file.name,
            })
          }
        } catch (err) {
          console.error('Upload failed for', file.name, err)
        }
      }
      setDocuments((prev) => [...prev, ...uploadedDocs])
    } finally {
      setUploadingDocuments(false)
    }
  }

  const handleRemoveDocument = (index) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleBack = () => setStep(Math.max(1, step - 1))
  const handleNext = () => setStep(Math.min(4, step + 1))

  const handleSubmit = async () => {
    setSubmitError('')
    const payload = {
        title: basic.title.trim(),
        description: basic.description.trim(),
        addressSell: basic.addressSell.trim(),
        thumbnailUrl: thumbnailUrl,
        car: {
            ...car,
            name: car.name.trim(),
            brand: car.brand.trim(),
            model: car.model.trim(),
            origin: car.origin.trim(),
            horsepower: String(car.horsepower).trim(),
            mileage: String(car.mileage).trim(),
            color: car.color.trim(),
            engine: String(car.engine || '').trim(),
            year: Number(car.year),
            seats: Number(car.seats),
            images: carImages,
        },
        documents: documents.map((d) => ({
            type: d.type,
            fileUrl: d.fileUrl,
        })),
    }
    try {
      console.log('CreateListing payload:', payload)
      await onSubmit(payload)
    } catch (error) {
      console.error('CreateListing error:', error)
      const errorMsg = 
        (typeof error === 'string' ? error : null) ||
        error?.message ||
        error?.response?.data?.message ||
        (typeof error?.response?.data === 'string' ? error.response.data : null) ||
        'Tạo bài đăng thất bại'
      setSubmitError(errorMsg)
    }
  }

  const isFormValid =
    basic.title.trim() &&
    basic.addressSell.trim() &&
    car.name.trim() &&
    car.brand.trim() &&
    car.model.trim() &&
    car.origin.trim() &&
    String(car.horsepower).trim() &&
    String(car.mileage).trim() &&
    car.color.trim() &&
    String(car.engine || '').trim() &&
    Number(car.seats) > 0 &&
    Number(car.year) > 1900 &&
    thumbnailUrl &&
    carImages.length > 0 &&
    documents.length > 0

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 shadow-sm">
      <h2 className="mb-4 text-2xl font-extrabold text-slate-900">Tạo bài đăng bán xe</h2>
      <div className="mb-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
        Các trường có dấu <span className="font-bold text-red-600">*</span> là bắt buộc. Vui lòng nhập đúng đơn vị cho các trường số.
      </div>

      {/* Progress */}
      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`flex-1 rounded-lg py-2 text-sm font-bold ${
              step === s
                ? 'bg-red-600 text-white'
                : step > s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-600'
            }`}
          >
            Bước {s}
          </button>
        ))}
      </div>

      <div className="mb-6 space-y-4">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Thông tin cơ bản</h3>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Tiêu đề bài đăng <span className="text-red-600">*</span>
              </label>
              <input
                value={basic.title}
                onChange={(e) => setBasic((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ví dụ: Mazda 3 2022, chính chủ"
                className="w-full rounded-lg border border-slate-200 px-4 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Mô tả</label>
              <textarea
                value={basic.description}
                onChange={(e) => setBasic((p) => ({ ...p, description: e.target.value }))}
                placeholder="Mô tả chi tiết về xe, tình trạng, lịch sử bảo dưỡng..."
                className="h-24 w-full rounded-lg border border-slate-200 px-4 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Địa chỉ bán <span className="text-red-600">*</span>
              </label>
              <select
                value={basic.addressSell}
                onChange={(e) => setBasic((p) => ({ ...p, addressSell: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-4 py-2"
              >
                <option value="">Chọn tỉnh/thành bán xe</option>
                {SELLING_LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Car Details */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Thông tin chi tiết xe</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tên xe <span className="text-red-600">*</span>
                </label>
                <input
                  value={car.name}
                  onChange={(e) => setCar((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ví dụ: Mazda 3 Premium"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Hãng xe <span className="text-red-600">*</span>
                </label>
                <input
                  value={car.brand}
                  onChange={(e) => setCar((p) => ({ ...p, brand: e.target.value }))}
                  placeholder="Ví dụ: Mazda"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Dòng xe (Model) <span className="text-red-600">*</span>
                </label>
                <input
                  value={car.model}
                  onChange={(e) => setCar((p) => ({ ...p, model: e.target.value }))}
                  placeholder="Ví dụ: 3"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Năm sản xuất <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1900"
                    value={car.year}
                    onChange={(e) => setCar((p) => ({ ...p, year: Number(e.target.value) }))}
                    placeholder="2022"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 pr-14"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">năm</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Dung tích động cơ <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    value={car.engine}
                    onChange={(e) => setCar((p) => ({ ...p, engine: e.target.value }))}
                    placeholder="Ví dụ: 2.0L hoặc 75.3 kWh (xe điện), cả 2 (hỗn hợp)"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 pr-14"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">L</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Xuất xứ <span className="text-red-600">*</span>
                </label>
                <input
                  value={car.origin}
                  onChange={(e) => setCar((p) => ({ ...p, origin: e.target.value }))}
                  placeholder="Ví dụ: Nhật Bản"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Màu sắc <span className="text-red-600">*</span>
                </label>
                <input
                  value={car.color}
                  onChange={(e) => setCar((p) => ({ ...p, color: e.target.value }))}
                  placeholder="Ví dụ: Trắng"
                  className="w-full rounded-lg border border-slate-200 px-4 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Công suất <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={car.horsepower}
                    onChange={(e) => setCar((p) => ({ ...p, horsepower: e.target.value }))}
                    placeholder="154"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 pr-14"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">HP</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Số km đã chạy <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={car.mileage}
                    onChange={(e) => setCar((p) => ({ ...p, mileage: e.target.value }))}
                    placeholder="45000"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 pr-14"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">km</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Số ghế ngồi <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={car.seats}
                    onChange={(e) => setCar((p) => ({ ...p, seats: e.target.value }))}
                    placeholder="5"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 pr-16"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-500">chỗ</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Nhiên liệu</label>
                <select
                  value={car.fuelType}
                  onChange={(e) => setCar((p) => ({ ...p, fuelType: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2"
                >
                  {FUEL_TYPES.map((f) => (
                    <option key={f} value={f}>{FUEL_LABELS[f] || f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Hộp số</label>
                <select
                  value={car.transmission}
                  onChange={(e) => setCar((p) => ({ ...p, transmission: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2"
                >
                  {TRANSMISSIONS.map((t) => (
                    <option key={t} value={t}>{TRANSMISSION_LABELS[t] || t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Kiểu dáng xe</label>
                <select
                  value={car.bodyType}
                  onChange={(e) => setCar((p) => ({ ...p, bodyType: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2"
                >
                  {BODY_TYPES.map((b) => (
                    <option key={b} value={b}>{BODY_TYPE_LABELS[b] || b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Images */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Ảnh xe (tối thiểu 1)</h3>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 hover:bg-slate-50">
              <div className="text-center">
                <FaImage className="mx-auto text-3xl text-slate-400" />
                <div className="mt-2 text-sm font-semibold text-slate-600">Tải ảnh lên</div>
                <div className="text-xs text-slate-500">JPG, PNG tối đa 10MB</div>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAddImages(e.target.files)}
                disabled={uploadingImages}
              />
            </label>

            {uploadingImages && <div className="text-center text-sm text-slate-600">Đang tải lên...</div>}

            <div className="grid gap-3 md:grid-cols-3">
              {imagePreviews.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.src} alt="preview" className="aspect-square rounded-lg object-cover ring-2 ring-slate-200" />
                  <button
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 rounded-full bg-red-600 p-1 text-white"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                  {img.src === thumbnailUrl && (
                    <div className="absolute top-1 left-1 rounded-full bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
                      Ảnh đại diện
                    </div>
                  )}
                </div>
              ))}
            </div>

            {carImages.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn ảnh đại diện</label>
                <select
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2"
                >
                  {carImages.map((img, i) => (
                    <option key={i} value={img.imageUrl}>
                      Ảnh {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Documents */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Các giấy tờ cần thiết</h3>

            <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-6 hover:bg-slate-50">
              <div className="text-center">
                <FaFileUpload className="mx-auto text-3xl text-slate-400" />
                <div className="mt-2 text-sm font-semibold text-slate-600">Tải giấy tờ lên</div>
                <div className="text-xs text-slate-500">JPG, PNG tối đa 10MB</div>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleAddDocument(e.target.files)}
                disabled={uploadingDocuments}
              />
            </label>

            {uploadingDocuments && <div className="text-center text-sm text-slate-600">Đang tải lên...</div>}

            <div className="space-y-3">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
                  <div className="flex-1">
                    <select
                      value={doc.type}
                      onChange={(e) => {
                        const updated = [...documents]
                        updated[i].type = e.target.value
                        setDocuments(updated)
                      }}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1 text-sm"
                    >
                      {DOCUMENT_TYPES.map((dt) => (
                        <option key={dt.value} value={dt.value}>
                          {dt.label}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1 text-xs text-slate-600">{doc.fileName}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveDocument(i)}
                    className="ml-2 rounded-lg bg-red-600 p-2 text-white hover:bg-red-700"
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>

            {documents.length === 0 && (
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
                ⚠️ Phải tải lên tối thiểu 1 giấy tờ để duyệt bài đăng
              </div>
            )}
          </div>
        )}
      </div>

      {submitError && (
        <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-rose-200">
          {submitError}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
          >
            Quay lại
          </button>
        )}
        {step < 4 ? (
          <button
            onClick={handleNext}
            className="ml-auto px-4 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
          >
            Tiếp tục
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={ !isFormValid || isLoading}
            className="ml-auto px-6 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50"
          >
            {isLoading ? 'Đang đăng...' : 'Đăng bài'}
          </button>
        )}
      </div>
    </div>
  )
}
