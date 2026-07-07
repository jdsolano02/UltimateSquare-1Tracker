import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../infrastructure/database/db';
import { Calendar as CalendarIcon, Target, BookOpen, Grid3X3, Activity, ShieldAlert, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Solve } from '../../domain/entities/Solve';

// Sincronización perfecta de zona horaria
const getLocalDateStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

// --- MINI CALENDARIO COMPONENT ---
const CustomDatePicker = ({ selectedDate, onChange, activeDates }: { selectedDate: string, onChange: (date: string) => void, activeDates: Set<string> }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        const [y, m] = selectedDate.split('-');
        return new Date(parseInt(y), parseInt(m) - 1, 1);
    });

    const toggleCalendar = () => setIsOpen(!isOpen);
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
    const todayStr = getLocalDateStr();

    return (
        <div className="relative">
            <button onClick={toggleCalendar} className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-700 bg-black p-2.5 px-4 font-bold text-white transition outline-none hover:border-blue-500 focus:border-blue-500 sm:w-auto sm:justify-start">
                <span>{selectedDate === todayStr ? 'Today, ' + selectedDate : selectedDate}</span>
                <CalendarIcon className="h-4 w-4 text-blue-500" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-gray-700 bg-gray-950 p-4 shadow-2xl sm:right-auto">
                        <div className="mb-4 flex items-center justify-between">
                            <button onClick={prevMonth} className="rounded p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"><ChevronLeft className="h-5 w-5" /></button>
                            <span className="text-sm font-bold text-white">{viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={nextMonth} className="rounded p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"><ChevronRight className="h-5 w-5" /></button>
                        </div>
                        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="font-bold tracking-widest text-[10px] text-gray-500 uppercase">{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {days.map((day, idx) => {
                                if (!day) return <div key={idx}></div>;
                                const pad = (n: number) => n.toString().padStart(2, '0');
                                const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
                                const isSelected = dateStr === selectedDate;
                                const hasSolves = activeDates.has(dateStr);
                                const isToday = dateStr === todayStr;

                                let btnClass = "h-8 w-8 rounded-md flex items-center justify-center text-xs transition-all ";

                                if (isSelected) {
                                    btnClass += "bg-blue-600 text-white font-black shadow-lg shadow-blue-900/30";
                                } else if (hasSolves) {
                                    btnClass += "bg-emerald-900/30 text-emerald-400 border border-emerald-500/40 font-bold hover:bg-emerald-800/50";
                                } else {
                                    btnClass += "text-gray-400 hover:bg-gray-800 hover:text-white";
                                }
                                if (isToday && !isSelected) btnClass += " underline decoration-blue-500 decoration-2 underline-offset-4";

                                return (
                                    <div key={idx} className="flex items-center justify-center">
                                        <button onClick={() => { onChange(dateStr); setIsOpen(false); }} className={btnClass}>{day}</button>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-gray-800 pt-3">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                <span className="tracking-wider text-[10px] text-gray-500 uppercase">Has Solves</span>
                            </div>
                            <button onClick={() => { onChange(todayStr); setIsOpen(false); setViewDate(new Date()); }} className="text-xs font-bold text-blue-400 transition hover:text-blue-300">Go to Today</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
// --- FIN MINI CALENDARIO ---


export const DailyHistoryView = () => {
    const todayStr = getLocalDateStr();
    const [selectedDate, setSelectedDate] = useState(todayStr);

    const allSolves = useLiveQuery(() => db.solves.orderBy('dateStr').reverse().toArray()) || [];

    const activeDates = new Set(allSolves.map(s => s.dateStr));

    const dailySolves = allSolves.filter(s => s.dateStr === selectedDate);
    const savedCases = useLiveQuery(() => db.cases.toArray()) || [];

    // FIX: Variable renombrada correctamente a casesUpdatedToday
    const casesUpdatedToday = savedCases.filter(c => {
        const record = c as unknown as { dateUpdated?: string, status: string, category: string, caseName: string };
        return record.dateUpdated === selectedDate;
    });

    const cspCount = dailySolves.filter(s => s.comment?.toLowerCase().match(/csp/)).length;
    const oblCount = dailySolves.filter(s => s.comment?.toLowerCase().match(/obl/)).length;
    const pblCount = dailySolves.filter(s => s.comment?.toLowerCase().match(/pbl/)).length;

    const calcAvg = (arr: number[], size: number) => {
        if (arr.length < size) return '-';
        let best = Infinity;
        for (let i = 0; i <= arr.length - size; i++) {
            const window = arr.slice(i, i + size);
            if (size === 3) {
                const a = window.reduce((a, b) => a + b, 0) / 3;
                if (a < best) best = a;
            } else {
                const trim = Math.ceil(size * 0.05);
                const sorted = [...window].sort((a, b) => a - b);
                const trimmed = sorted.slice(trim, size - trim);
                const a = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
                if (a < best) best = a;
            }
        }
        return best === Infinity ? '-' : best.toFixed(2);
    };

    const validTimes = dailySolves.filter(s => Number(s.time) > 0).map(s => Number(s.time));
    const dailyBestSingle = validTimes.length > 0 ? Math.min(...validTimes).toFixed(2) : '-';
    const dailyMean = validTimes.length > 0 ? (validTimes.reduce((a, b) => a + b, 0) / validTimes.length).toFixed(2) : '-';

    const [auditFilter, setAuditFilter] = useState<'CSP' | 'OBL' | 'PBL'>('CSP');

    const analyzeDailyAudit = (solvesArray: Solve[]) => {
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
                let clean = s.comment.replace(/\[|\]/g, '').replace(new RegExp(kw, 'i'), '').replace(/(good|bad|correcto|error|mal|fail|bien|x|✓)/gi, '').trim();
                if (!clean || clean === '-' || clean === '/') clean = 'Unknown';
                counts[clean] = (counts[clean] || 0) + 1;
            });
            const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            return { total: f.length, avg, good, bad, top };
        };
        return { CSP: getStats('csp', true), OBL: getStats('obl', false), PBL: getStats('pbl', false) };
    };
    const auditParsed = analyzeDailyAudit(dailySolves);

    const handleEditComment = async (id: number, old: string = '') => {
        const nc = prompt("Edit comment:", old);
        if (nc !== null) await db.solves.update(id, { comment: nc });
    };

    const handleDelete = async (id: number) => {
        if (confirm("Delete this solve permanently?")) await db.solves.delete(id);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Mastered': return 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50';
            case 'Drill': return 'bg-yellow-900/30 text-yellow-400 border-yellow-500/50';
            case 'Learning': return 'bg-orange-900/30 text-orange-400 border-orange-500/50';
            default: return 'bg-gray-900/30 text-gray-400 border-gray-600/50 line-through opacity-70';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl sm:flex-row">
                <h2 className="flex items-center gap-2 text-2xl font-black text-white"><CalendarIcon className="text-blue-500" /> Daily Tracker</h2>
                <CustomDatePicker selectedDate={selectedDate} onChange={setSelectedDate} activeDates={activeDates} />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="flex flex-col items-center justify-center rounded-xl border border-gray-800 bg-gray-900 p-6 text-center shadow-xl">
                    <Activity className="mb-2 h-8 w-8 text-emerald-500" />
                    <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Total Solves</span>
                    <span className="mt-1 text-4xl font-black text-white">{dailySolves.length}</span>
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

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <h3 className="mb-4 text-center text-sm font-bold tracking-wider text-gray-400 uppercase">Best Times of {selectedDate}</h3>
                <div className="grid grid-cols-3 gap-2 text-center font-mono sm:grid-cols-5 md:grid-cols-9">
                    {[
                        { label: 'Single', val: dailyBestSingle }, { label: 'Mo3', val: calcAvg(validTimes, 3) },
                        { label: 'Ao5', val: calcAvg(validTimes, 5) }, { label: 'Ao12', val: calcAvg(validTimes, 12) },
                        { label: 'Ao25', val: calcAvg(validTimes, 25) }, { label: 'Ao50', val: calcAvg(validTimes, 50) },
                        { label: 'Ao100', val: calcAvg(validTimes, 100) }, { label: 'Ao200', val: calcAvg(validTimes, 200) },
                        { label: 'Daily Avg', val: dailyMean }
                    ].map(st => (
                        <div key={st.label} className="flex flex-col justify-center rounded border border-gray-800 bg-black p-2">
                            <span className="mb-1 tracking-widest text-[10px] text-gray-500 uppercase">{st.label}</span>
                            <span className="font-bold text-emerald-400">{st.val}s</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="h-fit rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-gray-400 uppercase"><ShieldAlert className="h-4 w-4 text-amber-500" /> Daily Case Audit</h3>
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
                            <div className="mb-1 tracking-widest text-[10px] text-gray-500 uppercase">Most Frequent Cases Today</div>
                            {auditParsed[auditFilter].top.length === 0 ? <span className="text-gray-600 italic">No cases recorded.</span> : auditParsed[auditFilter].top.map(t => <div key={t[0]} className="flex justify-between text-xs text-blue-400"><span>{t[0]}</span><span>{t[1]}x</span></div>)}
                        </div>
                    </div>
                </div>

                <div className="h-fit rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                    <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-gray-400 uppercase"><BookOpen className="h-4 w-4 text-emerald-500" /> Case Progress Log ({casesUpdatedToday.length})</h3>
                    <div className="custom-scrollbar flex max-h-64 flex-wrap gap-2 overflow-y-auto">
                        {casesUpdatedToday.length === 0 ? <span className="text-sm text-gray-600 italic">No status changes recorded today.</span> : casesUpdatedToday.map((c, i) => (
                            <span key={i} className={`rounded border px-2 py-1 text-[11px] font-bold shadow ${getStatusStyle(c.status)}`}>
                                [{c.category}] {c.caseName} ➔ {c.status}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <details className="group rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <summary className="flex cursor-pointer justify-between font-bold tracking-widest text-gray-400 uppercase outline-none">
                    <span>Solves Log Editor ({dailySolves.length} Solves)</span>
                    <span className="text-blue-500 transition group-open:rotate-180">▼</span>
                </summary>
                <div className="custom-scrollbar mt-4 max-h-96 space-y-2 overflow-y-auto pr-2">
                    {dailySolves.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No solves recorded on this date.</p>
                    ) : (
                        dailySolves.map((s, i) => (
                            <div key={i} className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-black p-3 transition hover:border-gray-600 sm:flex-row sm:items-center">
                                <span className="w-16 font-black text-blue-400">{Number(s.time).toFixed(2)}</span>
                                <span className="flex-1 font-mono leading-relaxed break-words text-[11px] text-gray-500">{s.scramble}</span>
                                {s.comment && <span className="rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-gray-300">{s.comment}</span>}
                                <div className="ml-auto flex gap-1">
                                    <button onClick={() => handleEditComment(s.id as number, s.comment)} className="bg-gray-800 p-1.5 rounded text-gray-400 hover:bg-gray-700 hover:text-white transition"><Pencil className="h-3 w-3" /></button>
                                    <button onClick={() => handleDelete(s.id as number)} className="bg-red-900/50 p-1.5 rounded text-red-400 hover:bg-red-600 hover:text-white transition"><Trash2 className="h-3 w-3" /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </details>
        </div>
    );
};