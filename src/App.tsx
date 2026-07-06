import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './infrastructure/database/db';
import { useSessionMetrics } from './presentation/hooks/useSessionMetrics';
import { ImportForm } from './presentation/components/ImportForm';
import { DailyHistoryView } from './presentation/components/DailyHistoryView';
import { CaseManager } from './presentation/components/CaseManager';
import { HistoricalRecords } from './presentation/components/HistoricalRecords';
import { DashboardView } from './presentation/components/DashboardView';
import { OBL_BY_PRIORITY, CSP_CASES, EP_CASES } from './domain/constants/cases';
import { LayoutDashboard, CalendarClock, Target, Database, History, BookOpenText, ShieldAlert, BarChart3, LayoutTemplate, Zap, Activity, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import type { Solve } from './domain/entities/Solve';

type BlockMode = 'Global' | 'Speedsolving' | 'Case recognition';

// FIX: Creamos Tipos estrictos para eliminar los "any" de ESLint
export interface MetricStat {
    best: string;
    solves: Solve[];
}

export interface SessionMetricsData {
    totalSolves: number;
    globalAvg: { result: string };
    single: MetricStat;
    mo3?: MetricStat;
    ao5?: MetricStat;
    ao12?: MetricStat;
    ao50?: MetricStat;
    ao100?: MetricStat;
    ao200?: MetricStat;
    ao500?: MetricStat;
    ao1000?: MetricStat;
    ao2000?: MetricStat;
    ao3000?: MetricStat;
    ao4000?: MetricStat;
    ao5000?: MetricStat;
    ao10000?: MetricStat;
    [key: string]: MetricStat | number | { result: string } | undefined;
}

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
    const [viewMode, setViewMode] = useState<'Dashboard' | 'Daily' | 'CSP' | 'OBL' | 'EP' | 'Historical'>('Dashboard');
    const [blockFilter, setBlockFilter] = useState<BlockMode>('Global');
    const [expandedAudit, setExpandedAudit] = useState<'OBL' | 'CSP' | null>(null);

    // FIX: Reemplazamos <any> por nuestra nueva Interfaz segura
    const [metrics, setMetrics] = useState<SessionMetricsData | null>(null);
    const [isCrunching, setIsCrunching] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<{ label: string, avg: string, solves: Solve[] } | null>(null);

    const solves = useSessionMetrics(blockFilter);

    const oblSolves = solves.filter((s: Solve) => s.isObl && !s.isCsp && Number(s.time) > 0);
    const cspSolves = solves.filter((s: Solve) => s.isCsp && !s.isObl && Number(s.time) > 0);
    const comboSolves = solves.filter((s: Solve) => s.isObl && s.isCsp && Number(s.time) > 0);

    const calcAvg = (arr: Solve[]) => arr.length > 0 ? (arr.reduce((acc, s) => acc + Number(s.time), 0) / arr.length).toFixed(2) : '0.00';

    const caseAudit = {
        totalOBL: oblSolves.length, avgOBL: calcAvg(oblSolves),
        totalCSP: cspSolves.length, avgCSP: calcAvg(cspSolves),
        totalCombo: comboSolves.length, avgCombo: calcAvg(comboSolves),
    };

    const oblCounts = oblSolves.reduce((acc, s) => {
        if (s.oblCase) acc[s.oblCase] = (acc[s.oblCase] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const topOBLs = Object.entries(oblCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const cspGood = cspSolves.filter(s => (s.comment || '').toLowerCase().match(/(good|correcto|bien|✓)/)).length;
    const cspBad = cspSolves.filter(s => (s.comment || '').toLowerCase().match(/(bad|error|mal|fail|x)/)).length;
    const cspNeutral = cspSolves.length - cspGood - cspBad;

    const savedCases = useLiveQuery(() => db.cases.toArray()) || [];
    const cspLearned = savedCases.filter(c => c.category === 'CSP').length;
    const oblLearned = savedCases.filter(c => c.category === 'OBL').length;
    const epLearned = savedCases.filter(c => c.category === 'EP').length;

    const totalCSP = CSP_CASES.length;
    const totalOBL = OBL_BY_PRIORITY.reduce((acc, g) => acc + g.cases.length, 0);
    const totalEP = EP_CASES.reduce((acc, g) => acc + g.cases.length, 0);

    useEffect(() => {
        let isMounted = true;

        const computeMetrics = async () => {
            const validSolves = solves.filter(s => Number(s.time) > 0);
            if (validSolves.length === 0) {
                setMetrics(null);
                return;
            }

            try {
                if (isMounted) setIsCrunching(true);
                const times = validSolves.map(s => Number(s.time));

                const globalTrim = Math.ceil(times.length * 0.05);
                const globalSorted = [...times].sort((a, b) => a - b);
                const globalTrimmed = globalSorted.slice(globalTrim, times.length - globalTrim);
                const globalAvgResult = globalTrimmed.length > 0
                    ? (globalTrimmed.reduce((a, b) => a + b, 0) / globalTrimmed.length).toFixed(2)
                    : '-';

                let bestSingleSolve = validSolves[0];
                for (const s of validSolves) {
                    if (Number(s.time) < Number(bestSingleSolve.time)) bestSingleSolve = s;
                }

                // FIX: Asignamos explícitamente el tipo SessionMetricsData aquí también
                const newMetrics: SessionMetricsData = {
                    totalSolves: times.length,
                    globalAvg: { result: globalAvgResult },
                    single: { best: Number(bestSingleSolve.time).toFixed(2), solves: [bestSingleSolve] }
                };

                const categories = [
                    { label: 'mo3', size: 3 }, { label: 'ao5', size: 5 }, { label: 'ao12', size: 12 },
                    { label: 'ao50', size: 50 }, { label: 'ao100', size: 100 }, { label: 'ao200', size: 200 },
                    { label: 'ao500', size: 500 }, { label: 'ao1000', size: 1000 }, { label: 'ao2000', size: 2000 },
                    { label: 'ao3000', size: 3000 }, { label: 'ao4000', size: 4000 }, { label: 'ao5000', size: 5000 },
                    { label: 'ao10000', size: 10000 }
                ];

                const computeSingleAverage = (wTimes: number[], size: number) => {
                    if (size === 3) return wTimes.reduce((a, b) => a + b, 0) / 3;
                    const trim = Math.ceil(size * 0.05);
                    const sorted = [...wTimes].sort((a, b) => a - b);
                    const trimmed = sorted.slice(trim, size - trim);
                    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
                };

                for (const cat of categories) {
                    if (!isMounted) return;
                    if (times.length < cat.size) {
                        newMetrics[cat.label] = { best: '-', solves: [] };
                        continue;
                    }

                    let best = Infinity;
                    let bestWindow: Solve[] = [];

                    for (let i = 0; i <= times.length - cat.size; i++) {
                        const windowTimes = times.slice(i, i + cat.size);
                        const avg = computeSingleAverage(windowTimes, cat.size);
                        if (avg < best) {
                            best = avg;
                            bestWindow = validSolves.slice(i, i + cat.size);
                        }

                        if (i % 300 === 0) {
                            await new Promise(resolve => setTimeout(resolve, 0));
                            if (!isMounted) return;
                        }
                    }

                    newMetrics[cat.label] = {
                        best: best === Infinity ? '-' : best.toFixed(2),
                        solves: bestWindow
                    };
                }

                if (isMounted) setMetrics(newMetrics);
            } catch (error) {
                console.error("Crash prevented during WCA Stat Calculation:", error);
            } finally {
                if (isMounted) setIsCrunching(false);
            }
        };

        computeMetrics();
        return () => { isMounted = false; };
    }, [solves.length, blockFilter]);

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

            <main className="mx-auto max-w-7xl p-4 md:p-8">
                {viewMode === 'Dashboard' && (
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        <div className="space-y-8 lg:col-span-1">
                            <ImportForm />
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

                        <div className="space-y-8 lg:col-span-2">
                            <div className="flex w-full rounded-xl border border-gray-800 bg-gray-900 p-1.5 shadow-xl">
                                {['Global', 'Speedsolving', 'Case recognition'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setBlockFilter(mode as BlockMode)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition ${blockFilter === mode ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-gray-800/50'}`}
                                    >
                                        {mode === 'Global' && <LayoutTemplate className="h-4 w-4" />}
                                        {mode === 'Speedsolving' && <Zap className="h-4 w-4" />}
                                        {mode === 'Case recognition' && <Activity className="h-4 w-4" />}
                                        <span className="hidden sm:inline">{mode}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="relative min-h-[300px] rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                                    <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-400 uppercase">
                                        WCA Stats <span className="ml-1 text-gray-600">({solves.length} solves)</span>
                                    </h3>

                                    {isCrunching ? (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-gray-900/80 text-gray-400 backdrop-blur-sm">
                                            <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-500" />
                                            <span className="text-xs font-bold tracking-wider uppercase">Crunching Stats...</span>
                                        </div>
                                    ) : null}

                                    {metrics ? (
                                        <div className="font-mono text-base">
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                                {[
                                                    { label: 'Single', data: metrics.single },
                                                    { label: 'Mo3', data: metrics.mo3 },
                                                    { label: 'Ao5', data: metrics.ao5 },
                                                    { label: 'Ao12', data: metrics.ao12 },
                                                    { label: 'Ao50', data: metrics.ao50 },
                                                    { label: 'Ao100', data: metrics.ao100 },
                                                    { label: 'Ao200', data: metrics.ao200 },
                                                    { label: 'Ao500', data: metrics.ao500 },
                                                    { label: 'Ao1000', data: metrics.ao1000 },
                                                    { label: 'Ao2000', data: metrics.ao2000 },
                                                    { label: 'Ao3000', data: metrics.ao3000 },
                                                    { label: 'Ao4000', data: metrics.ao4000 },
                                                    { label: 'Ao5000', data: metrics.ao5000 },
                                                    { label: 'Ao10000', data: metrics.ao10000 }
                                                ].map(row => {
                                                    if (!row.data || row.data.best === '-') return null;
                                                    return (
                                                        <div
                                                            key={row.label}
                                                            onClick={() => setSelectedRecord({ label: row.label, avg: row.data.best, solves: row.data.solves || [] })}
                                                            className="flex justify-between items-center py-1.5 border-b border-gray-800/30 transition hover:bg-gray-800/50 px-2 rounded cursor-pointer group"
                                                        >
                                                            <span className="text-sm font-bold text-gray-400 transition group-hover:text-white">{row.label}</span>
                                                            <span className="font-bold text-emerald-400">{row.data.best}s</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-6 flex items-end justify-between rounded-lg border-t border-gray-700 bg-gray-950 p-4 pt-4">
                                                <span className="text-sm font-bold tracking-wider text-gray-400 uppercase">Global Average</span>
                                                <span className="text-3xl font-black text-blue-400">{metrics.globalAvg.result}s</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-800 text-sm text-gray-600 italic">No session data available.</div>
                                    )}
                                </div>

                                <div className="h-fit rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-gray-400 uppercase">
                                        <ShieldAlert className="h-4 w-4 text-amber-500" /> Case Audit
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
                                            <div onClick={() => setExpandedAudit(expandedAudit === 'OBL' ? null : 'OBL')} className="flex items-center justify-between p-3.5 cursor-pointer transition hover:bg-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-blue-400">OBL Only ({caseAudit.totalOBL})</span>
                                                    {expandedAudit === 'OBL' ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
                                                </div>
                                                <span className="text-base font-black text-white">{caseAudit.avgOBL}s</span>
                                            </div>
                                            {expandedAudit === 'OBL' && (
                                                <div className="space-y-1.5 border-t border-gray-800 bg-black p-3 font-mono text-xs text-gray-400">
                                                    <p className="mb-2 font-sans font-bold text-gray-500">Most Frequent Cases:</p>
                                                    {topOBLs.length > 0 ? topOBLs.map(([name, count]) => (
                                                        <div key={name} className="flex justify-between">
                                                            <span>{name}</span>
                                                            <span className="text-blue-400">{count}x</span>
                                                        </div>
                                                    )) : <span className="text-gray-600 italic">No specific case data found.</span>}
                                                </div>
                                            )}
                                        </div>

                                        <div className="overflow-hidden rounded-lg border border-gray-800 bg-gray-950">
                                            <div onClick={() => setExpandedAudit(expandedAudit === 'CSP' ? null : 'CSP')} className="flex items-center justify-between p-3.5 cursor-pointer transition hover:bg-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-purple-400">CSP Only ({caseAudit.totalCSP})</span>
                                                    {expandedAudit === 'CSP' ? <ChevronUp className="h-3 w-3 text-gray-500" /> : <ChevronDown className="h-3 w-3 text-gray-500" />}
                                                </div>
                                                <span className="text-base font-black text-white">{caseAudit.avgCSP}s</span>
                                            </div>
                                            {expandedAudit === 'CSP' && (
                                                <div className="space-y-2 border-t border-gray-800 bg-black p-3 font-mono text-xs text-gray-400">
                                                    <p className="mb-2 font-sans font-bold text-gray-500">Success Rate (Parsed from Comments):</p>
                                                    <div className="flex items-center justify-between rounded border border-emerald-900/50 bg-emerald-950/30 p-2">
                                                        <span className="text-emerald-500">Correct (Good)</span>
                                                        <span className="font-bold text-emerald-400">{cspGood} solves</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded border border-red-900/50 bg-red-950/30 p-2">
                                                        <span className="text-red-500">Failed (Bad)</span>
                                                        <span className="font-bold text-red-400">{cspBad} solves</span>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2">
                                                        <span className="text-gray-500">Unspecified</span>
                                                        <span>{cspNeutral} solves</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 p-3.5 transition hover:border-amber-900/50">
                                            <span className="font-mono text-xs font-bold text-amber-400">Combo OBL+CSP ({caseAudit.totalCombo})</span>
                                            <span className="text-base font-black text-white">{caseAudit.avgCombo}s</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DashboardView solves={solves} viewMode={blockFilter} />
                        </div>
                    </div>
                )}

                {viewMode === 'Daily' && <DailyHistoryView />}
                {viewMode === 'CSP' && <CaseManager category="CSP" />}
                {viewMode === 'OBL' && <CaseManager category="OBL" />}
                {viewMode === 'EP' && <CaseManager category="EP" />}
                {viewMode === 'Historical' && <HistoricalRecords />}
            </main>

            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
                    <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-950 p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="mb-4 flex shrink-0 items-center justify-between border-b border-gray-800 pb-4">
                            <div>
                                <h2 className="text-2xl font-black text-white">{selectedRecord.label}: <span className="text-emerald-400">{selectedRecord.avg}s</span></h2>
                                <p className="mt-1 font-mono text-xs text-gray-500">Achieved on: {selectedRecord.solves[selectedRecord.solves.length - 1]?.dateStr}</p>
                            </div>
                            <button onClick={() => setSelectedRecord(null)} className="text-gray-500 hover:text-white p-2 rounded-lg bg-gray-900 border border-gray-800 transition">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto pr-2">
                            {selectedRecord.solves.length > 100 ? (
                                <div className="flex h-32 items-center justify-center rounded-lg border border-gray-800 bg-gray-900">
                                    <p className="font-bold text-yellow-500 italic">This average is too large to render the detailed list.</p>
                                </div>
                            ) : (
                                selectedRecord.solves.map((s, i) => (
                                    <div key={i} className="flex gap-4 rounded-lg border border-gray-800 bg-gray-900 p-3 font-mono text-sm transition hover:border-gray-600">
                                        <span className="w-6 text-right font-bold text-gray-600">{i + 1}.</span>
                                        <span className="w-14 font-black text-blue-400">{Number(s.time).toFixed(2)}</span>
                                        <span className="flex-1 leading-relaxed break-words text-gray-400 text-[11px]">{s.scramble}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}