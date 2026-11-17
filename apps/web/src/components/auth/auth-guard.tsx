'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      const returnUrl = encodeURIComponent(pathname || '/history');
      router.replace(`/auth/sign-in?returnUrl=${returnUrl}`);
    }
  }, [session, isPending, router, pathname]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-8 h-8 text-cyan-400 animate-pulse" />
          <span className="font-bold text-lg text-slate-100 tracking-wider">
            AI DETECTOR
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Verifying secure session...</span>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null; // Don't render protected children while redirecting
  }

  return <>{children}</>;
}
