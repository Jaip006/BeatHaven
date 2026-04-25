import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, User2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { authService } from '../utils/api';

type SignUpFormData = {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'buyer' | 'seller';
};

type VerificationPhase = 'form' | 'otp' | 'verified';

const initialFormData: SignUpFormData = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'buyer',
};

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef<number | null>(null);
  const [phase, setPhase] = useState<VerificationPhase>('form');
  const [formData, setFormData] = useState<SignUpFormData>(initialFormData);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const getApiErrorMessage = (apiError: unknown, fallback: string) => {
    if (axios.isAxiosError(apiError)) {
      return apiError.response?.data?.message ?? fallback;
    }

    return fallback;
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.register({
        displayName: formData.displayName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });

      setPhase('otp');
      setSuccessMessage(`We sent a 6-digit OTP to ${formData.email}.`);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to create your account right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit OTP sent to your email.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.verifyEmail({
        email: formData.email,
        otp: otp.trim(),
      });

      setPhase('verified');
      setSuccessMessage('Email verified successfully. Redirecting to sign in...');
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
      redirectTimeoutRef.current = window.setTimeout(() => navigate('/sign-in'), 1200);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to verify OTP.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSuccessMessage('');

    try {
      setIsResending(true);
      await authService.resendOtp({ email: formData.email });
      setSuccessMessage(`A fresh OTP was sent to ${formData.email}.`);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to resend OTP right now.'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-20 right-[-8rem] h-80 w-80 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-[-8rem] h-80 w-80 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />

        <section className="relative min-h-screen max-w-7xl mx-auto px-4 sm:px-5 lg:px-7 py-7 sm:py-14 flex items-center">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="hidden max-w-2xl sm:block">

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                Create account and
                <span className="gradient-text"> launch your next drop.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-[#B3B3B3]">
                Join producers and artists in one focused workspace for beats.
              </p>
            </div>

            <div className="glass rounded-[2rem] border border-[#262626] p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.3em] text-[#1ED760]">
                  {phase === 'otp' ? 'Verify your email' : phase === 'verified' ? 'All set' : ''}
                </p>
                <h2 className="mt-1 text-3xl font-bold text-white">
                  {phase === 'form'
                    ? 'Create your account'
                    : phase === 'otp'
                      ? 'Enter your verification OTP'
                      : 'Your account is verified'}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">
                  {phase === 'form'
                    ? 'Set up your profile and start exploring beats in a few seconds.'
                    : phase === 'otp'
                      ? ''
                      : 'You can now sign in and continue into BeatHaven.'}
                </p>
              </div>

              {error ? (
                <div className="mb-5 rounded-2xl border border-[#5a1f28] bg-[#2a1015] px-4 py-3 text-sm text-[#ffb4c0]">
                  {error}
                </div>
              ) : null}

              {successMessage ? (
                <div className="mb-5 rounded-2xl border border-[#1f4d36] bg-[#0f241a] px-4 py-3 text-sm text-[#93f5bf]">
                  {successMessage}
                </div>
              ) : null}

              {phase === 'form' ? (
                <form className="space-y-5" onSubmit={handleRegisterSubmit}>
                  <label className="block">
                    <div className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 focus-within:border-[#1ED760] transition-colors duration-200">
                      <User2 size={18} className="text-[#6B7280]" />
                      <input
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="Your Full Name"
                        className="w-full bg-transparent text-white outline-none placeholder:text-[#6B7280]"
                        required
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 focus-within:border-[#1ED760] transition-colors duration-200">
                      <Mail size={18} className="text-[#6B7280]" />
                      <input
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        type="email"
                        placeholder="Your Email"
                        className="w-full bg-transparent text-white outline-none placeholder:text-[#6B7280]"
                        required
                      />
                    </div>
                  </label>

                  <label className="block">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 text-white outline-none focus:border-[#1ED760] transition-colors duration-200"
                    >
                      <option value="buyer">Buyer/Artist</option>
                      <option value="seller">Seller/Producer</option>
                    </select>
                  </label>

                  <label className="block">
                    <div className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 focus-within:border-[#7C5CFF] transition-colors duration-200">
                      <LockKeyhole size={18} className="text-[#6B7280]" />
                      <input
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        className="w-full bg-transparent text-white outline-none placeholder:text-[#6B7280]"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="text-[#6B7280] hover:text-white transition-colors duration-200"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>

                  <label className="block">
                    <div className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 focus-within:border-[#7C5CFF] transition-colors duration-200">
                      <ShieldCheck size={18} className="text-[#6B7280]" />
                      <input
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        className="w-full bg-transparent text-white outline-none placeholder:text-[#6B7280]"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="text-[#6B7280] hover:text-white transition-colors duration-200"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl bg-[#121212]/70 px-4 py-3 text-sm text-[#B3B3B3] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-[#262626] bg-[#121212] accent-[#1ED760]"
                    />
                    <span>
                      I have read and agree to all the{' '}
                      <Link to="/seller-agreement" className="underline text-white hover:text-[#1ED760] transition-colors duration-200" target="_blank">
                        terms and conditions
                      </Link>.
                    </span>
                  </label>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={
                      isSubmitting ||
                      !termsAccepted ||
                      !formData.displayName.trim() ||
                      !formData.email.trim() ||
                      !formData.password ||
                      !formData.confirmPassword
                    }
                  >
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              ) : phase === 'otp' ? (
                <form className="space-y-5" onSubmit={handleVerifyOtp}>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#B3B3B3]">Email</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3">
                      <Mail size={18} className="text-[#6B7280]" />
                      <input
                        type="email"
                        value={formData.email}
                        className="w-full bg-transparent text-[#B3B3B3] outline-none"
                        disabled
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-[#B3B3B3]">OTP</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 focus-within:border-[#1ED760] transition-colors duration-200">
                      <ShieldCheck size={18} className="text-[#6B7280]" />
                      <input
                        value={otp}
                        onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                        type="text"
                        inputMode="numeric"
                        placeholder="Enter 6-digit OTP"
                        className="w-full bg-transparent text-white outline-none placeholder:text-[#6B7280] tracking-[0.35em]"
                        required
                      />
                    </div>
                  </label>

                  <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                  </Button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending || isSubmitting}
                    className="w-full text-sm text-[#B3B3B3] hover:text-[#1ED760] transition-colors duration-200 disabled:opacity-50"
                  >
                    {isResending ? 'Sending a new OTP...' : 'Resend OTP'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-[#B3B3B3]">
                    Your email is verified. You can continue to sign in now.
                  </p>
                  <Button type="button" variant="primary" size="lg" className="w-full" onClick={() => navigate('/sign-in')}>
                    Continue to Sign In
                  </Button>
                </div>
              )}

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#262626]" />
                <span className="text-xs uppercase tracking-[0.25em] text-[#6B7280]">or</span>
                <div className="h-px flex-1 bg-[#262626]" />
              </div>

              <p className="mt-6 text-center text-sm text-[#6B7280]">
                Already have an account?{' '}
                <Link to="/sign-in" className="text-white hover:text-[#1ED760] transition-colors duration-200">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );

};

export default SignUpPage;
