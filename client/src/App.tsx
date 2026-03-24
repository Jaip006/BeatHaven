import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import SellerUploadPage from './pages/SellerUploadPage';
import SellerAgreementPage from './pages/SellerAgreementPage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/buyer" element={<BuyerDashboardPage />} />
          <Route path="/dashboard/seller" element={<SellerDashboardPage />} />
          <Route path="/dashboard/seller/upload" element={<SellerUploadPage />} />
          <Route path="/seller-agreement" element={<SellerAgreementPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/cart" element={<CartPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
