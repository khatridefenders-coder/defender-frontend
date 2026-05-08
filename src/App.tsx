import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import LoginPage from './pages/auth/LoginPage';
import ChangePasswordPage from './pages/auth/ChangePasswordPage';
import Layout from './components/Layout';
import CoordinatorDashboardPage from './pages/coordinator/CoordinatorDashboardPage';
import CoordinatorVotersPage from './pages/coordinator/CoordinatorVotersPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminVotersPage from './pages/admin/AdminVotersPage';
import AdminCoordinatorsPage from './pages/admin/AdminCoordinatorsPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequirePasswordChange({ children }: { children: React.ReactNode }) {
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  return <>{children}</>;
}

function RoleRoute({ role, children }: { role: 'ADMIN' | 'COORDINATOR'; children: React.ReactNode }) {
  const userRole = useAuthStore((s) => s.role);
  if (userRole !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const role = useAuthStore((s) => s.role);
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword);
  if (mustChangePassword) return <Navigate to="/change-password" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'COORDINATOR') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/change-password"
          element={
            <RequireAuth>
              <ChangePasswordPage />
            </RequireAuth>
          }
        />

        <Route
          element={
            <RequireAuth>
              <RequirePasswordChange>
                <Layout />
              </RequirePasswordChange>
            </RequireAuth>
          }
        >
          {/* Coordinator routes */}
          <Route
            path="/dashboard"
            element={
              <RoleRoute role="COORDINATOR">
                <CoordinatorDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/voters"
            element={
              <RoleRoute role="COORDINATOR">
                <CoordinatorVotersPage />
              </RoleRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute role="ADMIN">
                <AdminDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/voters"
            element={
              <RoleRoute role="ADMIN">
                <AdminVotersPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/coordinators"
            element={
              <RoleRoute role="ADMIN">
                <AdminCoordinatorsPage />
              </RoleRoute>
            }
          />
        </Route>

        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}
