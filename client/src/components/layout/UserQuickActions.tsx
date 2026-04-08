import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileText, LogOut, ShoppingCart, Upload, User, LayoutDashboard, HomeIcon } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../utils/api';
import { clearAuthSession, getAuthSession, getUserInitials, hydrateAuthSession, subscribeToAuthChanges, type AuthUser } from '../../utils/auth';
import { getDefaultDashboardPath } from '../../utils/dashboard';
import { Button } from '../ui/Button';
import { useCart } from '../../context/CartContext';

type UserQuickActionsProps = {
  mobile?: boolean;
  mobileSection?: 'all' | 'topActions' | 'account';
};

const UserQuickActions: React.FC<UserQuickActionsProps> = ({ mobile = false, mobileSection = 'all' }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getAuthSession()?.user ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();

  useEffect(() => {
    setCurrentUser(getAuthSession()?.user ?? null);
  }, [location.pathname]);

  useEffect(() => subscribeToAuthChanges(() => {
    setCurrentUser(getAuthSession()?.user ?? null);
  }), []);

  useEffect(() => {
    if (currentUser) {
      return;
    }

    let isMounted = true;

    void hydrateAuthSession().then((session) => {
      if (isMounted && session) {
        setCurrentUser(session.user);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!currentUser) {
    return null;
  }

  const dashboardPath = getDefaultDashboardPath(currentUser.role);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // Clear local session even if the logout request fails.
    } finally {
      clearAuthSession();
      setMenuOpen(false);
      navigate('/');
    }
  };

  if (mobile) {
    const showTopActions = mobileSection === 'all' || mobileSection === 'topActions';
    const showAccount = mobileSection === 'all' || mobileSection === 'account';

    return (
      <div className="space-y-3 pt-1">
        {showTopActions ? (
          <div className="grid grid-cols-2 gap-2">
            <Link to="/cart" className="relative">
              <Button variant="secondary" size="sm" className="h-11 w-full justify-start px-3">
                <ShoppingCart size={14} />
                Cart
              </Button>
              {itemCount > 0 ? (
                <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1ED760] px-1 text-[10px] font-bold text-[#0B0B0B]">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              ) : null}
            </Link>
            <Link to="/dashboard/seller">
              <Button variant="primary" size="sm" className="h-11 w-full justify-start px-3">
                <Upload size={14} />
                Upload
              </Button>
            </Link>
          </div>
        ) : null}

        {showAccount ? (
          <div className="rounded-2xl border border-[#262626] bg-[#101010] p-2">
            <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.16em] text-[#6B7280]">Account</p>
            <Link to={dashboardPath} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#D1D5DB] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
              <LayoutDashboard size={14} />
              My Dashboard
            </Link>
            <Link to="/profile" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#D1D5DB] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
              <User size={14} />
              Profile
            </Link>
            <Link to="/studio-setup" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#D1D5DB] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
              <HomeIcon size={14} />
              Studio Setup
            </Link>
            <Link to="/seller-agreement" className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#D1D5DB] transition-colors duration-200 hover:bg-[#161616] hover:text-white">
              <FileText size={14} />
              Seller Agreement
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#FFB4C0] transition-colors duration-200 hover:bg-[#2A1015]"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link to="/cart" aria-label={`Open cart (${itemCount} item${itemCount === 1 ? '' : 's'})`} className="relative">
        <button className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-[#262626] bg-[#121212]/95 text-[#B3B3B3] transition-colors duration-200 hover:text-white">
          <ShoppingCart size={18} />
        </button>
        {itemCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1ED760] px-1 text-[10px] font-bold text-[#0B0B0B] ring-2 ring-[#0B0B0B]">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        ) : null}
      </Link>
      <Link to="/dashboard/seller">
        <Button variant="primary" size="sm" className="px-2.5 sm:px-4">
          <Upload size={16} />
          <span className="hidden sm:inline">Upload</span>
        </Button>
      </Link>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex items-center gap-2 sm:gap-3 rounded-full border border-[#262626] bg-[#121212]/95 px-1.5 sm:px-2 py-1 text-sm font-small text-white transition-colors duration-200 hover:border-[#1ED760]"
        >
          {currentUser.avatar ? (
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[#2A2A2A] bg-[#0F0F0F]">
              <img
                src={currentUser.avatar}
                alt={`${currentUser.displayName} avatar`}
                className="h-full w-full object-cover"
              />
            </span>
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] text-xs font-bold text-[#0B0B0B]">
              {getUserInitials(currentUser.displayName)}
            </span>
          )}
          <span className="hidden max-w-[8rem] truncate sm:inline">{currentUser.displayName}</span>
          <ChevronDown size={16} className={menuOpen ? 'rotate-180 transition-transform duration-200' : 'transition-transform duration-200'} />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-full z-[130] mt-3 w-64 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="rounded-xl border border-[#1F1F1F] bg-[#141414] px-4 py-3">
              <p className="mt-1 text-xs text-[#B3B3B3]">{currentUser.email}</p>
            </div>
            <Link
              to={dashboardPath}
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
            >
              <LayoutDashboard size={16} />
              My Dashboard
            </Link>
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
            >
              <User size={16} />
              Profile
            </Link>
            <Link
              to="/studio-setup"
              onClick={() => setMenuOpen(false)}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
            >

              <HomeIcon size={16} />
              Studio Setup
            </Link>
            <Link
              to="/seller-agreement"
              onClick={() => setMenuOpen(false)}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
            >

              <FileText size={16} />
              Seller Agreement
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-[#FFB4C0] transition-colors duration-200 hover:bg-[#2A1015]"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default UserQuickActions;
