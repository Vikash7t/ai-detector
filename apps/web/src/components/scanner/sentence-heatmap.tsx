'use client';

import React, { useState } from 'react';
import { NormalizedSentenceScore } from '@ai-detector/shared-types';
import { Info, Sparkles, X } from 'lucide-react';

interface SentenceHeatmapProps {
  originalText: string;
  sentenceScores: NormalizedSentenceScore[];
}

export function SentenceHeatmap({
  originalText,
  sentenceScores,
}: SentenceHeatmapProps) {
  const [selectedSentence, setSelectedSentence] =
    useState<NormalizedSentenceScore | null>(null);

  // If no sentence breakdown is available, render clean pre-wrapped text
  if (!sentenceScores || sentenceScores.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
          {originalText}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col space-y-6">
      {/* Legend & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Sentence-Level Detection Heatmap
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click on any highlighted sentence to inspect statistical confidence.
          </p>
        </div>

        {/* Legend Pills */}
        <div className="flex items-center gap-3 text-xs">
          <div className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-400/40" />
            <span className="text-slate-300">Likely AI (&ge;80%)</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40" />
            <span className="text-slate-300">Mixed (50-79%)</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600" />
            <span className="text-slate-400">Human (&lt;50%)</span>
          </div>
        </div>
      </div>

      {/* Selected Sentence Inspector Card */}
      {selectedSentence && (
        <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl relative shadow-lg flex flex-col space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Sentence #{selectedSentence.sentenceOrder + 1} Inspection
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  selectedSentence.highlightCategory === 'RED'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : selectedSentence.highlightCategory === 'YELLOW'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {Math.round(selectedSentence.score * 100)}% AI Probability
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSentence(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 italic border-l-2 border-slate-700 pl-3 py-1">
            &ldquo;{selectedSentence.sentenceText}&rdquo;
          </p>

          <p className="text-[11px] text-slate-400">
            {selectedSentence.highlightCategory === 'RED'
              ? 'Strong statistical repetition and low perplexity indicates a high likelihood of automated generation.'
              : selectedSentence.highlightCategory === 'YELLOW'
                ? 'Moderate markers detected. This sentence may be a product of machine drafting with human restructuring.'
                : 'Natural linguistic diversity and sentence cadence characteristic of human writing.'}
          </p>
        </div>
      )}

      {/* Formatted Text Body with Sentence Spans (Preserves newlines and spaces) */}
      <div className="p-4 sm:p-6 bg-slate-950/80 border border-slate-800/80 rounded-xl text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
        {sentenceScores.map((sentence) => {
          let highlightClasses = 'transition-colors rounded px-1 py-0.5 my-0.5 cursor-pointer';

          if (sentence.highlightCategory === 'RED') {
            highlightClasses +=
              ' bg-red-500/20 text-red-100 border-b-2 border-red-500/60 hover:bg-red-500/30';
          } else if (sentence.highlightCategory === 'YELLOW') {
            highlightClasses +=
              ' bg-amber-500/20 text-amber-100 border-b-2 border-amber-500/60 hover:bg-amber-500/30';
          } else {
            highlightClasses +=
              ' text-slate-200 hover:bg-slate-800/60 border-b border-transparent';
          }

          if (selectedSentence?.sentenceOrder === sentence.sentenceOrder) {
            highlightClasses += ' ring-2 ring-cyan-400/80';
          }

          return (
            <span
              key={sentence.sentenceOrder}
              onClick={() => setSelectedSentence(sentence)}
              className={highlightClasses}
              title={`Click to inspect (AI Probability: ${Math.round(sentence.score * 100)}%)`}
            >
              {sentence.sentenceText}{' '}
            </span>
          );
        })}
      </div>

      {/* Advisory Footer */}
      <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-800/60">
        <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span>
          AI detection is statistical and probabilistic. Sentences highlighted in red should be reviewed in context.
        </span>
      </div>
    </div>
  );
}
