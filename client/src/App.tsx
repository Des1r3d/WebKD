import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Role } from './types';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { HomeMapPage } from './pages/HomeMapPage';
import { VenueDetailPage } from './pages/VenueDetailPage';
import { LobbyPage } from './pages/LobbyPage';
import { SplitBillPage } from './pages/SplitBillPage';
import { WalletPage } from './pages/WalletPage';
import { DisputePage } from './pages/DisputePage';
import { ProfilePage } from './pages/ProfilePage';
import { ProviderPortalPage } from './pages/ProviderPortalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { StyleguidePage } from './pages/StyleguidePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomeMapPage />} />
            <Route path="/venue" element={<VenueDetailPage />} />
            <Route path="/lobby" element={<LobbyPage />} />
            <Route path="/split-bill" element={<SplitBillPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/disputes" element={<DisputePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/provider"
              element={
                <ProtectedRoute allowedRoles={[Role.PROVIDER]}>
                  <ProviderPortalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/styleguide" element={<StyleguidePage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
