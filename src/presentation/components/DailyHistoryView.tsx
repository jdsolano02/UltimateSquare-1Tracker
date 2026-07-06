import { useState, useEffect } from 'react';
import { db } from '../../infrastructure/database/db';
import { Calendar, Trophy } from 'lucide-react';
import { useSessionMetrics } from '../hooks/useSessionMetrics';

export const DailyHistoryView = () => {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');

    const sessionData = useSessionMetrics('Diario', selectedDate);
    const metrics = sessionData?.metrics || null;

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

    return (
        <div className="mx-auto max-w-4xl rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-black text-white">
                <Calendar className="text-blue-500" /> Daily Performance History
            </h2>
            
            <div className="mb-8 rounded-xl border border-gray-800 bg-gray-950 p-4">
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
                    {metrics && metrics.totalSolves > 0 ? (
                        <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-yellow-500 uppercase">
                                <Trophy className="h-5 w-5" /> Session Metrics <span className="ml-1 text-gray-500">({metrics.totalSolves} solves)</span>
                            </h3>
                            
                            <div className="space-y-3 font-mono text-base">
                                <div className="grid grid-cols-3 gap-4 border-b border-gray-800 pb-2 text-xs font-bold tracking-widest text-gray-500 uppercase">
                                    <span>Category</span><span>Current</span><span>Best</span>
                                </div>
                                {[
                                    { label: 'Single', data: { current: '-', best: metrics.single.best, currentSigma: '', bestSigma: '' } },
                                    { label: 'Mo3', data: metrics.mo3 },
                                    { label: 'Ao5', data: metrics.ao5 },
                                    { label: 'Ao12', data: metrics.ao12 },
                                    { label: 'Ao100', data: metrics.ao100 }
                                ].map(row => (
                                    <div key={row.label} className="grid grid-cols-3 items-center gap-4 border-b border-gray-800/50 py-2 last:border-0">
                                        <span className="font-bold text-gray-400">{row.label}</span>
                                        {row.data ? (
                                            <>
                                                <span className="font-semibold text-white">
                                                    {row.data.current} <span className="ml-1 text-xs text-gray-600">{row.data.currentSigma && `(${row.data.currentSigma})`}</span>
                                                </span>
                                                <span className="font-bold text-emerald-400">
                                                    {row.data.best} <span className="ml-1 text-xs text-gray-600">{row.data.bestSigma && `(${row.data.bestSigma})`}</span>
                                                </span>
                                            </>
                                        ) : (
                                            <><span className="text-gray-600">-</span><span className="text-gray-600">-</span></>
                                        )}
                                    </div>
                                ))}
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
        </div>
    );
};