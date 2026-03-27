import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarDays,
  Camera,
  ChevronDown,
  CreditCard,
  Edit2,
  FileText,
  Fingerprint,
  Lock,
  Mail,
  Music2,
  Phone,
  Search,
  Shield,
  User,
  X,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import UserQuickActions from '../components/layout/UserQuickActions';
import { authFetch } from '../utils/authFetch';
import { getAuthSession, getUserInitials, saveAuthSession, type AuthUser } from '../utils/auth';

type DropdownKey = 'dashboard' | 'beats' | 'browse' | null;

const dashboardOptions = ['Seller Dashboard', 'Buyer Dashboard'];
const beatOptions = ['My Beats', 'Draft Uploads'];
const dashboardRoutes: Record<(typeof dashboardOptions)[number], string> = {
  'Seller Dashboard': '/dashboard/seller',
  'Buyer Dashboard': '/dashboard/buyer',
};

const browseSections = [
  { title: 'Sales', items: ['Orders Received', 'Payouts', 'Customers'] },
  { title: 'Workspace', items: ['Analytics', 'Licenses', 'Upload Queue'] },
];

// ── helpers ────────────────────────────────────────────────────────────────

const VerifiedBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-[#1ED760]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1ED760]">
    <BadgeCheck size={12} /> Verified
  </span>
);

const UnverifiedBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-1 text-[11px] font-semibold text-yellow-400">
    <AlertTriangle size={12} /> Not Verified
  </span>
);

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: 'green' | 'purple' | 'blue';
}> = ({ icon, title, subtitle, children, accent = 'green' }) => {
  const accentColor =
    accent === 'green'
      ? 'text-[#1ED760]'
      : accent === 'purple'
        ? 'text-[#7C5CFF]'
        : 'text-blue-400';
  return (
    <div className="rounded-[1.6rem] border border-[#262626] bg-[#0F0F0F]/80 backdrop-blur-sm overflow-hidden">
      <div className="px-6 pt-6 pb-4 flex items-start gap-3 border-b border-[#1E1E1E]">
        <div className={`mt-0.5 ${accentColor}`}>{icon}</div>
        <div>
          <h3 className="text-[15px] font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
};

const InputField: React.FC<{
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  badge?: React.ReactNode;
  suffix?: React.ReactNode;
}> = ({ label, value, onChange, placeholder, disabled, type = 'text', badge, suffix }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <label className="text-[11px] uppercase tracking-[0.18em] text-[#6B7280] font-medium">
        {label}
      </label>
      {badge}
    </div>
    <div className="relative flex items-center">
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded-[0.85rem] border px-4 py-3 text-sm outline-none transition-all duration-200 ${disabled
          ? 'border-[#1E1E1E] bg-[#0B0B0B] text-[#6B7280] cursor-not-allowed'
          : 'border-[#262626] bg-[#121212] text-white placeholder-[#4B4B4B] focus:border-[#1ED760]/60 focus:ring-1 focus:ring-[#1ED760]/20'
          } ${suffix ? 'pr-14' : ''}`}
      />
      {disabled && (
        <div className="pointer-events-none absolute right-3 text-[#4B4B4B]">
          <Lock size={14} />
        </div>
      )}
      {suffix && <div className="absolute right-3">{suffix}</div>}
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getAuthSession()?.user ?? null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);

  // ── profile photo ──
  const [photoPreview, setPhotoPreview] = useState<string | null>(currentUser?.avatar ?? null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ── name edits ──
  const [displayName, setDisplayName] = useState(currentUser?.displayName ?? '');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(displayName);

  // ── mobile ──
  const [mobile, setMobile] = useState('');
  const [mobileVerified, setMobileVerified] = useState(Boolean(currentUser?.mobileVerified));
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  // ── aadhaar ──
  const [aadhaarVerified, setAadhaarVerified] = useState(Boolean(currentUser?.aadhaarVerified));

  // ── gender & dob ──
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [profileSaveLoading, setProfileSaveLoading] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState('');
  const [profileSaveError, setProfileSaveError] = useState('');

  // ── billing ──
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingPin, setBillingPin] = useState('');

  // ── bank / payout ──
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  const toggleDropdown = (key: Exclude<DropdownKey, null>) => {
    setOpenDropdown((current) => (current === key ? null : key));
  };

  useEffect(() => {
    const sessionUser = getAuthSession()?.user ?? null;
    if (!sessionUser) return;

    setCurrentUser(sessionUser);
    setMobileVerified(Boolean(sessionUser.mobileVerified));
    const rawMobile = String(sessionUser.mobileNumber ?? '');
    const digits = rawMobile.replace(/\D/g, '');
    if (digits.length >= 10) {
      setMobile(digits.slice(-10));
    }
    if (sessionUser.gender) {
      setGender(sessionUser.gender);
    }
    if (sessionUser.dateOfBirth) {
      setDob(String(sessionUser.dateOfBirth).slice(0, 10));
    }
    if (sessionUser.billingAddress) {
      setBillingAddress(sessionUser.billingAddress.street ?? '');
      setBillingCity(sessionUser.billingAddress.city ?? '');
      setBillingState(sessionUser.billingAddress.state ?? '');
      setBillingPin(sessionUser.billingAddress.pin ?? '');
    }
    if (sessionUser.payoutBank) {
      setAccountName(sessionUser.payoutBank.accountName ?? '');
      setAccountNumber(sessionUser.payoutBank.accountNumber ?? '');
      setIfscCode(sessionUser.payoutBank.ifscCode ?? '');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size should be 5 MB or less.');
      return;
    }

    setPhotoError('');
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await authFetch(`${import.meta.env.VITE_API_URL}/auth/avatar`, {
        method: 'PUT',
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setPhotoError(data?.message || 'Failed to upload profile photo.');
        return;
      }

      const avatarUrl = data?.data?.avatar as string | undefined;
      if (!avatarUrl) {
        setPhotoError('Failed to receive uploaded photo URL.');
        return;
      }

      setPhotoPreview(avatarUrl);
      if (currentUser) {
        const updatedUser: AuthUser = { ...currentUser, avatar: avatarUrl };
        setCurrentUser(updatedUser);
        const session = getAuthSession();
        if (session) {
          saveAuthSession({
            ...session,
            user: updatedUser,
          });
        }
      }
    } catch (error) {
      console.error('Failed to upload profile photo', error);
      setPhotoError('Failed to upload profile photo.');
    } finally {
      setIsPhotoUploading(false);
    }
  };

  const handleSendOtp = async () => {
    if (mobile.length !== 10) {
      setOtpError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpError('');
    setOtpLoading(true);

    try {
      const response = await authFetch(`${import.meta.env.VITE_API_URL}/auth/mobile/send-otp`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: mobile }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setOtpError(data?.message || 'Failed to send OTP. Please try again.');
        return;
      }

      setOtp('');
      setOtpSent(true);
    } catch (error) {
      console.error('Failed to send mobile OTP', error);
      setOtpError('Failed to send OTP. Please check your connection and retry.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP.');
      return;
    }

    setOtpError('');
    setOtpVerifying(true);

    try {
      const response = await authFetch(`${import.meta.env.VITE_API_URL}/auth/mobile/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: mobile, otp }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setOtpError(data?.message || 'Invalid OTP. Please try again.');
        return;
      }

      const updatedUser = data?.data?.user as AuthUser | undefined;
      if (updatedUser) {
        setCurrentUser(updatedUser);
        const session = getAuthSession();
        if (session) {
          saveAuthSession({
            ...session,
            user: updatedUser,
          });
        }
      }

      setMobileVerified(true);
      setOtpSent(false);
      setOtp('');
    } catch (error) {
      console.error('Failed to verify mobile OTP', error);
      setOtpError('Failed to verify OTP. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const saveVerificationDetails = async (payload: {
    aadhaarVerified?: boolean;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    billingAddress?: {
      street?: string;
      city?: string;
      state?: string;
      pin?: string;
    };
    payoutBank?: {
      accountName?: string;
      accountNumber?: string;
      ifscCode?: string;
    };
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authFetch(`${import.meta.env.VITE_API_URL}/auth/verification`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        return { success: false, message: data?.message || 'Failed to save profile details.' };
      }

      const updatedUser = data?.data?.user as AuthUser | undefined;
      if (updatedUser) {
        setCurrentUser(updatedUser);
        const session = getAuthSession();
        if (session) {
          saveAuthSession({
            ...session,
            user: updatedUser,
          });
        }
      }
      return { success: true };
    } catch (error) {
      console.error('Failed to save verification details', error);
      return { success: false, message: 'Failed to save profile details.' };
    }
  };

  const handleSaveProfileChanges = async () => {
    setProfileSaveError('');
    setProfileSaveMessage('');
    setProfileSaveLoading(true);

    const normalizedGender = (gender || '').toLowerCase();
    if (normalizedGender && !['male', 'female', 'other'].includes(normalizedGender)) {
      setProfileSaveError('Please select a valid gender.');
      setProfileSaveLoading(false);
      return;
    }

    const result = await saveVerificationDetails({
      gender: (normalizedGender || undefined) as 'male' | 'female' | 'other' | undefined,
      dateOfBirth: dob || undefined,
      billingAddress: {
        street: billingAddress.trim(),
        city: billingCity.trim(),
        state: billingState.trim(),
        pin: billingPin.trim(),
      },
      payoutBank: {
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
      },
    });

    if (!result.success) {
      setProfileSaveError(result.message || 'Failed to save profile details.');
      setProfileSaveLoading(false);
      return;
    }

    setProfileSaveMessage('Profile details saved successfully.');
    setProfileSaveLoading(false);
  };

  const handleSaveName = () => {
    setDisplayName(tempName.trim() || displayName);
    setEditingName(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-x-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-16 left-[-8rem] h-72 w-72 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-56 right-[-8rem] h-72 w-72 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        {/* ── Navbar ── */}
        <div className="fixed inset-x-0 top-0 z-[100]">
          <div className="relative z-[120] border-b border-[#262626] bg-[#0B0B0B]/85 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-5 lg:px-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <Link to="/" className="flex items-center gap-2.5 group">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] shadow-[0_0_20px_rgba(30,215,96,0.3)] transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(30,215,96,0.5)]">
                    <Music2 size={18} className="text-[#0B0B0B]" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">
                    Beat<span className="text-[#1ED760]">Haven</span>
                  </span>
                </Link>
                <div className="flex items-center gap-3 rounded-full border border-[#262626] bg-[#121212]/95 px-4 py-3 text-sm text-[#B3B3B3] lg:min-w-[360px]">
                  <Search size={16} className="text-[#6B7280]" />
                  <span>Search beats, licenses, producers, lyrics</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <UserQuickActions />
              </div>
            </div>
          </div>

          <div className="relative z-[110] border-b border-[#262626] bg-[#090909]/80 backdrop-blur-xl">
            <div
              ref={dropdownContainerRef}
              className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-5 lg:px-7"
            >
              {/* Dashboard dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('dashboard')}
                  className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/95 px-4 py-2.5 text-sm text-white transition-colors duration-200 hover:border-[#1ED760]"
                >
                  Dashboard
                  <ChevronDown
                    size={16}
                    className={
                      openDropdown === 'dashboard'
                        ? 'rotate-180 transition-transform duration-200'
                        : 'transition-transform duration-200'
                    }
                  />
                </button>
                {openDropdown === 'dashboard' && (
                  <div className="absolute left-0 top-full z-[120] mt-3 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    {dashboardOptions.map((option) => (
                      <Link
                        key={option}
                        to={dashboardRoutes[option]}
                        onClick={() => setOpenDropdown(null)}
                        className="block w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
                      >
                        {option}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Beats dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('beats')}
                  className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/100 px-4 py-2.5 text-sm text-white transition-colors duration-200 hover:border-[#1ED760]"
                >
                  Beats
                  <ChevronDown
                    size={16}
                    className={
                      openDropdown === 'beats'
                        ? 'rotate-180 transition-transform duration-200'
                        : 'transition-transform duration-200'
                    }
                  />
                </button>
                {openDropdown === 'beats' && (
                  <div className="absolute left-0 top-full z-[120] mt-3 w-56 rounded-[1.25rem] border border-[#262626] bg-[#101010] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    {beatOptions.map((option) => (
                      <button
                        key={option}
                        className="w-full rounded-xl px-4 py-3 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:bg-[#161616] hover:text-white"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Browse dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('browse')}
                  className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/100 px-4 py-2.5 text-sm text-white transition-colors duration-200 hover:border-[#1ED760]"
                >
                  Browse
                  <ChevronDown
                    size={16}
                    className={
                      openDropdown === 'browse'
                        ? 'rotate-180 transition-transform duration-200'
                        : 'transition-transform duration-200'
                    }
                  />
                </button>
                {openDropdown === 'browse' && (
                  <div className="absolute left-0 top-full z-[120] mt-3 w-[320px] rounded-[1.4rem] border border-[#262626] bg-[#101010] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:w-[420px]">
                    <div className="grid gap-5 sm:grid-cols-2">
                      {browseSections.map((section) => (
                        <div key={section.title}>
                          <div className="space-y-2">
                            {section.items.map((item) => (
                              <button
                                key={item}
                                className="w-full rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-[#B3B3B3] transition-colors duration-200 hover:border-[#262626] hover:bg-[#161616] hover:text-white"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Page Content ── */}
        <section className="relative z-0 mx-auto max-w-3xl space-y-5 px-4 pb-16 pt-[11.5rem] sm:px-5 sm:pt-[12rem] lg:px-7">

          {/* ── Page Header ── */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">My Profile</h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Manage your personal details, verification status and payout info.
            </p>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              1. PROFILE PHOTO
          ════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<Camera size={18} />}
            title="Profile Photo"
            subtitle="Upload a clear photo – it appears on your public producer profile."
          >
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="h-[88px] w-[88px] rounded-full object-cover ring-2 ring-[#1ED760]/40"
                  />
                ) : (
                  <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br from-[#1ED760] to-[#7C5CFF] text-2xl font-black text-[#0B0B0B] ring-2 ring-[#1ED760]/30">
                    {getUserInitials(currentUser?.displayName ?? 'User')}
                  </div>
                )}
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-[#262626] bg-[#1a1a1a] text-[#1ED760] transition-colors duration-200 hover:bg-[#252525]"
                >
                  <Camera size={13} />
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-white font-medium">
                  {currentUser?.displayName ?? 'BeatHaven User'}
                </p>
                <p className="text-xs text-[#6B7280]">JPG, PNG or WebP · Max 5 MB</p>
                <button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isPhotoUploading}
                  className="w-fit rounded-xl border border-[#262626] bg-[#161616] px-4 py-2 text-xs font-medium text-[#B3B3B3] transition-all duration-200 hover:border-[#1ED760]/50 hover:text-[#1ED760] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPhotoUploading ? 'Uploading...' : photoPreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                {photoError && (
                  <p className="text-xs text-red-400">{photoError}</p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════
              2. MOBILE VERIFICATION
          ════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<Phone size={18} />}
            title="Mobile Number"
            subtitle="Verified via SMS OTP – required for transactions and withdrawals."
            accent="purple"
          >
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-[0.18em] text-[#6B7280] font-medium">
                    Mobile Number
                  </label>
                  {mobileVerified ? <VerifiedBadge /> : <UnverifiedBadge />}
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 rounded-[0.85rem] border border-[#262626] bg-[#121212] px-4 py-3 text-sm text-[#6B7280] flex-shrink-0">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, ''));
                      setMobileVerified(false);
                      setOtpSent(false);
                      setOtpError('');
                    }}
                    disabled={mobileVerified}
                    placeholder="Enter 10-digit number"
                    className={`flex-1 rounded-[0.85rem] border px-4 py-3 text-sm outline-none transition-all duration-200 ${mobileVerified
                      ? 'border-[#1ED760]/30 bg-[#0B0B0B] text-[#6B7280] cursor-not-allowed'
                      : 'border-[#262626] bg-[#121212] text-white placeholder-[#4B4B4B] focus:border-[#7C5CFF]/60 focus:ring-1 focus:ring-[#7C5CFF]/20'
                      }`}
                  />
                  {!mobileVerified && (
                    <button
                      onClick={handleSendOtp}
                      disabled={otpLoading || otpSent}
                      className="flex-shrink-0 rounded-[0.85rem] bg-[#7C5CFF] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#6D4FF5] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpLoading ? 'Sending…' : otpSent ? 'OTP Sent' : 'Send OTP'}
                    </button>
                  )}
                  {mobileVerified && (
                    <button
                      onClick={() => {
                        setMobileVerified(false);
                        setOtpSent(false);
                        setOtp('');
                        setOtpError('');
                      }}
                      className="flex-shrink-0 rounded-[0.85rem] border border-[#262626] bg-[#161616] px-4 py-3 text-xs font-medium text-[#B3B3B3] transition-all duration-200 hover:border-[#7C5CFF]/40 hover:text-[#7C5CFF]"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>

              {otpSent && !mobileVerified && (
                <div className="flex gap-2 animate-[fade-in-up_0.3s_ease-out_forwards]">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 rounded-[0.85rem] border border-[#262626] bg-[#121212] px-4 py-3 text-sm text-white placeholder-[#4B4B4B] outline-none focus:border-[#7C5CFF]/60 focus:ring-1 focus:ring-[#7C5CFF]/20 tracking-[0.35em]"
                  />
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpVerifying}
                    className="flex-shrink-0 rounded-[0.85rem] bg-[#1ED760] px-4 py-3 text-sm font-semibold text-[#0B0B0B] transition-all duration-200 hover:bg-[#17C955]"
                  >
                    {otpVerifying ? 'Verifying…' : 'Verify'}
                  </button>
                </div>
              )}

              {otpError && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertTriangle size={12} /> {otpError}
                </p>
              )}

              {otpSent && !mobileVerified && (
                <p className="text-[11px] text-[#6B7280]">
                  📩 OTP sent to +91 {mobile}. Didn't receive?{' '}
                  <button
                    onClick={handleSendOtp}
                    className="text-[#7C5CFF] underline underline-offset-2 hover:text-[#9B7FFF]"
                  >
                    Resend
                  </button>
                </p>
              )}
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════
              3. AADHAAR VERIFICATION
          ════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<Fingerprint size={18} />}
            title="Aadhaar Verification"
            subtitle="Verified via DigiLocker – required to receive payouts above ₹10,000."
            accent="blue"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[0.85rem] bg-blue-500/10">
                  <Shield size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">DigiLocker Authentication</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">
                    {aadhaarVerified
                      ? 'Your Aadhaar identity has been confirmed.'
                      : 'Link your DigiLocker to verify your Aadhaar identity.'}
                  </p>
                </div>
                <div className="ml-1">{aadhaarVerified ? <VerifiedBadge /> : <UnverifiedBadge />}</div>
              </div>
              {!aadhaarVerified ? (
                <button
                  onClick={() => {
                    setAadhaarVerified(true);
                    void saveVerificationDetails({ aadhaarVerified: true });
                  }}
                  className="w-full sm:w-auto rounded-[0.85rem] bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(59,130,246,0.25)] transition-all duration-200 hover:shadow-[0_4px_24px_rgba(59,130,246,0.4)] active:scale-95"
                >
                  Verify via DigiLocker
                </button>
              ) : (
                <button
                  onClick={() => {
                    setAadhaarVerified(false);
                    void saveVerificationDetails({ aadhaarVerified: false });
                  }}
                  className="w-full sm:w-auto rounded-[0.85rem] border border-[#262626] bg-[#161616] px-5 py-3 text-sm font-medium text-[#B3B3B3] transition-all duration-200 hover:border-blue-400/40 hover:text-blue-400"
                >
                  Re-verify
                </button>
              )}
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════
              4. FULL NAME & EMAIL
          ════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<User size={18} />}
            title="Full Name & Email"
            subtitle="Your display name can be edited. Email is locked to your sign-up address."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-[0.18em] text-[#6B7280] font-medium">
                    Full Name
                  </label>
                  {!editingName ? (
                    <button
                      onClick={() => { setTempName(displayName); setEditingName(true); }}
                      className="flex items-center gap-1 text-[11px] text-[#1ED760] transition-opacity hover:opacity-80"
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveName}
                        className="flex items-center gap-1 text-[11px] text-[#1ED760] hover:opacity-80"
                      >
                        <Check size={11} /> Save
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        className="flex items-center gap-1 text-[11px] text-[#6B7280] hover:text-white"
                      >
                        <X size={11} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
                {editingName ? (
                  <input
                    type="text"
                    autoFocus
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="rounded-[0.85rem] border border-[#1ED760]/50 bg-[#121212] px-4 py-3 text-sm text-white outline-none ring-1 ring-[#1ED760]/20"
                  />
                ) : (
                  <div className="rounded-[0.85rem] border border-[#262626] bg-[#121212] px-4 py-3 text-sm text-white">
                    {displayName || <span className="text-[#4B4B4B]">Not set</span>}
                  </div>
                )}
              </div>

              {/* Email */}
              <InputField
                label="Email Address"
                value={currentUser?.email ?? ''}
                disabled
                badge={<VerifiedBadge />}
                suffix={<Mail size={14} className="text-[#4B4B4B]" />}
              />
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════
              5. GENDER & DATE OF BIRTH
          ════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<CalendarDays size={18} />}
            title="Gender & Date of Birth"
            subtitle="Used to personalise your experience and for KYC compliance."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Gender */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.18em] text-[#6B7280] font-medium">
                  Gender
                </label>
                <div className="flex gap-2">
                  {(['male', 'female', 'other'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 rounded-[0.85rem] border py-3 text-sm font-medium transition-all duration-200 ${gender === g
                        ? 'border-[#1ED760]/60 bg-[#1ED760]/10 text-[#1ED760]'
                        : 'border-[#262626] bg-[#121212] text-[#6B7280] hover:border-[#1ED760]/30 hover:text-white'
                        }`}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* DOB */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-[0.18em] text-[#6B7280] font-medium">
                  Date of Birth
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-[0.85rem] border border-[#262626] bg-[#121212] px-4 py-3 text-sm text-white outline-none focus:border-[#1ED760]/60 focus:ring-1 focus:ring-[#1ED760]/20 [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ═══════════════════════════════════════════════════════════
              6. BILLING ADDRESS
          ════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<Building2 size={18} />}
            title="Billing Address"
            subtitle="Used on invoices and for tax compliance. Enter your current residential address."
            accent="purple"
          >
            <div className="space-y-3">
              <InputField
                label="Street Address"
                value={billingAddress}
                onChange={setBillingAddress}
                placeholder="House / Flat no., Street, Colony"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <InputField
                  label="City"
                  value={billingCity}
                  onChange={setBillingCity}
                  placeholder="Mumbai"
                />
                <InputField
                  label="State"
                  value={billingState}
                  onChange={setBillingState}
                  placeholder="Maharashtra"
                />
                <InputField
                  label="PIN Code"
                  value={billingPin}
                  onChange={setBillingPin}
                  placeholder="400001"
                  type="text"
                />
              </div>
            </div>
          </SectionCard>

          {/* ── Visual Separator ── */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-[#1E1E1E]" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#3B3B3B] font-medium">
              Payout & Banking
            </span>
            <div className="flex-1 h-px bg-[#1E1E1E]" />
          </div>

          {/* ═══════════════════════════════════════════════════════════
              7. PAYOUT BANK DETAILS
          ════════════════════════════════════════════════════════════ */}
          <SectionCard
            icon={<CreditCard size={18} />}
            title="Payout Bank Details"
            subtitle="Earnings are transferred to this account. Details are encrypted and secure."
            accent="purple"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-[0.9rem] border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">
                <FileText size={14} className="text-yellow-400 flex-shrink-0" />
                <p className="text-xs text-yellow-300/80 leading-relaxed">
                  Funds will only be released after Aadhaar verification.
                </p>
              </div>

              <InputField
                label="Account Holder Name"
                value={accountName}
                onChange={setAccountName}
                placeholder="As per bank records"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <InputField
                  label="Account Number"
                  value={accountNumber}
                  onChange={setAccountNumber}
                  placeholder="XXXXXXXXXXXXXXXXXX"
                  type="password"
                />
                <InputField
                  label="IFSC Code"
                  value={ifscCode}
                  onChange={(v) => setIfscCode(v.toUpperCase())}
                  placeholder="e.g. SBIN0001234"
                />
              </div>

              <button
                onClick={handleSaveProfileChanges}
                disabled={profileSaveLoading}
                className="mt-1 w-full rounded-[0.9rem] bg-gradient-to-r from-[#7C5CFF] to-[#5B37E6] py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(124,92,255,0.25)] transition-all duration-200 hover:shadow-[0_4px_32px_rgba(124,92,255,0.4)] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {profileSaveLoading ? 'Saving...' : 'Save Bank Details'}
              </button>
            </div>
          </SectionCard>

          {/* ── Save All Footer ── */}
          <div className="pt-2 pb-4 flex justify-center">
            <button
              onClick={handleSaveProfileChanges}
              disabled={profileSaveLoading}
              className="rounded-[1rem] bg-gradient-to-r from-[#1ED760] to-[#17C955] px-10 py-4 text-sm font-bold text-[#0B0B0B] shadow-[0_4px_24px_rgba(30,215,96,0.3)] transition-all duration-200 hover:shadow-[0_4px_36px_rgba(30,215,96,0.45)] active:scale-[0.99] tracking-wide disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {profileSaveLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
          {profileSaveError && (
            <p className="text-center text-sm text-red-400 pb-2">{profileSaveError}</p>
          )}
          {profileSaveMessage && !profileSaveError && (
            <p className="text-center text-sm text-[#1ED760] pb-2">{profileSaveMessage}</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;
