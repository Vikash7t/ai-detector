import Link from 'next/link';
import { ShieldCheck, Sparkles, FileText, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-cyan-400" />
            <span className="font-bold text-lg tracking-wider text-slate-100">
              AI DETECTOR
            </span>
          </div>

          <nav className="flex items-center gap-4">
            <Link
              href="/auth/sign-in"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="text-sm font-medium bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-medium mb-6 mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explainable Linguistic AI Analysis</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
          Detect AI Content with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            Sentence-Level Clarity
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Verify text origin with explainable sentence heatmaps and calibrated confidence
          scores. Built for transparency, academic integrity, and responsible AI analysis.
        </p>

        {/* Scanner CTA Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-left shadow-2xl relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Quick Scan (Guest Access)
            </span>
            <span className="text-xs text-slate-500">
              Up to 3,000 characters (~500 words)
            </span>
          </div>

          <textarea
            rows={6}
            placeholder="Paste your text here to analyze for AI-generated patterns (minimum 300 characters)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-y transition"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-800/80">
            <div className="text-xs text-slate-500">
              0 characters · 0 words
            </div>

            <button
              type="button"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20"
            >
              Analyze Text
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left">
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5">
            <Sparkles className="w-5 h-5 text-yellow-400 mb-3" />
            <h3 className="font-semibold text-sm text-slate-200 mb-1">
              Sentence Heatmaps
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pinpoint exactly which sentences triggered detection patterns rather than guessing from a raw percentage.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5">
            <Lock className="w-5 h-5 text-cyan-400 mb-3" />
            <h3 className="font-semibold text-sm text-slate-200 mb-1">
              Zero-Retention Privacy
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your writing is processed strictly in-memory and never retained for AI model training or scraping.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-3" />
            <h3 className="font-semibold text-sm text-slate-200 mb-1">
              Calibrated Confidence
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clear disclosures on short texts and mixed human-AI writing to prevent false accusations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; {new Date().getFullYear()} AI Detector. All rights reserved.</span>
          <span>Notice: AI detection is probabilistic and does not constitute proof of authorship.</span>
        </div>
      </footer>
    </main>
  );
}
