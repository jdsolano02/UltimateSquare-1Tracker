import { useState, useEffect } from 'react';
import { db } from '../../infrastructure/database/db';
import { Calendar as CalendarIcon, Trophy, Loader2, X, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { useSessionMetrics } from '../hooks/useSessionMetrics';
import type { Solve } from '../../domain/entities/Solve';

interface MetricStat { best: string; solves: Solve[]; }

interface SessionMetricsData {
    totalSolves: number;
    globalAvg: { result: string };
    single: MetricStat; mo3?: MetricStat; ao5?: MetricStat; ao12?: MetricStat; ao50?: MetricStat;
    ao100?: MetricStat; ao200?: MetricStat; ao500?: MetricStat; ao1000?: MetricStat;
    ao2000?: MetricStat; ao3000?: MetricStat; ao4000?: MetricStat; ao5000?: MetricStat; ao10000?: MetricStat;
    [key: string]: MetricStat | number | { result: string } | undefined;
}

export const DailyHistoryView = () => {
    const [solveDates, setSolveDates] = useState<Set<string>>(new Set());
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    const [metrics, setMetrics] = useState<SessionMetricsData | null>(null);
    const [isCrunching, setIsCrunching] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<{ label: string, avg: string, solves: Solve[] } | null>(null);

    const solves = useSessionMetrics('Diario', selectedDate);

    useEffect(() => {
        const fetchDates = async () => {
            const keys = await db.solves.orderBy('dateStr').uniqueKeys();
            setSolveDates(new Set(keys as string[]));
            if (keys.length > 0 && !selectedDate) {
                const latestDate = keys[keys.length - 1] as string;
                setSelectedDate(latestDate);
                setCurrentMonth(new Date(`${latestDate}T00:00:00`)); // Ajusta el calendario al mes del último solve
            }
        };
        fetchDates();
    }, []);

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
                for (const s of validSolves) {
                    if (Number(s.time) < Number(bestSingleSolve.time)) bestSingleSolve = s;
                }

                const newMetrics: SessionMetricsData = {
                    totalSolves: times.length,
                    globalAvg: { result: globalAvgResult },
                    single: { best: Number(bestSingleSolve.time).toFixed(2), solves: [bestSingleSolve] }
                };

                const categories = [
                    { label: 'mo3', size: 3 }, { label: 'ao5', size: 5 }, { label: 'ao12', size: 12 }, { label: 'ao50', size: 50 }, { label: 'ao100', size: 100 },
                    { label: 'ao200', size: 200 }, { label: 'ao500', size: 500 }, { label: 'ao1000', size: 1000 }, { label: 'ao2000', size: 2000 }, { label: 'ao5000', size: 5000 }
                ];

                const computeSingleAvg = (wTimes: number[], size: number) => {
                    if (size === 3) return wTimes.reduce((a, b) => a + b, 0) / 3;
                    const trim = Math.ceil(size * 0.05);
                    const sorted = [...wTimes].sort((a, b) => a - b);
                    const trimmed = sorted.slice(trim, size - trim);
                    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
                };

                for (const cat of categories) {
                    if (!isMounted) return;
                    if (times.length < cat.size) { newMetrics[cat.label] = { best: '-', solves: [] }; continue; }
                    let best = Infinity, bestWindow: Solve[] = [];
                    for (let i = 0; i <= times.length - cat.size; i++) {
                        const avg = computeSingleAvg(times.slice(i, i + cat.size), cat.size);
                        if (avg < best) { best = avg; bestWindow = validSolves.slice(i, i + cat.size); }
                        if (i % 400 === 0) { await new Promise(r => setTimeout(r, 0)); if (!isMounted) return; }
                    }
                    newMetrics[cat.label] = { best: best === Infinity ? '-' : best.toFixed(2), solves: bestWindow };
                }
                if (isMounted) setMetrics(newMetrics);
            } catch (e) { console.error(e); }
            finally { if (isMounted) setIsCrunching(false); }
        };
        computeMetrics();
        return () => { isMounted = false; };
    }, [solves.length]);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const renderCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 sm:h-14"></div>);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const hasSolves = solveDates.has(dateStr);
            const isSelected = selectedDate === dateStr;

            days.push(
                <button
                    key={dateStr}
                    onClick={() => { if (hasSolves) setSelectedDate(dateStr); }}
                    disabled={!hasSolves}
                    className={`h-10 sm:h-14 flex items-center justify-center rounded-lg font-bold text-sm transition-all
                        ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 scale-105'
                            : hasSolves ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800 hover:bg-emerald-800/60'
                                : 'text-gray-700 bg-gray-950 border border-gray-800/50 cursor-not-allowed'}`}
                >
                    {d}
                </button>
            );
        }
        return days;
    };

    const copyToClipboard = () => {
        if (!selectedRecord) return;
        const text = `SQ-1 ${selectedRecord.label}: ${selectedRecord.avg}s\n\n${selectedRecord.solves.map((s, i) => `${i + 1}. ${Number(s.time).toFixed(2)} - ${s.scramble}`).join('\n')}`;
        navigator.clipboard.writeText(text);
        alert("Scrambles copied to clipboard! Ready to share.");
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <h2 className="flex items-center gap-3 text-2xl font-black text-white">
                <CalendarIcon className="h-8 w-8 text-blue-500" /> Training Calendar
            </h2>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="h-fit rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                    <div className="mb-6 flex items-center justify-between">
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-400"><ChevronLeft className="h-5 w-5" /></button>
                        <h3 className="text-lg font-bold tracking-widest text-white uppercase">
                            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </h3>
                        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-gray-400"><ChevronRight className="h-5 w-5" /></button>
                    </div>
                    <div className="mb-2 grid grid-cols-7 gap-2 text-center font-bold tracking-wider text-[10px] text-gray-500 uppercase">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {renderCalendarDays()}
                    </div>
                </div>

                <div className="relative flex min-h-[400px] flex-col rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                    {isCrunching ? (
                        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center rounded-xl bg-gray-900/80 text-gray-400 backdrop-blur-sm">
                            <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-500" />
                            <span className="text-sm font-bold tracking-wider uppercase">Crunching Averages...</span>
                        </div>
                    ) : metrics && metrics.totalSolves > 0 ? (
                        <div className="flex flex-1 flex-col">
                            <h3 className="mb-4 flex items-center gap-2 border-b border-gray-800 pb-4 text-sm font-bold tracking-wider text-yellow-500 uppercase">
                                <Trophy className="h-5 w-5" />
                                {selectedDate} <span className="ml-auto text-gray-500">({metrics.totalSolves} solves)</span>
                            </h3>
                            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-1 font-mono text-base">
                                {[
                                    { label: 'Single', data: metrics.single }, { label: 'Mo3', data: metrics.mo3 },
                                    { label: 'Ao5', data: metrics.ao5 }, { label: 'Ao12', data: metrics.ao12 },
                                    { label: 'Ao50', data: metrics.ao50 }, { label: 'Ao100', data: metrics.ao100 },
                                    { label: 'Ao200', data: metrics.ao200 }, { label: 'Ao500', data: metrics.ao500 },
                                    { label: 'Ao1000', data: metrics.ao1000 }, { label: 'Ao5000', data: metrics.ao5000 }
                                ].map(row => {
                                    if (!row.data || row.data.best === '-') return null;
                                    return (
                                        <div key={row.label} onClick={() => { if (row.data) setSelectedRecord({ label: row.label, avg: row.data.best, solves: row.data.solves || [] }); }} className="flex justify-between items-center py-2 border-b border-gray-800/30 transition hover:bg-gray-800/50 px-2 rounded cursor-pointer group">
                                            <span className="text-sm font-bold text-gray-400 transition group-hover:text-white">{row.label}</span>
                                            <span className="font-bold text-emerald-400">{row.data.best}s</span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="mt-4 flex items-end justify-between rounded-lg border border-gray-800 bg-gray-950 p-4">
                                <span className="text-sm font-bold tracking-wider text-gray-400 uppercase">Daily Global Avg</span>
                                <span className="text-3xl font-black text-blue-400">{metrics.globalAvg.result}s</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-full flex-1 items-center justify-center text-sm text-gray-500 italic">
                            Select a highlighted date from the calendar.
                        </div>
                    )}
                </div>
            </div>

            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
                    <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-950 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 p-6">
                            <div>
                                <h2 className="text-2xl font-black text-white">{selectedRecord.label}: <span className="text-emerald-400">{selectedRecord.avg}s</span></h2>
                                <p className="mt-1 font-mono text-xs text-gray-500">From date: {selectedRecord.solves[selectedRecord.solves.length - 1]?.dateStr}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={copyToClipboard} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-500">
                                    <Copy className="h-4 w-4" /> <span className="hidden sm:inline">Copy Scrambles</span>
                                </button>
                                <button onClick={() => setSelectedRecord(null)} className="rounded-lg border border-gray-800 bg-gray-950 p-2 text-gray-500 transition hover:text-white">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-6">
                            {selectedRecord.solves.length > 100 ? (
                                <div className="flex h-32 items-center justify-center rounded-lg border border-gray-800 bg-gray-900">
                                    <p className="font-bold text-yellow-500 italic">This average is too large to render the detailed list.</p>
                                </div>
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
};