'use client';

import React from 'react';
import { CategoricalVerdict } from '@ai-detector/shared-types';
import { AlertCircle, CheckCircle2, HelpCircle, Zap } from 'lucide-react';

interface ConfidenceGaugeProps {
  overallProbability: number;
  aiFraction: number;
  verdict: CategoricalVerdict;
  latencyMs: number;
  sentenceCount: number;
  advisory?: string;
}

export function ConfidenceGauge({
  overallProbability,
  aiFraction,
  verdict,
  latencyMs,
  sentenceCount,
  advisory,
}: ConfidenceGaugeProps) {
  const percentage = Math.round(overallProbability * 100);
  const aiFractionPercentage = Math.round(aiFraction * 100);

  // SVG circular gauge geometry
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let theme = {
    color: '#10b981', // emerald
    gradientId: 'gaugeEmerald',
    label: 'Highly Likely Human',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    description: 'Text exhibits natural human stylistic variation and low machine perplexity markers.',
  };

  if (verdict === 'AI') {
    theme = {
      color: '#ef4444', // red
      gradientId: 'gaugeRed',
      label: 'Highly Likely AI',
      badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
      icon: <AlertCircle className="w-5 h-5 text-red-400" />,
      description: 'Text exhibits strong repetitive syntactic structures and statistical AI markers.',
    };
  } else if (verdict === 'INCONCLUSIVE') {
    theme = {
      color: '#f59e0b', // amber
      gradientId: 'gaugeAmber',
      label: 'Inconclusive / Mixed',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: <HelpCircle className="w-5 h-5 text-amber-400" />,
      description: 'Mixed patterns detected. Text may contain both human revisions and AI-generated passages.',
    };
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Gauge Graphic */}
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 130 130">
              <defs>
                <linearGradient id="gaugeEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="gaugeAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="gaugeRed" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>

              {/* Background Track */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />

              {/* Animated Progress Arc */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke={`url(#${theme.gradientId})`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Percentage Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white tracking-tight">
                {percentage}%
              </span>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                AI Probability
              </span>
            </div>
          </div>
        </div>

        {/* Verdict & Details */}
        <div className="md:col-span-7 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${theme.badgeClass}`}>
              {theme.icon}
              <span>{theme.label}</span>
            </div>
            <div className="text-xs text-slate-500 inline-flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>{latencyMs}ms</span>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {theme.description}
          </p>

          {advisory && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{advisory}</span>
            </div>
          )}

          {/* Metric Sub-cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                AI Content Fraction
              </span>
              <div className="text-lg font-bold text-slate-100 mt-0.5">
                {aiFractionPercentage}%
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">
                Sentences Evaluated
              </span>
              <div className="text-lg font-bold text-slate-100 mt-0.5">
                {sentenceCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
