'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserUsageDto } from '@ai-detector/shared-types';
import { BarChart3, Clock, AlertTriangle } from 'lucide-react';

export function UserQuotaWidget() {
  const { data: usage, isLoading, isError } = useQuery<UserUsageDto>({
    queryKey: ['usage'],
    queryFn: async () => {
      const res = await fetch('/api/v1/usage/me');
      if (!res.ok) throw new Error('Failed to load usage data.');
      return res.json();
    },
    staleTime: 0, // Always reflect fresh usage upon mounting
  });

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-1/3 mb-3" />
        <div className="h-2 bg-slate-800 rounded w-full mb-2" />
        <div className="h-3 bg-slate-800 rounded w-1/4" />
      </div>
    );
  }

  if (isError || !usage) {
    return null;
  }

  const totalConsumed = usage.charactersUsed + usage.charactersReserved;
  const percentage = Math.min(
    100,
    Math.round((totalConsumed / usage.monthlyAllowanceCharacters) * 100),
  );

  let barColor = 'bg-cyan-500';
  if (percentage >= 90) {
    barColor = 'bg-red-500';
  } else if (percentage >= 70) {
    barColor = 'bg-amber-500';
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Monthly Character Allowance
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Free tier allocation resets automatically on the 1st of every month (UTC)
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-300">
            {totalConsumed.toLocaleString()} / {usage.monthlyAllowanceCharacters.toLocaleString()} chars
          </span>
          <span className="text-[11px] font-bold text-slate-500 ml-1.5">
            ({percentage}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
        <div
          className={`h-full ${barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Footer Info & Disclaimers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>
            {usage.charactersRemaining.toLocaleString()} characters remaining in period {usage.periodKey}
          </span>
        </div>

        {percentage >= 90 && (
          <div className="text-amber-400 font-semibold inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Monthly limit almost reached</span>
          </div>
        )}
      </div>
    </div>
  );
}
