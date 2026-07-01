import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiLoader } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import ImageDropzone from "./components/ImageDropzone";
import {
  clearRegisterError,
  clearUploadError,
  register,
  uploadFile,
} from "../features/auth/authSlice";
import { pushToast } from "../features/ui/uiSlice";

const cx = (...c) => c.filter(Boolean).join(" ");

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { registerStatus, registerError, uploadStatus, uploadError } =
    useSelector((state) => state.auth);

  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [firstName, setFirstName] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [city, setCity] = useState("");
  const [commune, setCommune] = useState("");
  const [address, setAddress] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [cccdFrontFile, setCccdFrontFile] = useState(null);
  const [cccdBackFile, setCccdBackFile] = useState(null);

  const [avatarUrl, setAvatarUrl] = useState("");
  const [cccdFrontUrl, setCccdFrontUrl] = useState("");
  const [cccdBackUrl, setCccdBackUrl] = useState("");

  const [errors, setErrors] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);

  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : ""),
    [avatarFile]
  );
  const cccdFrontPreview = useMemo(
    () => (cccdFrontFile ? URL.createObjectURL(cccdFrontFile) : ""),
    [cccdFrontFile]
  );
  const cccdBackPreview = useMemo(
    () => (cccdBackFile ? URL.createObjectURL(cccdBackFile) : ""),
    [cccdBackFile]
  );

  useEffect(() => {
    dispatch(clearRegisterError());
  }, [dispatch]);

  useEffect(() => {
    setShowErrorModal(Boolean(registerError));
  }, [registerError]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (cccdFrontPreview) URL.revokeObjectURL(cccdFrontPreview);
      if (cccdBackPreview) URL.revokeObjectURL(cccdBackPreview);
    };
  }, [avatarPreview, cccdFrontPreview, cccdBackPreview]);

  const loading = registerStatus === "loading";

  const isUploading =
    uploadStatus.avatar === "loading" ||
    uploadStatus.cccdFront === "loading" ||
    uploadStatus.cccdBack === "loading";

  const validate = () => {
    const e = {};

    if (!lastName.trim()) e.lastName = "Vui lòng nhập họ";
    if (!firstName.trim()) e.firstName = "Vui lòng nhập tên";
    if (!username.trim()) e.username = "Vui lòng nhập tên đăng nhập";
    if (!email.trim()) e.email = "Vui lòng nhập email";
    if (!password) e.password = "Vui lòng nhập mật khẩu";
    if (confirmPassword !== password) {
      e.confirmPassword = "Mật khẩu nhập lại không khớp";
    }
    if (!phoneNumber.trim()) e.phoneNumber = "Vui lòng nhập số điện thoại";

    return e;
  };

  const canSubmit = !loading && !isUploading;

  const handleSelectAndUpload = async (file, type) => {
    if (type === "avatar") {
      setAvatarFile(file || null);
      setAvatarUrl("");
    }

    if (type === "cccdFront") {
      setCccdFrontFile(file || null);
      setCccdFrontUrl("");
    }

    if (type === "cccdBack") {
      setCccdBackFile(file || null);
      setCccdBackUrl("");
    }

    dispatch(clearUploadError(type));

    if (!file) return;

    try {
      const result = await dispatch(
        uploadFile({ file, fileType: type })
      ).unwrap();

      if (type === "avatar") setAvatarUrl(result.url);
      if (type === "cccdFront") setCccdFrontUrl(result.url);
      if (type === "cccdBack") setCccdBackUrl(result.url);
    } catch (error) {
      console.error("Upload lỗi:", error);
    }
  };

  const ensureUploaded = async () => {
    let nextAvatarUrl = avatarUrl;
    let nextCccdFrontUrl = cccdFrontUrl;
    let nextCccdBackUrl = cccdBackUrl;

    if (avatarFile && !nextAvatarUrl) {
      const result = await dispatch(
        uploadFile({ file: avatarFile, fileType: "avatar" })
      ).unwrap();
      nextAvatarUrl = result.url;
      setAvatarUrl(result.url);
    }

    if (cccdFrontFile && !nextCccdFrontUrl) {
      const result = await dispatch(
        uploadFile({ file: cccdFrontFile, fileType: "cccdFront" })
      ).unwrap();
      nextCccdFrontUrl = result.url;
      setCccdFrontUrl(result.url);
    }

    if (cccdBackFile && !nextCccdBackUrl) {
      const result = await dispatch(
        uploadFile({ file: cccdBackFile, fileType: "cccdBack" })
      ).unwrap();
      nextCccdBackUrl = result.url;
      setCccdBackUrl(result.url);
    }

    return {
      nextAvatarUrl,
      nextCccdFrontUrl,
      nextCccdBackUrl,
    };
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();

    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    try {
      const { nextAvatarUrl, nextCccdFrontUrl, nextCccdBackUrl } =
        await ensureUploaded();

      const payload = {
        username: username.trim(),
        email: email.trim(),
        password,
        userProfle: {
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          middleName: middleName.trim(),
          phoneNumber: phoneNumber.trim(),
          avatarUrl: nextAvatarUrl || "",
          CCCDtruocUrl: nextCccdFrontUrl || "",
          CCCDsauUrl: nextCccdBackUrl || "",
          gender: gender || "",
          dateOfBirth: dateOfBirth || null,
          city: city.trim(),
          commune: commune.trim(),
          address: address.trim(),
        },
      };

      await dispatch(register(payload)).unwrap();
      dispatch(pushToast({ type: 'success', message: 'Đăng ký thành công' }));
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Register error:", error);
      setShowErrorModal(true);
    }
  };

  return (
    <div className="py-10">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
        <h1 className="text-center text-2xl font-extrabold text-slate-900">
          Đăng ký tài khoản
        </h1>

        <div className="mt-4 text-center text-slate-700">
          Bạn đã có tài khoản?{" "}
          <Link
            to="/login"
            className="font-semibold text-slate-900 hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>

        <form className="mt-10 space-y-8" onSubmit={onSubmit}>
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Họ" error={errors.lastName}>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Họ"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
            </Field>

            <Field label="Tên đệm">
              <input
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Tên đệm"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
            </Field>

            <Field label="Tên" error={errors.firstName}>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Tên"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Tên đăng nhập" error={errors.username}>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
            </Field>

            <Field label="Email" error={errors.email}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Mật khẩu" error={errors.password}>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  placeholder="Mật khẩu"
                  className="w-full rounded-md border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50"
                >
                  {showPw ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </Field>

            <Field label="Nhập lại mật khẩu" error={errors.confirmPassword}>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showPw ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Số điện thoại" error={errors.phoneNumber}>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Số điện thoại"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
            </Field>

            <Field label="Giới tính">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              >
                <option value="">Chọn</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </Field>

            <Field label="Ngày sinh">
              <input
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                type="date"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Field label="Tỉnh/Thành phố">
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Tỉnh/Thành phố"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
            </Field>

            <Field label="Phường/Xã">
              <input
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                placeholder="Phường/Xã"
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
            </Field>

            <Field label="Địa chỉ chi tiết">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, đường..."
                className="w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
              />
            </Field>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <ImageDropzone
                title="Ảnh đại diện"
                file={avatarFile}
                onChangeFile={(file) => handleSelectAndUpload(file, "avatar")}
                maxSizeMB={10}
              />
              {uploadStatus.avatar === "loading" && (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <FiLoader className="animate-spin" />
                  Đang load ảnh đại diện...
                </div>
              )}
              {avatarUrl && uploadStatus.avatar === "succeeded" && (
                <div className="mt-2 text-xs text-green-600">
                  Upload ảnh đại diện thành công
                </div>
              )}
              {uploadError.avatar && (
                <div className="mt-2 text-xs text-red-600">
                  {uploadError.avatar}
                </div>
              )}
            </div>

            <div>
              <ImageDropzone
                title="Ảnh mặt trước CMND/CCCD"
                file={cccdFrontFile}
                onChangeFile={(file) => handleSelectAndUpload(file, "cccdFront")}
                maxSizeMB={10}
              />
              {uploadStatus.cccdFront === "loading" && (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <FiLoader className="animate-spin" />
                  Đang load ảnh mặt trước...
                </div>
              )}
              {cccdFrontUrl && uploadStatus.cccdFront === "succeeded" && (
                <div className="mt-2 text-xs text-green-600">
                  Load ảnh mặt trước thành công
                </div>
              )}
              {uploadError.cccdFront && (
                <div className="mt-2 text-xs text-red-600">
                  {uploadError.cccdFront}
                </div>
              )}
            </div>

            <div>
              <ImageDropzone
                title="Ảnh mặt sau CMND/CCCD"
                file={cccdBackFile}
                onChangeFile={(file) => handleSelectAndUpload(file, "cccdBack")}
                maxSizeMB={10}
              />
              {uploadStatus.cccdBack === "loading" && (
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                  <FiLoader className="animate-spin" />
                  Đang load ảnh mặt sau...
                </div>
              )}
              {cccdBackUrl && uploadStatus.cccdBack === "succeeded" && (
                <div className="mt-2 text-xs text-green-600">
                  Load ảnh mặt sau thành công
                </div>
              )}
              {uploadError.cccdBack && (
                <div className="mt-2 text-xs text-red-600">
                  {uploadError.cccdBack}
                </div>
              )}
            </div>
          </div>

          {registerError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {typeof registerError === "string"
                ? registerError
                : "Đăng ký thất bại"}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className={cx(
                "h-12 w-full rounded-md text-sm font-bold uppercase tracking-wide",
                canSubmit
                  ? "bg-red-700 text-white hover:bg-red-800"
                  : "cursor-not-allowed bg-slate-300 text-slate-600"
              )}
            >
              {loading
                ? "Đang đăng ký..."
                : isUploading
                ? "Đang upload ảnh..."
                : "Đăng ký"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Local error modal (simple, self-contained)
function ErrorModal({ message, onClose }) {
  if (!message) return null;
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Lỗi</h3>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-slate-600 hover:underline"
          >
            Đóng
          </button>
        </div>
        <div className="mt-4 text-sm text-slate-700">{message}</div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-bold text-white"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
