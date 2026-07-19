import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import BundlesPage from './pages/BundlesPage'
import CheckoutPage from './pages/CheckoutPage'
import TrackPage from './pages/TrackPage'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import ScrollToTop from './components/ScrollToTop'

export default function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <ScrollToTop />
        <Routes>
          <Route path="/"            element={<Home />} />
          <Route path="/bundles/:network" element={<BundlesPage />} />
          <Route path="/checkout"    element={<CheckoutPage />} />
          <Route path="/track"       element={<TrackPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin"       element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
