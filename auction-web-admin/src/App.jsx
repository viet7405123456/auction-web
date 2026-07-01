import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/AdminLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import UsersPage from './features/users/UsersPage.jsx'
import ListingsPage from './features/listings/ListingsPage.jsx'
import AuctionsPage from './features/Auctions/AuctionsPage.jsx'
import ContactsPage from './features/contacts/ContactsPage.jsx'
import PaymentsPage from './features/payments/PaymentsPage.jsx'
import RequireAuth from './features/auth/RequireAuth.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      <Route path="/admin/login" element={<LoginPage />} />
      
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="auctions" element={<AuctionsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="contacts" element={<ContactsPage />} />
      </Route>


      <Route path="*" element={<NotFoundPage />} />
    </Routes>


  )
}
