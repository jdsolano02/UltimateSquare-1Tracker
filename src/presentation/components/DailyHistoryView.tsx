import { useState, useEffect } from 'react';
import { db } from '../../infrastructure/database/db';
import { Calendar, Trophy, Loader2, X } from 'lucide-react';
import { useSessionMetrics } from '../hooks/useSessionMetrics';
import type { Solve } from '../../domain/entities/Solve';

// FIX: Usamos Tipos estrictos en lugar de 'any'
interface MetricStat {
    best: string;
    solves: Solve[];
}

interface SessionMetricsData {
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

export const DailyHistoryView = () => {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [metrics, setMetrics] = useState<SessionMetricsData | null>(null); // Reemplazado <any>
    const [isCrunching, setIsCrunching] = useState(false);

    const [selectedRecord, setSelectedRecord] = useState<{ label: string, avg: string, solves: Solve[] } | null>(null);

    const solves = useSessionMetrics('Diario', selectedDate);

    useEffect(() => {
        const fetchAllDates = async () => {
            const solveKeys = await db.solves.orderBy('dateStr').uniqueKeys();
            const uniqueDates = Array.from(new Set(solveKeys)).sort().reverse() as string[];
            setDates(uniqueDates);

            if (uniqueDates.length > 0 && !selectedDate) {
                setSelectedDate(uniqueDates[0]);
            }
        };
        fetchAllDates();
    }, [selectedDate]);

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

                // FIX: Declaramos newMetrics con el Tipo Estricto
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

                        if (i % 400 === 0) {
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
            } catch (e) {
                console.error("Crash Prevented in Daily:", e);
            } finally {
                if (isMounted) setIsCrunching(false);
            }
        };

        computeMetrics();
        return () => { isMounted = false; };
    }, [solves.length]);

    return (
        <div className="relative mx-auto min-h-[400px] max-w-4xl rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-black text-white">
                <Calendar className="text-blue-500" /> Daily Performance History
            </h2>

            <div className="relative z-10 mb-8 rounded-xl border border-gray-800 bg-gray-950 p-4">
                <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Select Training Date</label>
                <select
                    className="w-full cursor-pointer rounded-lg border border-gray-700 bg-black p-3 text-white outline-none focus:border-blue-500"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                >
                    <option value="" disabled>Select a date...</option>
                    {dates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            {selectedDate && (
                <div>
                    {isCrunching ? (
                        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center rounded-xl bg-gray-900/80 pt-24 text-gray-400 backdrop-blur-sm">
                            <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-500" />
                            <span className="text-sm font-bold tracking-wider uppercase">Crunching Daily Averages...</span>
                        </div>
                    ) : metrics && metrics.totalSolves > 0 ? (
                        <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-yellow-500 uppercase">
                                <Trophy className="h-5 w-5" /> Session Metrics <span className="ml-1 text-gray-500">({metrics.totalSolves} solves)</span>
                            </h3>

                            <div className="space-y-1 font-mono text-base">
                                <div className="mb-2 grid grid-cols-2 gap-4 border-b border-gray-800 pb-2 text-xs font-bold tracking-widest text-gray-500 uppercase">
                                    <span>Category</span><span className="text-right">Record Achieved</span>
                                </div>
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
                                            className="grid grid-cols-2 items-center gap-4 rounded border-b border-gray-800/30 px-1 py-1.5 transition last:border-0 hover:bg-gray-800/50 cursor-pointer group"
                                        >
                                            <span className="text-sm font-bold text-gray-400 transition group-hover:text-white">{row.label}</span>
                                            <div className="text-right">
                                                <span className="font-bold text-emerald-400">{row.data.best}s</span>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div className="mt-6 flex items-end justify-between rounded-lg border-t border-gray-700 bg-gray-900 p-4 pt-4">
                                    <span className="text-sm font-bold tracking-wider text-gray-400 uppercase">Daily Global Avg</span>
                                    <span className="text-3xl font-black text-blue-400">{metrics.globalAvg.result}s</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex h-48 items-center justify-center rounded-xl border border-gray-800 bg-gray-950 p-8 text-sm text-gray-500 italic">
                            No speedcubing solves recorded for this date.
                        </div>
                    )}
                </div>
            )}

            {/* MODAL DE TIEMPOS */}
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
};