'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScanSummaryDto } from '@ai-detector/shared-types';
import { ScanDetailModal } from './scan-detail-modal';
import { DeleteDialog } from './delete-dialog';
import {
  History,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  PlusCircle,
  FileQuestion,
  Loader2,
} from 'lucide-react';

export function HistoryTable() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 10;
  const [verdictFilter, setVerdictFilter] = useState<'ALL' | 'AI' | 'INCONCLUSIVE' | 'HUMAN'>('ALL');

  const [inspectingScanId, setInspectingScanId] = useState<string | null>(null);
  const [deletingScanId, setDeletingScanId] = useState<string | null>(null);

  // Query scans
  const { data, isLoading, isError } = useQuery<{
    scans: ScanSummaryDto[];
    total: number;
  }>({
    queryKey: ['scans', page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/v1/scans?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Failed to retrieve history');
      return res.json();
    },
  });

  // Delete scan mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/scans/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete scan.');
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      setDeletingScanId(null);
      if (inspectingScanId === deletedId) {
        setInspectingScanId(null);
      }
    },
  });

  const allScans = data?.scans || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Auto-clamp page if items deleted on last page
  if (page > totalPages && totalPages > 0) {
    setPage(totalPages);
  }

  // Filtered list
  const filteredScans = allScans.filter((s) => {
    if (verdictFilter === 'ALL') return true;
    return s.verdict === verdictFilter;
  });

  const getVerdictBadge = (verdict: string | null | undefined, probability: number | null | undefined) => {
    if (!verdict) {
      return (
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700">
          Pending
        </span>
      );
    }

    const pct = probability !== null && probability !== undefined ? Math.round(probability * 100) : 0;

    if (verdict === 'AI') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Likely AI ({pct}%)
        </span>
      );
    }
    if (verdict === 'INCONCLUSIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Mixed ({pct}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Likely Human ({pct}%)
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Controls & Filter Bar */}
      <div className="p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white">Analysis History</h2>
          <span className="text-xs font-semibold text-slate-500 ml-1">
            ({total.toLocaleString()} total scans)
          </span>
        </div>

        {/* Verdict Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setVerdictFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              verdictFilter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setVerdictFilter('AI')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              verdictFilter === 'AI'
                ? 'bg-red-500/20 text-red-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI
          </button>
          <button
            type="button"
            onClick={() => setVerdictFilter('INCONCLUSIVE')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              verdictFilter === 'INCONCLUSIVE'
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mixed
          </button>
          <button
            type="button"
            onClick={() => setVerdictFilter('HUMAN')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              verdictFilter === 'HUMAN'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Human
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-xs text-slate-400">Loading your scan records...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="p-8 text-center text-xs text-red-400">
          Failed to load scan records. Please refresh the page.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && allScans.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500">
            <FileQuestion className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No Scans Recorded</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              You haven&apos;t analyzed any documents yet. Paste text in the scanner to begin.
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Start Your First Scan</span>
          </Link>
        </div>
      )}

      {/* Table Data */}
      {!isLoading && !isError && allScans.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/20">
                <th className="py-3.5 px-4 sm:px-6">Document Snippet</th>
                <th className="py-3.5 px-4">Verdict</th>
                <th className="py-3.5 px-4">Length</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
              {filteredScans.map((scan) => (
                <tr
                  key={scan.id}
                  className="hover:bg-slate-800/40 transition group cursor-pointer"
                  onClick={() => setInspectingScanId(scan.id)}
                >
                  <td className="py-4 px-4 sm:px-6 max-w-xs sm:max-w-md">
                    <p className="text-slate-200 line-clamp-2 break-words font-medium">
                      {scan.snippet}
                    </p>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap">
                    {getVerdictBadge(scan.verdict, scan.overallProbability)}
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400">
                    <div>{scan.wordCount.toLocaleString()} words</div>
                    <div className="text-[11px] text-slate-500">
                      {scan.characterCount.toLocaleString()} chars
                    </div>
                  </td>

                  <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-400">
                    {new Date(scan.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>

                  <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setInspectingScanId(scan.id)}
                        className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition"
                        title="Inspect full analysis"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingScanId(scan.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                        title="Delete scan permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {!isLoading && !isError && allScans.length > 0 && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <div>
            Page <span className="font-semibold text-slate-200">{page}</span> of{' '}
            <span className="font-semibold text-slate-200">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Inspection Modal */}
      <ScanDetailModal
        scanId={inspectingScanId}
        onClose={() => setInspectingScanId(null)}
        onDeleteRequest={(id) => {
          setInspectingScanId(null);
          setDeletingScanId(id);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={!!deletingScanId}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => {
          if (deletingScanId) deleteMutation.mutate(deletingScanId);
        }}
        onCancel={() => setDeletingScanId(null)}
      />
    </div>
  );
}
