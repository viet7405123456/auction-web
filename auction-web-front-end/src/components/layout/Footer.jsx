import { Link } from "react-router-dom";

const cx = (...classes) => classes.filter(Boolean).join(" ");

function SocialIcon({ children, label, href = "#" }) {
  return (
    <a
      href={href}
      aria-label={label}
      className={cx(
        "inline-flex h-10 w-10 items-center justify-center rounded-full",
        "border border-slate-200 bg-white text-slate-700",
        "hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-200"
      )}
    >
      {children}
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-red-200 bg-red-50 text-red-700 font-bold">
                LV
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold text-slate-700">ĐẤU GIÁ</div>
                <div className="text-base font-extrabold text-red-700">VIỆT 123</div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Nền tảng đấu giá xe hơi trực tuyến: minh bạch, nhanh chóng.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <SocialIcon label="Facebook">
                <span aria-hidden="true">f</span>
              </SocialIcon>
              <SocialIcon label="YouTube">
                <span aria-hidden="true">▶</span>
              </SocialIcon>
              <SocialIcon label="Zalo">
                <span aria-hidden="true">Z</span>
              </SocialIcon>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-bold text-slate-900">Liên kết nhanh</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link className="text-slate-600 hover:text-slate-900" to="/auctions/live">Phiên đấu giá đang diễn ra</Link></li>
              <li><Link className="text-slate-600 hover:text-slate-900" to="/auctions/upcoming">Phiên đấu giá sắp diễn ra</Link></li>
              <li><Link className="text-slate-600 hover:text-slate-900" to="/listings">Danh sách bài đăng</Link></li>
              <li><Link className="text-slate-600 hover:text-slate-900" to="/news">Tin tức</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold text-slate-900">Liên hệ</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li><span className="font-semibold text-slate-800">Hotline:</span> 1900 xxxx</li>
              <li><span className="font-semibold text-slate-800">Email:</span> support@viet123.vn</li>
              <li><span className="font-semibold text-slate-800">Địa chỉ:</span> (Hà Nội Việt Nam)</li>
              <li><span className="font-semibold text-slate-800">Giờ làm việc:</span> 08:00–17:30 (T2–T6)</li>
            </ul>
          </div>

          {/* Policies + App */}
          <div>
            <h3 className="text-sm font-bold text-slate-900">Chính sách</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link className="text-slate-600 hover:text-slate-900" to="/terms">Điều khoản sử dụng</Link></li>
              <li><Link className="text-slate-600 hover:text-slate-900" to="/privacy">Chính sách bảo mật</Link></li>
              <li><Link className="text-slate-600 hover:text-slate-900" to="/guide">Hướng dẫn tham gia đấu giá</Link></li>
              <li><Link className="text-slate-600 hover:text-slate-900" to="/faq">Câu hỏi thường gặp</Link></li>
            </ul>


          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-slate-200 pt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Việt 123 Auction. All rights reserved.
            </p>
            <div className="flex gap-4 text-xs">
              <Link className="text-slate-500 hover:text-slate-900" to="/privacy">Privacy</Link>
              <Link className="text-slate-500 hover:text-slate-900" to="/terms">Terms</Link>
              <Link className="text-slate-500 hover:text-slate-900" to="/contact">Support</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}