import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 text-slate-600">Không tìm thấy trang</p>
      <Link className="mt-6 inline-block text-red-700 underline" to="/">
        Về trang chủ
      </Link>
    </div>
  );
}