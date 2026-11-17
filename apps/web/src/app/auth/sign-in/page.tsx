'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Open-redirect defense: strictly enforce relative local paths
  const rawReturnUrl = searchParams.get('returnUrl');
  const safeReturnUrl =
    rawReturnUrl && rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//')
      ? rawReturnUrl
      : '/history';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        setErrorMessage(res.error.message || 'Invalid email or password.');
        setIsLoading(false);
      } else {
        router.push(safeReturnUrl);
      }
    } catch {
      setErrorMessage('Failed to connect to authentication server. Please retry.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
      <div className="flex flex-col items-center text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 group mb-3">
          <ShieldCheck className="w-8 h-8 text-cyan-400 group-hover:scale-105 transition-transform" />
          <span className="font-bold text-xl text-white tracking-wider">AI DETECTOR</span>
        </Link>
        <h1 className="text-xl font-bold text-white">Sign In to Your Account</h1>
        <p className="text-xs text-slate-400 mt-1">
          Access your saved scan history and 15,000 monthly characters
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
        Don&apos;t have an account yet?{' '}
        <Link href="/auth/sign-up" className="font-semibold text-cyan-400 hover:text-cyan-300 underline">
          Create account free
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-xs text-slate-500">Loading sign in...</div>}>
        <SignInContent />
      </Suspense>
    </main>
  );
}
