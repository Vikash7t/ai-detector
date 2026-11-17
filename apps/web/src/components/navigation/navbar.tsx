'use client';

import React from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { ShieldCheck, History, LogOut, User } from 'lucide-react';

export function Navbar() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <ShieldCheck className="w-7 h-7 text-cyan-400 group-hover:scale-105 transition-transform" />
          <span className="font-bold text-lg tracking-wider text-slate-100">
            AI DETECTOR
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/history"
                className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-800"
              >
                <History className="w-4 h-4 text-cyan-400" />
                <span>Scan History</span>
              </Link>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                </div>
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                  {user.name || user.email}
                </span>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/sign-in"
                className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="text-xs sm:text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg transition-colors shadow-sm"
              >
                Get Started Free
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
