import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import GlobalToast from '../common/GlobalToast'

export default function MainLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4">
        <Outlet />
      </main>
      <Footer />
      <GlobalToast />
    </div>
  );
}