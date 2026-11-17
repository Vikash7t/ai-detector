import { Navbar } from '@/components/navigation/navbar';
import { ScannerWorkspace } from '@/components/scanner/scanner-workspace';
import { ShieldCheck, Sparkles, Lock } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
      {/* Navigation */}
      <Navbar />

      {/* Hero & Workspace */}
      <section className="max-w-5xl mx-auto px-4 py-12 text-center flex-1 flex flex-col justify-center w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/30 text-cyan-300 text-xs font-semibold mb-6 mx-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explainable Linguistic AI Analysis</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Detect AI Content with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            Sentence-Level Clarity
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Verify text origin with explainable sentence heatmaps and calibrated confidence
          scores. Built for academic integrity, editorial transparency, and zero-retention privacy.
        </p>

        {/* Interactive Scanner Workspace */}
        <ScannerWorkspace />

        {/* Core Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 text-left">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition">
            <Sparkles className="w-5 h-5 text-yellow-400 mb-3" />
            <h3 className="font-bold text-sm text-slate-200 mb-1">
              Sentence Heatmaps
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pinpoint specific sentences triggering automated patterns rather than relying on an ambiguous global percentage.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition">
            <Lock className="w-5 h-5 text-cyan-400 mb-3" />
            <h3 className="font-bold text-sm text-slate-200 mb-1">
              Zero-Retention Privacy
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Guest scans are strictly ephemeral. Submitted text is processed in-memory and never stored, indexed, or scraped.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition">
            <ShieldCheck className="w-5 h-5 text-emerald-400 mb-3" />
            <h3 className="font-bold text-sm text-slate-200 mb-1">
              Calibrated Confidence
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Clear advisory notices on short passages (&lt; 500 chars) and mixed drafts to minimize false positive accusations.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span>&copy; {new Date().getFullYear()} AI Detector. Built with Next.js 15, NestJS 11, and Sapling AI.</span>
          <span>Notice: AI detection is probabilistic and serves as an advisory signal, not proof of authorship.</span>
        </div>
      </footer>
    </main>
  );
}
