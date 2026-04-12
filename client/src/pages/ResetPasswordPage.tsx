import React, { useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { authService } from '../utils/api';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const getApiErrorMessage = (apiError: unknown, fallback: string) => {
    if (axios.isAxiosError(apiError)) {
      if (!apiError.response) {
        return 'Cannot reach the server. If you are running locally, start the backend and use VITE_API_URL=http://localhost:8000.';
      }
      return apiError.response?.data?.message ?? fallback;
    }

    return fallback;
  };

  const handleRequestResetOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setIsRequestingOtp(true);
      await authService.forgotPassword({ email: normalizedEmail });
      setEmail(normalizedEmail);
      setMessage('');
      setStep('verify');
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to send reset OTP right now.'));
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyResetOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const response = await authService.verifyResetOtp({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      setMessage(
        response.data?.message ?? 'OTP verified. You can now enter your new password.'
      );
      setStep('reset');
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to verify OTP right now.'));
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      setIsResettingPassword(true);
      const response = await authService.resetPassword({
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        newPassword,
      });
      setMessage(
        response.data?.message ?? 'Password reset successful. You can now sign in.'
      );
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setStep('success');
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to reset password right now.'));
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-24 left-[-8rem] h-80 w-80 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-[-8rem] h-80 w-80 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        <section className="relative min-h-screen max-w-7xl mx-auto px-4 sm:px-5 lg:px-7 py-10 sm:py-14 flex items-center justify-center">
          <div className="w-full max-w-xl glass rounded-[2rem] border border-[#262626] p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white">Reset Password</h1>
              {step !== 'success' ? (
                <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">
                  {step === 'request'
                    ? 'Enter your account email to receive a 6-digit reset OTP.'
                    : step === 'verify'
                      ? 'Enter the OTP sent to your email to continue.'
                      : 'Enter your new password below to reset your password.'}
                </p>
              ) : null}
            </div>

            {error ? (
              <div className="mb-5 rounded-2xl border border-[#5a1f28] bg-[#2a1015] px-4 py-3 text-sm text-[#ffb4c0]">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mb-5 rounded-2xl border border-[#1f4d36] bg-[#0f241a] px-4 py-3 text-sm text-[#93f5bf]">
                {message}
              </div>
            ) : null}

            {step === 'request' ? (
              <form className="space-y-4" onSubmit={handleRequestResetOtp}>
                <label className="block">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email"
                    className="w-full rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 text-white outline-none placeholder:text-[#6B7280] focus:border-[#1ED760]"
                    required
                  />
                </label>

                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isRequestingOtp}>
                  {isRequestingOtp ? 'Sending OTP...' : 'Send Reset OTP'}
                </Button>
              </form>
            ) : step === 'verify' ? (
              <form className="space-y-4" onSubmit={handleVerifyResetOtp}>

                <label className="block">
                  <input
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    inputMode="numeric"
                    className="w-full rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 text-white outline-none placeholder:text-[#6B7280] focus:border-[#1ED760] tracking-[0.25em]"
                    minLength={6}
                    maxLength={6}
                    required
                  />
                </label>

                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isVerifyingOtp}>
                  {isVerifyingOtp ? 'Verifying OTP...' : 'Verify OTP'}
                </Button>
              </form>
            ) : step === 'reset' ? (
              <form className="space-y-4" onSubmit={handleResetPassword}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#B3B3B3]">New Password</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 text-white outline-none placeholder:text-[#6B7280] focus:border-[#1ED760]"
                    minLength={8}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#B3B3B3]">Confirm New Password</span>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    placeholder="Confirm new password"
                    className="w-full rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 text-white outline-none placeholder:text-[#6B7280] focus:border-[#1ED760]"
                    minLength={8}
                    required
                  />
                </label>

                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isResettingPassword}>
                  {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            ) : null}

            {step !== 'success' ? (
              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#262626]" />
                <span className="text-xs uppercase tracking-[0.25em] text-[#6B7280]">or</span>
                <div className="h-px flex-1 bg-[#262626]" />
              </div>
            ) : null}

            <div className="mt-5 flex items-center justify-center text-sm text-[#6B7280]">
              <Link to="/sign-in" className="text-white hover:text-[#1ED760] transition-colors duration-200">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ResetPasswordPage;
