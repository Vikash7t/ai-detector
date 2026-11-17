'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScanDetailDto } from '@ai-detector/shared-types';
import { ConfidenceGauge } from '../scanner/confidence-gauge';
import { SentenceHeatmap } from '../scanner/sentence-heatmap';
import {
  X,
  Calendar,
  FileText,
  Copy,
  Check,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface ScanDetailModalProps {
  scanId: string | null;
  onClose: () => void;
  onDeleteRequest: (scanId: string) => void;
}

export function ScanDetailModal({
  scanId,
  onClose,
  onDeleteRequest,
}: ScanDetailModalProps) {
  const [copied, setCopied] = useState(false);

  const {
    data: scan,
    isLoading,
    isError,
  } = useQuery<ScanDetailDto>({
    queryKey: ['scan', scanId],
    queryFn: async () => {
      if (!scanId) throw new Error('No scan selected');
      const res = await fetch(`/api/v1/scans/${scanId}`);
      if (!res.ok) throw new Error('Failed to retrieve scan details.');
      return res.json();
    },
    enabled: !!scanId,
  });

  if (!scanId) return null;

  const handleCopy = async () => {
    if (!scan?.submittedText) return;
    try {
      await navigator.clipboard.writeText(scan.submittedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-950/60 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Scan Details
            </h3>

            {scan && (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(scan.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span>·</span>
                <span>{scan.characterCount.toLocaleString()} chars</span>
                <span>·</span>
                <span>{scan.wordCount.toLocaleString()} words</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <span className="text-xs text-slate-400">Loading analysis and sentence heatmap...</span>
            </div>
          )}

          {isError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Failed to load scan details. It may have been deleted or expired.</span>
            </div>
          )}

          {scan && scan.result && (
            <>
              <ConfidenceGauge
                overallProbability={scan.result.overallProbability}
                aiFraction={scan.result.aiFraction}
                verdict={scan.result.verdict}
                latencyMs={scan.result.latencyMs}
                sentenceCount={scan.result.sentenceScores?.length || 0}
                advisory={scan.result.advisory}
              />

              <SentenceHeatmap
                originalText={scan.submittedText}
                sentenceScores={scan.result.sentenceScores || []}
              />
            </>
          )}

          {scan && !scan.result && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
              This scan status is {scan.status}. No sentence scores were recorded.
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        {scan && (
          <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4 flex-shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl transition flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onDeleteRequest(scan.id)}
              className="px-3.5 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Scan</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
