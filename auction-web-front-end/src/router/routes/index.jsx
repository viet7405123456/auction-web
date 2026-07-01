import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../../components/layout/MainLayout";
import ProtectedRoute from "../ProtectedRoute";

import HomePage from "../../pages/HomePage";
import AboutPage from "../../pages/AboutPage";
import ContactPage from "../../pages/ContactPage";
import LoginPage from "../../pages/LoginPage";
import RegisterPage from "../../pages/RegisterPage";
import NotFound from "../../pages/NotFound";
import AuctionsPage from "../../pages/AuctionsPage";
import AccountPage from "../../pages/AccountPage";
import ListingsPage from "../../pages/ListingsPage";

import ListingDetailPage from "../../pages/ListingDetailPage";

// Tạm thời tạo placeholder cho các trang menu đấu giá
function Placeholder({ title }) {
  return (
    <div className="py-10">
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: (<HomePage />) },

      { path: "/listings", element: <ListingsPage /> },
      { path: "/listings/:id", element: <ListingDetailPage /> },
      
      // Menu: Phiên đấu giá
      { path: "/auctions", element: <AuctionsPage /> },
      { path: "/auctions/upcoming", element: <Placeholder title="Phiên đấu giá sắp đấu giá" /> },
      { path: "/auctions/live", element: <Placeholder title="Phiên đấu giá đang diễn ra" /> },
      { path: "/auctions/ended", element: <Placeholder title="Phiên đấu giá đã kết thúc" /> },
      {
        path: "/auctions/new",
        element: (
          <ProtectedRoute>
            <Placeholder title="Tạo phiên đấu giá (cần đăng nhập)" />
          </ProtectedRoute>
        ),
      },

      // Tin tức
      { path: "/news", element: <Placeholder title="Tin tức" /> },

      // Giới thiệu - Liên hệ - Auth
      { path: "/about", element: <AboutPage /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      {
        path: "/account",
        element: (
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        ),
      },

      // Catch-all
      { path: "*", element: <NotFound /> },
    ],
  },
]);