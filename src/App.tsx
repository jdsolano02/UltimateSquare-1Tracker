import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './infrastructure/database/db';
import { useSessionMetrics } from './presentation/hooks/useSessionMetrics';
import { ImportForm } from './presentation/components/ImportForm';
import { DailyHistoryView } from './presentation/components/DailyHistoryView';
import { CaseManager } from './presentation/components/CaseManager';
import { HistoricalRecords } from './presentation/components/HistoricalRecords';
import { DashboardView } from './presentation/components/DashboardView';
import { getCaseAudit } from './application/useCases/stats';
import { OBL_BY_PRIORITY, CSP_CASES, EP_CASES } from './domain/constants/cases';
import { LayoutDashboard, CalendarClock, Target, Database, History, BookOpenText, ShieldAlert, BarChart3 } from 'lucide-react';

// --- COMPONENTES REUTILIZABLES (Definidos FUERA del render principal) ---
const ProgressBar = ({ label, current, total, color, bg }: { label: string, current: number, total: number, color: string, bg: string }) => {
    const pct = total === 0 ? 0 : Math.round((current / total) * 100);
    return (
        <div className="mb-4 last:mb-0">
            <div className="mb-1 flex justify-between text-xs font-bold">
                <span className="text-gray-400">{label}</span>
                <span className="text-white">{current} / {total} <span className={color}>({pct}%)</span></span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                <div className={`h-full ${bg} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

export default function App() {
    // Nav State
    const [viewMode, setViewMode] = useState<'Dashboard' | 'Daily' | 'CSP' | 'OBL' | 'EP' | 'Historical'>('Dashboard');
    const [selectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Fetch Global Metrics & Audit
    const sessionData = useSessionMetrics('Global', selectedDate);
    const solves = sessionData?.solves || [];
    const metrics = sessionData?.metrics || null;
    const caseAudit = getCaseAudit(solves);

    // Fetch Case Progress
    const savedCases = useLiveQuery(() => db.cases.toArray()) || [];
    const cspLearned = savedCases.filter(c => c.category === 'CSP').length;
    const oblLearned = savedCases.filter(c => c.category === 'OBL').length;
    const epLearned = savedCases.filter(c => c.category === 'EP').length;

    const totalCSP = CSP_CASES.length; // 88
    const totalOBL = OBL_BY_PRIORITY.reduce((acc, g) => acc + g.cases.length, 0); // 71
    const totalEP = EP_CASES.reduce((acc, g) => acc + g.cases.length, 0); // 33

    const navItems = [
        { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'Daily', label: 'Daily History', icon: CalendarClock },
        { id: 'CSP', label: 'CSP Lab', icon: Target },
        { id: 'OBL', label: 'OBL Lab', icon: BookOpenText },
        { id: 'EP', label: 'EP Lab', icon: Database },
        { id: 'Historical', label: 'Historical Records', icon: History },
    ] as const;

    return (
        <div className="min-h-screen bg-gray-950 font-sans text-gray-100 selection:bg-blue-500/30">
            {/* Navigation Header */}
            <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
                    <h1 className="text-xl font-black tracking-tight text-white">
                        SQ-1 <span className="text-emerald-500">CORE ENGINE</span>
                    </h1>
                    <nav className="custom-scrollbar flex gap-1 overflow-x-auto pb-1 md:pb-0">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setViewMode(item.id)}
                                className={`flex whitespace-nowrap items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${viewMode === item.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                                    }`}
                            >
                                <item.icon className="h-4 w-4" />
                                <span className="hidden sm:inline">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="mx-auto max-w-7xl p-4 md:p-8">

                {viewMode === 'Dashboard' && (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

                        {/* LEFT COLUMN: Data Ingestion & Progress */}
                        <div className="space-y-8 lg:col-span-1">
                            <ImportForm />

                            {/* Algorithm Progress Summary */}
                            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                                <h3 className="mb-5 flex items-center gap-2 text-sm font-bold tracking-wider text-gray-400 uppercase">
                                    <BarChart3 className="h-4 w-4 text-emerald-500" />
                                    Algorithm Mastery
                                </h3>
                                <ProgressBar label="CSP Progression" current={cspLearned} total={totalCSP} color="text-purple-400" bg="bg-purple-500" />
                                <ProgressBar label="OBL Progression" current={oblLearned} total={totalOBL} color="text-blue-400" bg="bg-blue-500" />
                                <ProgressBar label="EP Progression" current={epLearned} total={totalEP} color="text-amber-400" bg="bg-amber-500" />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: WCA Metrics, Audit, Charts & Totals */}
                        <div className="space-y-8 lg:col-span-2">

                            {/* Top Row: Metrics & Audit */}
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                                {/* WCA Metrics Panel */}
                                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                                    <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-400 uppercase">
                                        WCA Metrics <span className="ml-1 text-gray-600">({metrics?.totalSolves || 0} solves)</span>
                                    </h3>

                                    {metrics ? (
                                        <div className="space-y-2 font-mono text-sm">
                                            <div className="grid grid-cols-3 gap-2 border-b border-gray-800 pb-2 font-bold tracking-widest text-gray-500 text-[10px] uppercase">
                                                <span>Category</span><span>Current</span><span>Best</span>
                                            </div>
                                            {[
                                                { label: 'Single', data: { current: '-', best: metrics.single.best, currentSigma: '', bestSigma: '' } },
                                                { label: 'Mo3', data: metrics.mo3 },
                                                { label: 'Ao5', data: metrics.ao5 },
                                                { label: 'Ao12', data: metrics.ao12 },
                                                { label: 'Ao100', data: metrics.ao100 }
                                            ].map(row => (
                                                <div key={row.label} className="grid grid-cols-3 items-center gap-2 py-1">
                                                    <span className="text-gray-400">{row.label}</span>
                                                    {row.data ? (
                                                        <>
                                                            <span className="font-semibold text-white">
                                                                {row.data.current} <span className="ml-1 text-[10px] text-gray-600">{row.data.currentSigma && `(${row.data.currentSigma})`}</span>
                                                            </span>
                                                            <span className="font-bold text-emerald-400">
                                                                {row.data.best} <span className="ml-1 text-[10px] text-gray-600">{row.data.bestSigma && `(${row.data.bestSigma})`}</span>
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <><span className="text-gray-600">-</span><span className="text-gray-600">-</span></>
                                                    )}
                                                </div>
                                            ))}
                                            <div className="mt-4 flex items-end justify-between border-t border-gray-800 pt-4">
                                                <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">Global Average</span>
                                                <span className="text-xl font-black text-blue-400">{metrics.globalAvg.result}s</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-800 text-sm text-gray-600 italic">No session data available.</div>
                                    )}
                                </div>

                                {/* Case Audit Panel */}
                                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-gray-400 uppercase">
                                        <ShieldAlert className="h-4 w-4 text-amber-500" /> Case Audit
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 p-3.5 transition hover:border-blue-900/50">
                                            <span className="font-mono text-xs font-bold text-blue-400">OBL Only ({caseAudit.totalOBL})</span>
                                            <span className="text-base font-black text-white">{caseAudit.avgOBL}s</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 p-3.5 transition hover:border-purple-900/50">
                                            <span className="font-mono text-xs font-bold text-purple-400">CSP Only ({caseAudit.totalCSP})</span>
                                            <span className="text-base font-black text-white">{caseAudit.avgCSP}s</span>
                                        </div>
                                        <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 p-3.5 transition hover:border-amber-900/50">
                                            <span className="font-mono text-xs font-bold text-amber-400">Combo OBL+CSP ({caseAudit.totalCombo})</span>
                                            <span className="text-base font-black text-white">{caseAudit.avgCombo}s</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts and Sprint/Flow/Global Totals */}
                            <DashboardView />

                        </div>
                    </div>
                )}

                {/* Other Views Routing */}
                {viewMode === 'Daily' && <DailyHistoryView />}
                {viewMode === 'CSP' && <CaseManager category="CSP" />}
                {viewMode === 'OBL' && <CaseManager category="OBL" />}
                {viewMode === 'EP' && <CaseManager category="EP" />}
                {viewMode === 'Historical' && <HistoricalRecords />}
            </main>
        </div>
    );
}