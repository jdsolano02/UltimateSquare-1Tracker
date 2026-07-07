import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './infrastructure/database/db';
import { ImportForm } from './presentation/components/ImportForm';
import { DailyHistoryView } from './presentation/components/DailyHistoryView';
import { CaseManager } from './presentation/components/CaseManager';
import { HistoricalRecords } from './presentation/components/HistoricalRecords';
import { DashboardView } from './presentation/components/DashboardView';
import {
    OBL_BASE_CASES, CSP_CASES,
    NP_PBL_BASE_CASES, DP_PBL_BASE_CASES
} from './domain/constants/cases';
import { LayoutDashboard, CalendarClock, Target, Database, BookOpenText, ShieldAlert, BarChart3, X, Loader2, Copy, Grid3X3, Plus, Pencil, Trash2, Trophy } from 'lucide-react';
import type { Solve } from './domain/entities/Solve';

export type BlockMode = 'Global (View All)' | 'Global' | string;
export type ViewModeType = 'Dashboard' | 'Daily' | 'CSP' | 'OBL' | 'PBL' | 'Historical';
export interface MetricStat { best: string; solves: Solve[]; }

export interface SessionMetricsData {
    totalSolves: number;
    globalAvg: { result: string };
    single: MetricStat; mo3?: MetricStat; ao5?: MetricStat; ao12?: MetricStat; ao25?: MetricStat; ao50?: MetricStat;
    ao100?: MetricStat; ao200?: MetricStat; ao500?: MetricStat; ao1000?: MetricStat;
    ao2000?: MetricStat; ao5000?: MetricStat; ao10000?: MetricStat;
    [key: string]: MetricStat | number | { result: string } | undefined;
}


const ProgressBar = ({ label, current, total, color, bg }: { label: string, current: number, total: number, color: string, bg: string }) => {
    const pct = total === 0 ? 0 : Math.round((current / total) * 100);
    return (
        <div className="mb-2 last:mb-0">
            <div className="mb-1 flex justify-between font-bold tracking-wider text-[10px] uppercase">
                <span className="text-gray-400">{label}</span>
                <span className="text-white">{current} / {total} <span className={color}>({pct}%)</span></span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
                <div className={`h-full ${bg} transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

export default function App() {
    const [viewMode, setViewMode] = useState<ViewModeType>('Dashboard');
    const [blockFilter, setBlockFilter] = useState<BlockMode>('Global');

    const allSolvesDb: (Solve & { id?: number })[] =
        useLiveQuery(() => db.solves.toArray(), []) ?? [];

    const solves = blockFilter === 'Global (View All)'
        ? allSolvesDb
        : allSolvesDb.filter(s => s.block === blockFilter);

    const [localSessions, setLocalSessions] = useState<string[]>(() => {
        const saved = localStorage.getItem('sq1_sessions');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => { localStorage.setItem('sq1_sessions', JSON.stringify(localSessions)); }, [localSessions]);

    const dbSessions = Array.from(new Set(allSolvesDb.map(s => s.block)));
    const sessions = Array.from(new Set(['Global', ...dbSessions, ...localSessions]));

    const handleCreateSession = () => {
        const name = window.prompt("Enter new session name:");
        if (name && name.trim() !== '') {
            const clean = name.trim();
            setLocalSessions(prev => Array.from(new Set([...prev, clean])));
            setBlockFilter(clean);
        }
    };

    const handleRenameSession = async () => {
        if (blockFilter === 'Global' || blockFilter === 'Global (View All)') { alert("Cannot rename base sessions."); return; }
        const newName = window.prompt(`Rename session '${blockFilter}' to:`);
        if (newName && newName.trim() !== '') {
            const cleanName = newName.trim();
            const solvesToUpdate = allSolvesDb.filter(s => s.block === blockFilter);
            for (const solve of solvesToUpdate) { if (solve.id !== undefined) await db.solves.update(solve.id, { block: cleanName }); }
            setLocalSessions(prev => [...prev.filter(s => s !== blockFilter), cleanName]);
            setBlockFilter(cleanName);
        }
    };

    const handleDeleteSession = async () => {
        if (blockFilter === 'Global' || blockFilter === 'Global (View All)') return;
        if (window.confirm(`Do you want to MIGRATE all times from '${blockFilter}' into 'Global' before deleting?\nOK = MIGRATE.\nCANCEL = DELETE PERMANENTLY.`)) {
            const solvesToUpdate = allSolvesDb.filter(s => s.block === blockFilter);
            for (const solve of solvesToUpdate) { if (solve.id !== undefined) await db.solves.update(solve.id, { block: 'Global' }); }
        } else {
            if (window.confirm(`WARNING: Session '${blockFilter}' will be PERMANENTLY DELETED. Proceed?`)) {
                const solvesToDelete = allSolvesDb.filter(s => s.block === blockFilter).map(s => s.id as number);
                await db.solves.bulkDelete(solvesToDelete);
            } else return;
        }
        setLocalSessions(prev => prev.filter(s => s !== blockFilter));
        setBlockFilter('Global');
    };

    const [auditFilter, setAuditFilter] = useState<'CSP' | 'OBL' | 'PBL'>('CSP');
    const [metrics, setMetrics] = useState<SessionMetricsData | null>(null);
    const [isCrunching, setIsCrunching] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<{ label: string, avg: string, solves: Solve[] } | null>(null);
    const [prs, setPrs] = useState<{ type: string; time: string; date: string; solves: Solve[]; }[]>([]);
    const [isCalculatingPrs, setIsCalculatingPrs] = useState(true);

    const savedCases = useLiveQuery(() => db.cases.toArray(), []) ?? [];

    const cspLearned = savedCases.filter(c => c.category === 'CSP' && c.status === 'Mastered').length;
    const masteredOBL = new Set(savedCases.filter(c => c.category === 'OBL' && c.status === 'Mastered').map(c => c.caseName));
    const oblLearned = Array.from(masteredOBL).filter(name => OBL_BASE_CASES.includes(name)).length;

    const masteredPBL = new Set(savedCases.filter(c => c.category === 'PBL' && c.status === 'Mastered').map(c => c.caseName));
    const pblLearned = Array.from(masteredPBL).filter(name => NP_PBL_BASE_CASES.includes(name) || DP_PBL_BASE_CASES.includes(name)).length;

    const analyzeAudit = (solvesArray: Solve[]) => {
        const getStats = (kw: string, useGoodBad: boolean) => {
            const f = solvesArray.filter(s => s.comment && s.comment.toLowerCase().includes(kw));
            const avg = f.length ? (f.reduce((a, b) => a + Number(b.time), 0) / f.length).toFixed(2) : '-';
            let good = 0, bad = 0;
            if (useGoodBad) {
                good = f.filter(s => s.comment?.match(/(good|correcto|bien|✓)/i)).length;
                bad = f.filter(s => s.comment?.match(/(bad|error|mal|fail|x)/i)).length;
            }
            const counts: Record<string, number> = {};
            f.forEach(s => {
                // TS FIX: Checkeamos que s.comment exista y lo usamos
                const commentText = s.comment || '';
                let clean = commentText.replace(/\[|\]/g, '').replace(new RegExp(kw, 'i'), '').replace(/(good|bad|correcto|error|mal|fail|bien|x|✓)/gi, '').trim();
                if (!clean || clean === '-' || clean === '/') clean = 'Unknown';
                counts[clean] = (counts[clean] || 0) + 1;
            });
            const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            return { total: f.length, avg, good, bad, top };
        };
        return { CSP: getStats('csp', true), OBL: getStats('obl', false), PBL: getStats('pbl', false) };
    };
    const auditParsed = analyzeAudit(solves);

    const calculateAvg = (times: number[], size: number): number => {
        if (times.length !== size) return Infinity;
        if (size === 3) return times.reduce((a, b) => a + b, 0) / 3;
        const trim = Math.ceil(size * 0.05);
        const sorted = [...times].sort((a, b) => a - b);
        const trimmed = sorted.slice(trim, size - trim);
        return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    };

    useEffect(() => {
        let isMounted = true;
        const computeMetrics = async () => {
            const validSolves = solves.filter(s => Number(s.time) > 0);
            if (validSolves.length === 0) { setMetrics(null); return; }
            try {
                if (isMounted) setIsCrunching(true);
                const times = validSolves.map(s => Number(s.time));
                const globalTrim = Math.ceil(times.length * 0.05);
                const globalSorted = [...times].sort((a, b) => a - b);
                const globalTrimmed = globalSorted.slice(globalTrim, times.length - globalTrim);
                const globalAvgResult = globalTrimmed.length > 0 ? (globalTrimmed.reduce((a, b) => a + b, 0) / globalTrimmed.length).toFixed(2) : '-';

                let bestSingleSolve = validSolves[0];
                for (const solve of validSolves) { if (Number(solve.time) < Number(bestSingleSolve.time)) bestSingleSolve = solve; }

                const newMetrics: SessionMetricsData = { totalSolves: times.length, globalAvg: { result: globalAvgResult }, single: { best: Number(bestSingleSolve.time).toFixed(2), solves: [bestSingleSolve] } };

                const prCategories = [3, 5, 12, 25, 50, 100];
                const currentCategories = [200, 500, 1000, 2000, 5000, 10000];

                for (const size of prCategories) {
                    if (!isMounted) return;
                    if (times.length < size) { newMetrics[`ao${size}`] = { best: '-', solves: [] }; continue; }
                    let best = Infinity, bestWindow: Solve[] = [];
                    for (let i = 0; i <= times.length - size; i++) {
                        const avg = calculateAvg(times.slice(i, i + size), size);
                        if (avg < best) { best = avg; bestWindow = validSolves.slice(i, i + size); }
                        if (i % 500 === 0) { await new Promise(r => setTimeout(r, 0)); if (!isMounted) return; }
                    }
                    newMetrics[size === 3 ? 'mo3' : `ao${size}`] = { best: best === Infinity ? '-' : best.toFixed(2), solves: bestWindow };
                }

                for (const size of currentCategories) {
                    if (times.length >= size) {
                        const currentWindow = validSolves.slice(validSolves.length - size);
                        const currentTimes = currentWindow.map(s => Number(s.time));
                        const avg = calculateAvg(currentTimes, size);
                        newMetrics[`ao${size}`] = { best: avg.toFixed(2), solves: currentWindow };
                    } else {
                        newMetrics[`ao${size}`] = { best: '-', solves: [] };
                    }
                }

                if (isMounted) setMetrics(newMetrics);
            } catch (e) { console.error(e); } finally { if (isMounted) setIsCrunching(false); }
        };
        computeMetrics();
        return () => { isMounted = false; };
    }, [solves.length, blockFilter]);

    useEffect(() => {
        let isMounted = true;
        const computePrs = async () => {
            const validSolves = allSolvesDb.filter(s => Number(s.time) > 0);
            if (validSolves.length === 0) { setPrs([]); setIsCalculatingPrs(false); return; }
            try {
                if (isMounted) setIsCalculatingPrs(true);
                const times = validSolves.map(s => Number(s.time));
                let bestSingleSolve = validSolves[0];
                for (const solve of validSolves) { if (Number(solve.time) < Number(bestSingleSolve.time)) bestSingleSolve = solve; }

                const prCategories = [3, 5, 12, 25, 50, 100];
                const records = [];

                for (const size of prCategories) {
                    if (!isMounted) return;
                    if (times.length < size) continue;
                    let best = Infinity, bestWindow: Solve[] = [];
                    for (let i = 0; i <= times.length - size; i++) {
                        const avg = calculateAvg(times.slice(i, i + size), size);
                        if (avg < best) { best = avg; bestWindow = validSolves.slice(i, i + size); }
                        if (i % 500 === 0) { await new Promise(r => setTimeout(r, 0)); if (!isMounted) return; }
                    }
                    if (best !== Infinity) records.push({ type: size === 3 ? 'Mo3' : `Ao${size}`, time: best.toFixed(2), date: bestWindow[bestWindow.length - 1]?.dateStr || '', solves: bestWindow });
                }
                if (isMounted) { setPrs([{ type: 'Single', time: Number(bestSingleSolve.time).toFixed(2), date: bestSingleSolve.dateStr, solves: [bestSingleSolve] }, ...records]); setIsCalculatingPrs(false); }
            } catch (e) { console.error(e); }
        };
        computePrs();
        return () => { isMounted = false; };
    }, [allSolvesDb.length]);

    const navItems = [
        { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'Daily', label: 'Daily Tracker', icon: CalendarClock },
        { id: 'CSP', label: 'CSP Lab', icon: Target },
        { id: 'OBL', label: 'OBL Lab', icon: BookOpenText },
        { id: 'PBL', label: 'PBL Lab', icon: Grid3X3 },
        { id: 'Historical', label: 'Data & Sessions', icon: Database },
    ] as const;

    const copyToClipboard = () => {
        if (!selectedRecord) return;
        const text = `SQ-1 ${selectedRecord.label}: ${selectedRecord.avg}s\n\n${selectedRecord.solves.map((s, i) => `${i + 1}. ${Number(s.time).toFixed(2)} - ${s.scramble}`).join('\n')}`;
        navigator.clipboard.writeText(text);
        alert("Scrambles copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-gray-950 font-sans text-gray-100 selection:bg-blue-500/30">
            <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between p-4">
                    <div className="group flex cursor-pointer items-center gap-3" onClick={() => setViewMode('Dashboard')}>
                        <img src="/logo.png" alt="SQ1 Logo" className="h-8 w-8 rounded-md object-contain transition-transform group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        <h1 className="text-xl font-black tracking-tight text-white transition group-hover:text-emerald-400">SQ-1 <span className="text-emerald-500">CORE ENGINE</span></h1>
                    </div>
                    <nav className="custom-scrollbar flex gap-1 overflow-x-auto pb-1 md:pb-0">
                        {navItems.map((item) => (
                            <button key={item.id} onClick={() => setViewMode(item.id as ViewModeType)} className={`flex whitespace-nowrap items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${viewMode === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'}`}>
                                <item.icon className="h-4 w-4" /> <span className="hidden sm:inline">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-4 md:p-8">
                {viewMode === 'Dashboard' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                            <div className="space-y-6 lg:col-span-1">

                                <div className="flex w-full items-center gap-3 rounded-xl border border-blue-900/30 bg-blue-950/10 p-5 shadow-xl">
                                    <div className="flex flex-1 flex-col">
                                        <div className="mb-2 flex items-center">
                                            <span className="text-xs font-bold tracking-wider text-blue-400 uppercase">Active Session</span>
                                        </div>
                                        <select value={blockFilter} onChange={(e) => setBlockFilter(e.target.value)} className="w-full cursor-pointer bg-black border border-gray-700 text-white text-sm font-bold rounded-lg p-2.5 outline-none focus:border-blue-500 transition hover:border-gray-500">
                                            <option value="Global (View All)">[View All Sessions Mixed]</option>
                                            <optgroup label="Your Sessions">{sessions.map(s => <option key={s} value={s}>{s}</option>)}</optgroup>
                                        </select>
                                    </div>
                                    <div className="mt-6 flex flex-col gap-1">
                                        <button onClick={handleCreateSession} title="New Session" className="flex items-center justify-center rounded-lg bg-blue-600 px-2 py-1.5 font-bold text-white transition hover:bg-blue-500"><Plus className="h-4 w-4" /></button>
                                        {blockFilter !== 'Global' && blockFilter !== 'Global (View All)' && (
                                            <div className="flex gap-1">
                                                <button onClick={handleRenameSession} title="Rename" className="flex items-center justify-center rounded-lg bg-gray-800 px-2 py-1.5 text-gray-300 transition hover:bg-gray-700"><Pencil className="h-3 w-3" /></button>
                                                <button onClick={handleDeleteSession} title="Delete" className="flex items-center justify-center rounded-lg bg-red-900/50 px-2 py-1.5 text-white transition hover:bg-red-600"><Trash2 className="h-3 w-3" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <ImportForm activeSession={blockFilter} />

                                <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-xl">
                                    <h3 className="mb-4 flex items-center text-sm font-bold tracking-wider text-gray-400 uppercase"><BarChart3 className="mr-2 h-4 w-4 text-emerald-500" /> Mastery</h3>
                                    <div className="space-y-3">
                                        <div onClick={() => setViewMode('CSP')} className="cursor-pointer group p-2 -mx-2 rounded transition hover:bg-gray-800 border border-transparent hover:border-gray-700">
                                            <ProgressBar label="CSP Module" current={cspLearned} total={CSP_CASES.length} color="text-purple-400" bg="bg-purple-500" />
                                        </div>
                                        <div onClick={() => setViewMode('OBL')} className="cursor-pointer group p-2 -mx-2 rounded transition hover:bg-gray-800 border border-transparent hover:border-gray-700">
                                            <ProgressBar label="OBL Module (73)" current={oblLearned} total={73} color="text-blue-400" bg="bg-blue-500" />
                                        </div>
                                        <div onClick={() => setViewMode('PBL')} className="cursor-pointer group p-2 -mx-2 rounded transition hover:bg-gray-800 border border-transparent hover:border-gray-700">
                                            <ProgressBar label="PBL Module (1934)" current={pblLearned} total={1934} color="text-pink-400" bg="bg-pink-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 lg:col-span-2">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="relative min-h-[300px] rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                                        <h3 className="mb-4 flex items-center text-sm font-bold tracking-wider text-gray-400 uppercase">WCA Stats <span className="ml-1 text-gray-600">({solves.length} solves)</span></h3>
                                        {isCrunching ? <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-gray-900/80 backdrop-blur-sm"><Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-500" /></div> : null}
                                        {metrics ? (
                                            <div className="font-mono text-base">
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                                                    {[{ label: 'Single', data: metrics.single }, { label: 'Mo3', data: metrics.mo3 }, { label: 'Ao5', data: metrics.ao5 }, { label: 'Ao12', data: metrics.ao12 }, { label: 'Ao25', data: metrics.ao25 }, { label: 'Ao50', data: metrics.ao50 }, { label: 'Ao100', data: metrics.ao100 }, { label: 'Ao200', data: metrics.ao200 }].map(row => {
                                                        if (!row.data || row.data.best === '-') return null;
                                                        // TS FIX: Check for row.data safely
                                                        return (
                                                            <div key={row.label} onClick={() => { if (row.data) setSelectedRecord({ label: row.label, avg: row.data.best, solves: row.data.solves || [] }); }} className="group flex cursor-pointer items-center justify-between rounded border-b border-gray-800/30 px-2 py-1.5 transition hover:bg-gray-800/50">
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
                                        ) : (<div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-800 text-sm text-gray-600 italic">No session data available.</div>)}
                                    </div>

                                    <div className="h-fit rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                                        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-gray-400 uppercase"><ShieldAlert className="h-4 w-4 text-amber-500" /> Case Audit</h3>
                                        <div className="mb-4 flex rounded-lg border border-gray-800 bg-black p-1">
                                            {['CSP', 'OBL', 'PBL'].map(f => (
                                                <button key={f} onClick={() => setAuditFilter(f as 'CSP' | 'OBL' | 'PBL')} className={`flex-1 py-1.5 text-xs font-bold rounded transition ${auditFilter === f ? 'bg-amber-600 text-white' : 'text-gray-500 hover:text-white'}`}>{f}</button>
                                            ))}
                                        </div>
                                        <div className="space-y-3 rounded-lg border border-gray-800 bg-gray-950 p-4 font-mono text-xs text-gray-400">
                                            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                                                <span className="text-gray-500">Average Time</span>
                                                <span className="text-lg font-bold text-yellow-400">{auditParsed[auditFilter].avg}s</span>
                                            </div>
                                            {auditFilter === 'CSP' && (
                                                <div className="mb-2 flex gap-2">
                                                    <div className="flex flex-1 justify-between rounded bg-emerald-950/30 p-2"><span className="text-emerald-500">Good</span><span className="font-bold text-emerald-400">{auditParsed.CSP.good}</span></div>
                                                    <div className="flex flex-1 justify-between rounded bg-red-950/30 p-2"><span className="text-red-500">Failed</span><span className="font-bold text-red-400">{auditParsed.CSP.bad}</span></div>
                                                </div>
                                            )}
                                            <div className="mt-2 space-y-1">
                                                <div className="mb-1 tracking-widest text-[10px] text-gray-500 uppercase">Most Frequent Cases</div>
                                                {auditParsed[auditFilter].top.length === 0 ? <span className="text-gray-600 italic">No cases recorded.</span> : auditParsed[auditFilter].top.map(t => <div key={t[0]} className="flex justify-between text-xs text-blue-400"><span>{t[0]}</span><span>{t[1]}x</span></div>)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DashboardView solves={solves} viewMode={blockFilter as BlockMode} />
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-white"><Trophy className="text-yellow-500" /> Absolute Personal Records</h2>
                            </div>
                            {isCalculatingPrs ? (
                                <div className="flex flex-col items-center justify-center py-16 text-gray-400"><Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-500" /></div>
                            ) : prs.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No records found. Import data or enter solves manually.</p>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                    {prs.map((pr) => (
                                        <div key={pr.type} onClick={() => setSelectedRecord({ label: pr.type, avg: pr.time, solves: pr.solves })} className="flex flex-col rounded-lg border border-gray-800 bg-gray-950 p-4 transition hover:border-emerald-900/50 hover:bg-gray-900 cursor-pointer group">
                                            <span className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase transition group-hover:text-emerald-400">{pr.type}</span>
                                            <span className="mb-2 text-3xl leading-none font-black text-white">{pr.time}s</span>
                                            <span className="self-start rounded border border-gray-800 bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">{pr.date}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {viewMode === 'Daily' && <DailyHistoryView />}
                {viewMode === 'CSP' && <CaseManager category="CSP" />}
                {viewMode === 'OBL' && <CaseManager category="OBL" />}
                {viewMode === 'PBL' && <CaseManager category="PBL" />}
                {viewMode === 'Historical' && <HistoricalRecords currentSession={blockFilter} />}
            </main>

            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
                    <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-950 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 p-6">
                            <div>
                                <h2 className="text-2xl font-black text-white">{selectedRecord.label}: <span className="text-emerald-400">{selectedRecord.avg}s</span></h2>
                                <p className="mt-1 font-mono text-xs text-gray-500">From date: {selectedRecord.solves[selectedRecord.solves.length - 1]?.dateStr}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={copyToClipboard} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-500"><Copy className="h-4 w-4" /> <span className="hidden sm:inline">Copy Scrambles</span></button>
                                <button onClick={() => setSelectedRecord(null)} className="rounded-lg border border-gray-800 bg-gray-950 p-2 text-gray-500 transition hover:text-white"><X className="h-5 w-5" /></button>
                            </div>
                        </div>
                        <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-6">
                            {selectedRecord.solves.length > 100 ? (
                                <div className="flex h-32 items-center justify-center rounded-lg border border-gray-800 bg-gray-900"><p className="font-bold text-yellow-500 italic">This average is too large to render the detailed list.</p></div>
                            ) : (
                                selectedRecord.solves.map((s, i) => (
                                    <div key={i} className="flex gap-4 rounded-lg border border-gray-800 bg-gray-900 p-3 font-mono text-sm transition hover:border-gray-600">
                                        <span className="w-6 text-right font-bold text-gray-600">{i + 1}.</span>
                                        <span className="w-14 font-black text-blue-400">{Number(s.time).toFixed(2)}</span>
                                        <span className="flex-1 leading-relaxed break-words text-[11px] text-gray-400">{s.scramble}</span>
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