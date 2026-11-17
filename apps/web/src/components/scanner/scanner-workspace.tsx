'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  NormalizedDetectionResult,
  ScanDetailDto,
} from '@ai-detector/shared-types';
import { authClient } from '@/lib/auth-client';
import {
  countCodePoints,
  countWords,
  SAMPLE_AI_TEXT,
  SAMPLE_HUMAN_TEXT,
} from '@/lib/text-counter';
import { ConfidenceGauge } from './confidence-gauge';
import { SentenceHeatmap } from './sentence-heatmap';
import {
  AlertTriangle,
  CheckCircle,
  ClipboardPaste,
  FileText,
  Flame,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

export function ScannerWorkspace() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  const charLimit = isAuthenticated ? 6000 : 3000;
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [detectionResult, setDetectionResult] =
    useState<NormalizedDetectionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const charCount = countCodePoints(text);
  const wordCount = countWords(text);
  const isTooShort = charCount < 300;
  const isAdvisoryZone = charCount >= 300 && charCount < 500;
  const isTooLong = charCount > charLimit;
  const isValid = !isTooShort && !isTooLong;

  // Scan Mutation
  const scanMutation = useMutation({
    mutationFn: async (submittedText: string) => {
      setErrorMessage(null);

      const endpoint = isAuthenticated ? '/api/v1/scans' : '/api/v1/scans/anonymous';
      const bodyPayload = isAuthenticated
        ? { text: submittedText, idempotencyKey: crypto.randomUUID() }
        : { text: submittedText };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const message = errorData?.message || 'Failed to analyze text.';
        const status = res.status;

        const err = new Error(message) as Error & { status?: number };
        err.status = status;
        throw err;
      }

      if (isAuthenticated) {
        const scanDetail = (await res.json()) as ScanDetailDto;
        return scanDetail.result as NormalizedDetectionResult;
      } else {
        return (await res.json()) as NormalizedDetectionResult;
      }
    },
    onSuccess: (result) => {
      setDetectionResult(result);
      setActiveTab('results');
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['scans'] });
        queryClient.invalidateQueries({ queryKey: ['usage'] });
      }
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    },
  });

  const handleAnalyze = () => {
    if (!isValid || scanMutation.isPending) return;
    scanMutation.mutate(text);
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setText(clipboardText);
      }
    } catch {
      // Browser permissions may block automated clipboard read
    }
  };

  const handleClear = () => {
    setText('');
    setDetectionResult(null);
    setErrorMessage(null);
    setActiveTab('input');
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-6">
      {/* Workspace Navigation Tabs (Shown when results exist) */}
      {detectionResult && (
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-1.5 shadow-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'results'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Analysis & Heatmap</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('input')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'input'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Edit Text</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs sm:text-sm text-red-300 flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-200">Analysis Halted</p>
            <p className="mt-0.5 text-red-300/90">{errorMessage}</p>
            {errorMessage.includes('Guest daily limit') && (
              <div className="mt-2">
                <Link
                  href="/auth/sign-in"
                  className="inline-flex items-center font-bold text-cyan-400 hover:text-cyan-300 underline"
                >
                  Sign in or create a free account &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results View */}
      {activeTab === 'results' && detectionResult ? (
        <div className="flex flex-col space-y-6 animate-in fade-in duration-300">
          <ConfidenceGauge
            overallProbability={detectionResult.overallProbability}
            aiFraction={detectionResult.aiFraction}
            verdict={detectionResult.verdict}
            latencyMs={detectionResult.latencyMs}
            sentenceCount={detectionResult.sentenceScores.length}
            advisory={detectionResult.advisory}
          />

          <SentenceHeatmap
            originalText={text}
            sentenceScores={detectionResult.sentenceScores}
          />
        </div>
      ) : (
        /* Textarea Input View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-left shadow-2xl relative flex flex-col space-y-4">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                {isAuthenticated ? 'Registered Workspace' : 'Quick Scan (Guest Access)'}
              </span>
              <span className="text-xs text-slate-500">
                · Max {charLimit.toLocaleString()} characters
              </span>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePaste}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white rounded-lg transition inline-flex items-center gap-1.5"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-cyan-400" />
                <span>Paste</span>
              </button>

              <button
                type="button"
                onClick={() => setText(SAMPLE_AI_TEXT)}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white rounded-lg transition inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>Sample AI</span>
              </button>

              <button
                type="button"
                onClick={() => setText(SAMPLE_HUMAN_TEXT)}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white rounded-lg transition inline-flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sample Human</span>
              </button>

              {text && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                  title="Clear text"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here to analyze for AI-generated patterns (minimum 300 characters)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm sm:text-base text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y transition leading-relaxed font-sans"
              disabled={scanMutation.isPending}
            />
          </div>

          {/* Real-Time Live Validation Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3 text-xs w-full sm:w-auto">
              {/* Character & Word Readout */}
              <div
                className={`font-semibold ${
                  isTooShort
                    ? 'text-amber-400'
                    : isTooLong
                      ? 'text-red-400'
                      : 'text-slate-400'
                }`}
              >
                {charCount.toLocaleString()} / {charLimit.toLocaleString()} characters ·{' '}
                {wordCount.toLocaleString()} words
              </div>

              {/* Status Indicator Badges */}
              {isTooShort && text.length > 0 && (
                <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {300 - charCount} more needed
                </span>
              )}

              {isAdvisoryZone && (
                <span className="text-[11px] text-yellow-300 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 inline-flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>Low confidence under 500 chars</span>
                </span>
              )}

              {isTooLong && (
                <span className="text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  Exceeds limit by {charCount - charLimit}
                </span>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={!isValid || scanMutation.isPending}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
                !isValid || scanMutation.isPending
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/20 cursor-pointer'
              }`}
            >
              {scanMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Analyzing Linguistic Patterns...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Analyze Text</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
