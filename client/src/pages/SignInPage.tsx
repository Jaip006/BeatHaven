import React, { useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { authService } from '../utils/api';
import { saveAuthSession } from '../utils/auth';
import { getDefaultDashboardPath, type DashboardRole } from '../utils/dashboard';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reason = new URLSearchParams(location.search).get('reason');
  const sessionExpiredMessage =
    reason === 'session_expired'
      ? 'Your session expired after 1 hour of inactivity. Please sign in again.'
      : '';

  const getApiErrorMessage = (apiError: unknown, fallback: string) => {
    if (axios.isAxiosError(apiError)) {
      if (!apiError.response) {
        return 'Cannot reach the server. If you are running locally, start the backend and use VITE_API_URL=http://localhost:8000.';
      }
      return apiError.response?.data?.message ?? fallback;
    }

    return fallback;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      const response = await authService.login({ email, password });
      const accessToken = response.data?.data?.accessToken as string | undefined;
      const user = response.data?.data?.user;
      const role = response.data?.data?.user?.role as DashboardRole | undefined;

      if (accessToken && user) {
        saveAuthSession({ accessToken, user });
      }

      navigate(getDefaultDashboardPath(role));
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'Unable to sign in right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <main className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 animated-gradient opacity-70" />
        <div className="absolute top-24 left-[-8rem] h-80 w-80 rounded-full bg-[#1ED760]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-[-8rem] h-80 w-80 rounded-full bg-[#7C5CFF]/10 blur-[120px] pointer-events-none" />

        <section className="relative min-h-screen max-w-7xl mx-auto px-4 sm:px-5 lg:px-7 py-10 sm:py-14 flex items-center">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#121212]/80 px-4 py-2 text-sm text-[#B3B3B3]">
                <ShieldCheck size={14} className="text-[#1ED760]" />
                <span>Secure access for artists and producers</span>
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                Sign in and get
                <span className="gradient-text"> back to the session.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-[#B3B3B3]">
                Pick up where you left off, manage licenses, and keep your music workflow moving
                inside the same BeatHaven universe.
              </p>
            </div>

            <div className="glass rounded-[2rem] border border-[#262626] p-6 sm:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.3em] text-[#1ED760]">Welcome</p>
                <h2 className="mt-3 text-3xl font-bold text-white">Sign in to BeatHaven</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3]">
                  Use your email and password to access your dashboard.
                </p>
              </div>

              {sessionExpiredMessage ? (
                <div className="mb-5 rounded-2xl border border-[#6a4a12] bg-[#2a1f0f] px-4 py-3 text-sm text-[#ffd89b]">
                  {sessionExpiredMessage}
                </div>
              ) : null}

              {error ? (
                <div className="mb-5 rounded-2xl border border-[#5a1f28] bg-[#2a1015] px-4 py-3 text-sm text-[#ffb4c0]">
                  {error}
                </div>
              ) : null}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#B3B3B3]">Email</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 focus-within:border-[#1ED760] transition-colors duration-200">
                    <Mail size={18} className="text-[#6B7280]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="artist@beathaven.com"
                      className="w-full bg-transparent text-white outline-none placeholder:text-[#6B7280]"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#B3B3B3]">Password</span>
                  <div className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#121212] px-4 py-3 focus-within:border-[#7C5CFF] transition-colors duration-200">
                    <LockKeyhole size={18} className="text-[#6B7280]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-transparent text-white outline-none placeholder:text-[#6B7280]"
                      required
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

                <div className="flex items-center justify-between gap-4 text-sm">
                  <label className="flex items-center gap-2 text-[#B3B3B3]">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#262626] bg-[#121212]" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="text-[#1ED760] hover:text-[#22FFA3] transition-colors duration-200">
                    Forgot password?
                  </a>
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-[#262626]" />
                <span className="text-xs uppercase tracking-[0.25em] text-[#6B7280]">or</span>
                <div className="h-px flex-1 bg-[#262626]" />
              </div>

              <p className="mt-6 text-center text-sm text-[#6B7280]">
                New here?{' '}
                <Link to="/sign-up" className="text-white hover:text-[#1ED760] transition-colors duration-200">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SignInPage;
