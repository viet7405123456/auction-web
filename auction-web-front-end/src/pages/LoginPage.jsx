import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, login } from "../features/auth/authSlice";
import { pushToast } from '../features/ui/uiSlice'

function EyeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.6A2.5 2.5 0 0 0 14 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9.2 5.4A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a18.2 18.2 0 0 1-4.3 5.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6.2 6.2C3.7 8.1 2 12 2 12s3.5 7 10 7c1 0 2-.2 3-.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { status, error, isAuthenticated, user } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const loading = status === "loading";

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !loading;
  }, [email, password, loading]);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      await dispatch(
        login({
          email: email.trim(),
          password,
        })
      ).unwrap();
      dispatch(
        pushToast({
          type: 'success',
          title: 'Đăng nhập thành công',
          message: 'Chào mừng bạn quay trở lại!',
          duration: 3200,
        }),
      )
    } catch (err) {
      console.error("Đăng nhập lỗi:", err);
    }
  };

  return (
    <div className="py-10">
      <div className="mx-auto max-w-5xl rounded-xl bg-white p-8 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
        <h1 className="text-center text-2xl font-extrabold text-slate-900">
          Đăng nhập tài khoản
        </h1>

        <div className="mt-4 text-center text-base text-slate-700">
          Bạn chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-slate-900 hover:underline">
            Đăng ký ngay
          </Link>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-semibold text-slate-800">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email"
              className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800">
              Mật khẩu
            </label>

            <div className="relative mt-2">
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
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="mt-3">
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-slate-900 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {typeof error === "string" ? error : "Đăng nhập thất bại"}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={[
              "h-12 w-full rounded-md text-sm font-bold uppercase tracking-wide",
              canSubmit
                ? "bg-red-700 text-white hover:bg-red-800"
                : "cursor-not-allowed bg-slate-200 text-slate-500",
            ].join(" ")}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}