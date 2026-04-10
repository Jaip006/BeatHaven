import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PlayerProvider } from './context/PlayerContext';
import BeatPreviewPlayer from './components/layout/BeatPreviewPlayer';
import './App.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const BuyerDashboardPage = lazy(() => import('./pages/BuyerDashboardPage'));
const SellerDashboardPage = lazy(() => import('./pages/SellerDashboardPage'));
const SellerUploadPage = lazy(() => import('./pages/SellerUploadPage'));
const MyStudioPage = lazy(() => import('./pages/MyStudioPage'));
const StudioSetupPage = lazy(() => import('./pages/StudioSetupPage'));
const SellerAgreementPage = lazy(() => import('./pages/SellerAgreementPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const LikedBeatsPage = lazy(() => import('./pages/LikedBeatsPage'));
const DownloadsPage = lazy(() => import('./pages/DownloadsPage'));

function App() {
  return (
    <PlayerProvider>
      <Router>
        <Suspense
          fallback={(
            <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] text-sm text-[#B3B3B3]">
              Loading...
            </div>
          )}
        >
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard/buyer" element={<BuyerDashboardPage />} />
              <Route path="/dashboard/seller" element={<SellerDashboardPage />} />
              <Route path="/dashboard/seller/upload" element={<SellerUploadPage />} />
              <Route path="/studio" element={<MyStudioPage />} />
              <Route path="/seller-agreement" element={<SellerAgreementPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/studio-setup" element={<StudioSetupPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/liked-beats" element={<LikedBeatsPage />} />
              <Route path="/downloads" element={<DownloadsPage />} />
            </Route>
          </Routes>
        </Suspense>
        <BeatPreviewPlayer />
      </Router>
    </PlayerProvider>
  );
}

export default App;
