import { AuthGuard } from '@/components/auth/auth-guard';
import { Navbar } from '@/components/navigation/navbar';
import { UserQuotaWidget } from '@/components/history/user-quota-widget';
import { HistoryTable } from '@/components/history/history-table';

export default function HistoryPage() {
  return (
    <AuthGuard>
      <main className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
        <Navbar />

        <div className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full flex flex-col space-y-6">
          <div className="flex flex-col space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dashboard & History
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Review prior AI analysis, inspect sentence heatmaps, or manage your stored scan records.
            </p>
          </div>

          {/* User Monthly Quota Bar */}
          <UserQuotaWidget />

          {/* Paginated History Table */}
          <HistoryTable />
        </div>

        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span>&copy; {new Date().getFullYear()} AI Detector. All rights reserved.</span>
            <span>Zero-retention privacy: registered scans can be deleted permanently at any time.</span>
          </div>
        </footer>
      </main>
    </AuthGuard>
  );
}
