import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, FileText, LogOut, ShoppingCart, Upload, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../utils/api';
import { clearAuthSession, getAuthSession, getUserInitials, hydrateAuthSession, subscribeToAuthChanges, type AuthUser } from '../../utils/auth';
import { getDefaultDashboardPath } from '../../utils/dashboard';
import { Button } from '../ui/Button';

type UserQuickActionsProps = {
  mobile?: boolean;
};

const UserQuickActions: React.FC<UserQuickActionsProps> = ({ mobile = false }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getAuthSession()?.user ?? null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    return (
      <div className="pt-3">
        <div className="grid gap-3">
          <Link to="/cart">
            <Button variant="secondary" size="sm" className="w-full justify-start">
              <ShoppingCart size={14} />
              Cart
            </Button>
          </Link>
          <Link to="/dashboard/seller">
            <Button variant="primary" size="sm" className="w-full justify-start">
              <Upload size={14} />
              Upload
            </Button>
          </Link>
          <div className="rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3">
            <p className="text-sm font-semibold text-white">{currentUser.displayName}</p>
            <p className="mt-1 text-xs text-[#B3B3B3]">{currentUser.email}</p>
          </div>
          <Link to={dashboardPath}>
            <Button variant="secondary" size="sm" className="w-full justify-start">
              <User size={14} />
              Account
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="secondary" size="sm" className="w-full justify-start">
              <User size={14} />
              Profile
            </Button>
          </Link>
          <Link to="/seller-agreement">
            <Button variant="secondary" size="sm" className="w-full justify-start">
              <FileText size={14} />
              Seller Agreement
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start text-[#FFB4C0]" onClick={handleLogout}>
            <LogOut size={14} />
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link to="/cart" aria-label="Open cart">
        <button className="flex h-11 w-11 items-center justify-center rounded-full border border-[#262626] bg-[#121212]/95 text-[#B3B3B3] transition-colors duration-200 hover:text-white">
          <ShoppingCart size={18} />
        </button>
      </Link>
      <Link to="/dashboard/seller">
        <Button variant="primary" size="md">
          <Upload size={16} />
          Upload
        </Button>
      </Link>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((current) => !current)}
          className="inline-flex items-center gap-3 rounded-full border border-[#262626] bg-[#121212]/95 px-2 py-1 text-sm font-small text-white transition-colors duration-200 hover:border-[#1ED760]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] text-xs font-bold text-[#0B0B0B]">
            {getUserInitials(currentUser.displayName)}
          </span>
          <span className="max-w-[8rem] truncate">{currentUser.displayName}</span>
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
              <User size={16} />
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
