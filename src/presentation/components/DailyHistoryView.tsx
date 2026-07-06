import { useState, useEffect } from 'react';
import { db, type DailyLog } from '../../infrastructure/database/db';
import { Calendar, Trophy, Activity } from 'lucide-react';
import { useSessionMetrics } from '../hooks/useSessionMetrics';

export const DailyHistoryView = () => {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [log, setLog] = useState<DailyLog | null>(null);

    // Utilizamos nuestro hook maestro para calcular las métricas solo de este día
    const sessionData = useSessionMetrics('Diario', selectedDate);
    const metrics = sessionData?.metrics || null;

    useEffect(() => {
        const fetchAllDates = async () => {
            // Busca fechas tanto en los logs biométricos como en el historial de solves
            const logKeys = await db.logs.orderBy('dateStr').primaryKeys();
            const solveKeys = await db.solves.orderBy('dateStr').uniqueKeys();

            // Une las fechas, quita duplicados y las ordena de más reciente a más antigua
            const uniqueDates = Array.from(new Set([...logKeys, ...solveKeys])).sort().reverse() as string[];
            setDates(uniqueDates);

            // Auto-selecciona el día más reciente si hay datos
            if (uniqueDates.length > 0 && !selectedDate) {
                setSelectedDate(uniqueDates[0]);
            }
        };
        fetchAllDates();
    }, [selectedDate]);

    useEffect(() => {
        if (selectedDate) {
            db.logs.get(selectedDate).then(data => setLog(data || null));
        }
    }, [selectedDate]);

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-black text-white">
                <Calendar className="text-blue-500" /> Daily History
            </h2>

            <div className="mb-6">
                <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">Select Date</label>
                <select
                    className="w-full cursor-pointer rounded-lg border border-gray-700 bg-black p-3 text-white outline-none focus:border-blue-500 md:w-1/2"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                >
                    <option value="" disabled>Select a date...</option>
                    {dates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                {/* COLUMNA 1: LOGS BIOMÉTRICOS Y CASOS DE LABORATORIO */}
                {log ? (
                    <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-emerald-500 uppercase">
                            <Activity className="h-4 w-4" /> Biometrics & Status
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
                                    <span className="block font-bold text-[10px] text-gray-500 uppercase">Exercise</span>
                                    <span className="font-bold text-white">{log.exercise}</span>
                                </div>
                                <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
                                    <span className="block font-bold text-[10px] text-gray-500 uppercase">Mental Energy</span>
                                    <span className="font-bold text-white">{log.mentalEnergy} / 10</span>
                                </div>
                            </div>
                            {log.notes && (
                                <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
                                    <span className="mb-1 block font-bold text-[10px] text-gray-500 uppercase">Notes</span>
                                    <p className="text-sm whitespace-pre-wrap text-gray-300">{log.notes}</p>
                                </div>
                            )}
                            {log.labCases && log.labCases.length > 0 && (
                                <div className="rounded-lg border border-gray-800 bg-gray-900 p-3">
                                    <span className="mb-2 block font-bold text-[10px] text-gray-500 uppercase">Lab Cases Practiced</span>
                                    <div className="space-y-1">
                                        {log.labCases.map((c, idx) => (
                                            <div key={idx} className="flex items-center justify-between rounded border border-gray-800 bg-black p-1.5 text-xs">
                                                <span className="font-bold text-gray-300">{c.category} - {c.caseName}</span>
                                                <span className="font-mono text-emerald-500">{c.state}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center rounded-xl border border-gray-800 bg-gray-950 p-6 text-sm text-gray-500 italic">
                        No biometric log recorded for this date.
                    </div>
                )}

                {/* COLUMNA 2: MÉTRICAS WCA DEL DÍA */}
                {metrics && metrics.totalSolves > 0 ? (
                    <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-yellow-500 uppercase">
                            <Trophy className="h-4 w-4" /> Session Metrics <span className="ml-1 text-gray-500">({metrics.totalSolves} solves)</span>
                        </h3>

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
                                <div key={row.label} className="grid grid-cols-3 items-center gap-2 py-1.5">
                                    <span className="font-bold text-gray-400">{row.label}</span>
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
                            <div className="mt-4 flex items-end justify-between rounded-lg border-t border-gray-800 bg-gray-900 p-3 pt-4">
                                <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">Daily Global Avg</span>
                                <span className="text-2xl font-black text-blue-400">{metrics.globalAvg.result}s</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center rounded-xl border border-gray-800 bg-gray-950 p-6 text-sm text-gray-500 italic">
                        No speedcubing solves recorded for this date.
                    </div>
                )}

            </div>
        </div>
    );
};