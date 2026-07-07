import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../infrastructure/database/db';
import { Calendar, Target, BookOpen, Grid3X3, Activity, ShieldAlert } from 'lucide-react';
import type { Solve } from '../../domain/entities/Solve';

export const DailyHistoryView = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(todayStr);

    const allSolves = useLiveQuery(() => db.solves.orderBy('dateStr').reverse().toArray()) || [];
    const uniqueDates = Array.from(new Set(allSolves.map(s => s.dateStr)));

    // ¡Mejor práctica de React! Calculamos al vuelo en lugar de usar useEffect
    const dailySolves = allSolves.filter(s => s.dateStr === selectedDate);

    const countMatches = (regex: RegExp) => dailySolves.filter(s => s.comment?.toLowerCase().match(regex)).length;

    const cspCount = countMatches(/csp/);
    const oblCount = countMatches(/obl/);
    const pblCount = countMatches(/pbl/);

    const calcAvg = (arr: Solve[]) => {
        const valid = arr.filter(s => Number(s.time) > 0);
        if (valid.length === 0) return '0.00';
        return (valid.reduce((acc, s) => acc + Number(s.time), 0) / valid.length).toFixed(2);
    };

    const [auditFilter, setAuditFilter] = useState<'CSP' | 'OBL' | 'PBL'>('CSP');

    // Audit Metrics strictly filtered for the daily solves
    const auditSolves = dailySolves.filter(s => s.comment && s.comment.trim() !== '');
    const auditParsed = {
        CSP: {
            good: auditSolves.filter(s => s.comment?.toLowerCase().includes('csp') && s.comment?.toLowerCase().match(/(good|correcto|bien|✓)/)).length,
            bad: auditSolves.filter(s => s.comment?.toLowerCase().includes('csp') && s.comment?.toLowerCase().match(/(bad|error|mal|fail|x)/)).length
        },
        OBL: {
            good: auditSolves.filter(s => s.comment?.toLowerCase().includes('obl') && s.comment?.toLowerCase().match(/(good|correcto|bien|✓)/)).length,
            bad: auditSolves.filter(s => s.comment?.toLowerCase().includes('obl') && s.comment?.toLowerCase().match(/(bad|error|mal|fail|x)/)).length
        },
        PBL: {
            good: auditSolves.filter(s => s.comment?.toLowerCase().includes('pbl') && s.comment?.toLowerCase().match(/(good|correcto|bien|✓)/)).length,
            bad: auditSolves.filter(s => s.comment?.toLowerCase().includes('pbl') && s.comment?.toLowerCase().match(/(bad|error|mal|fail|x)/)).length
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl sm:flex-row">
                <h2 className="flex items-center gap-2 text-2xl font-black text-white">
                    <Calendar className="text-blue-500" /> Daily Breakdown
                </h2>
                <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-black border border-gray-700 text-white font-bold rounded-lg p-2.5 outline-none focus:border-blue-500 transition w-full sm:w-64"
                >
                    {uniqueDates.length === 0 && <option value={todayStr}>{todayStr}</option>}
                    {uniqueDates.map(d => <option key={d} value={d}>{d === todayStr ? 'Today' : d}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 p-6 text-center shadow-xl">
                    <Activity className="mb-2 h-8 w-8 text-emerald-500" />
                    <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Total Solves</span>
                    <span className="mt-1 text-4xl font-black text-white">{dailySolves.length}</span>
                    <span className="mt-2 font-mono text-sm text-emerald-400">{calcAvg(dailySolves)}s avg</span>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 p-6 text-center shadow-xl">
                    <Target className="mb-2 h-8 w-8 text-purple-500" />
                    <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">CSP Cases</span>
                    <span className="mt-1 text-4xl font-black text-white">{cspCount}</span>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 p-6 text-center shadow-xl">
                    <BookOpen className="mb-2 h-8 w-8 text-blue-500" />
                    <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">OBL Cases</span>
                    <span className="mt-1 text-4xl font-black text-white">{oblCount}</span>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 p-6 text-center shadow-xl">
                    <Grid3X3 className="mb-2 h-8 w-8 text-pink-500" />
                    <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">PBL Cases</span>
                    <span className="mt-1 text-4xl font-black text-white">{pblCount}</span>
                </div>
            </div>

            {/* DAILY CASE AUDIT */}
            <div className="h-fit rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold tracking-wider text-gray-400 uppercase">
                        <ShieldAlert className="h-4 w-4 text-amber-500" /> Case Audit ({selectedDate})
                    </h3>
                </div>
                <div className="flex flex-col gap-6 md:flex-row">
                    <div className="flex h-10 w-full rounded-lg border border-gray-800 bg-black p-1 md:w-1/3">
                        {['CSP', 'OBL', 'PBL'].map(f => (
                            <button key={f} onClick={() => setAuditFilter(f as 'CSP' | 'OBL' | 'PBL')} className={`flex-1 py-1.5 text-xs font-bold rounded transition ${auditFilter === f ? 'bg-amber-600 text-white' : 'text-gray-500 hover:text-white'}`}>
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="flex w-full flex-col gap-4 sm:flex-row md:w-2/3">
                        <div className="flex flex-1 items-center justify-between rounded border border-emerald-900/50 bg-emerald-950/30 p-3"><span className="text-sm font-bold text-emerald-500">Correct (Good)</span><span className="text-xl font-bold text-emerald-400">{auditParsed[auditFilter].good}</span></div>
                        <div className="flex flex-1 items-center justify-between rounded border border-red-900/50 bg-red-950/30 p-3"><span className="text-sm font-bold text-red-500">Failed (Bad)</span><span className="text-xl font-bold text-red-400">{auditParsed[auditFilter].bad}</span></div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-400 uppercase">Solves Log ({selectedDate})</h3>
                <div className="custom-scrollbar max-h-96 space-y-2 overflow-y-auto pr-2">
                    {dailySolves.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No solves recorded on this date.</p>
                    ) : (
                        dailySolves.map((s, i) => (
                            <div key={i} className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-black p-3 transition hover:border-gray-600 sm:flex-row sm:items-center">
                                <span className="w-16 font-black text-blue-400">{Number(s.time).toFixed(2)}</span>
                                <span className="flex-1 font-mono leading-relaxed break-words text-[11px] text-gray-500">{s.scramble}</span>
                                {s.comment && (
                                    <span className="rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-gray-300">
                                        {s.comment}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};