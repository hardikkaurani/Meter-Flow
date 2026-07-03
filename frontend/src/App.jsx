// App router. Public auth pages + a protected dashboard shell (Phase 5).
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ApisPage from './pages/ApisPage.jsx';
import ApiDetail from './pages/ApiDetail.jsx';
import LiveUsage from './pages/LiveUsage.jsx';
import Billing from './pages/Billing.jsx';
import Playground from './pages/Playground.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/apis" element={<ApisPage />} />
          <Route path="/apis/:apiId" element={<ApiDetail />} />
          <Route path="/usage" element={<LiveUsage />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/playground" element={<Playground />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
