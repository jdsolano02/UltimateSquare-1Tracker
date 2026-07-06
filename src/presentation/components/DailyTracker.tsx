import { useState, useEffect } from 'react';
import { db, type DailyLog, type ExerciseType, type CaseStatus } from '../../infrastructure/database/db';
import { Activity, Brain, Save, X, Dumbbell, ClipboardList, CheckCircle2 } from 'lucide-react';

export const DailyTracker = ({ selectedDate }: { selectedDate: string }) => {
    const [log, setLog] = useState<DailyLog>({
        dateStr: selectedDate,
        exercise: 'None',
        mentalEnergy: 8,
        notes: '',
        labCases: []
    });

    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchDailyLog = async () => {
            const data = await db.logs.get(selectedDate);
            if (isMounted) {
                setIsSaved(false); // Movido aquí adentro de la resolución asíncrona para evitar renders en cascada
                if (data) {
                    setLog(data);
                } else {
                    setLog({ dateStr: selectedDate, exercise: 'None', mentalEnergy: 8, notes: '', labCases: [] });
                }
            }
        };

        fetchDailyLog();
        return () => { isMounted = false; };
    }, [selectedDate]);

    const addCase = (category: 'OBL' | 'CSP' | 'EP') => {
        setLog(prev => ({
            ...prev,
            labCases: [...(prev.labCases || []), { category, caseName: '', state: 'Learning', notes: '' }]
        }));
    };

    const removeCase = (indexToRemove: number) => {
        setLog(prev => ({
            ...prev,
            labCases: prev.labCases?.filter((_, index) => index !== indexToRemove)
        }));
    };

    const saveLog = async () => {
        await db.logs.put({ ...log, dateStr: selectedDate });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    return (
        <div className="space-y-6 rounded-xl border border-gray-800 bg-gray-950 p-6">

            {/* BIOMETRICS SECTION */}
            <div className="space-y-4">
                <h2 className="flex items-center gap-2 border-b border-gray-800 pb-2 text-sm font-bold tracking-wider text-emerald-500 uppercase">
                    <Activity className="h-4 w-4" /> Biometrics & Status
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><Dumbbell className="h-3 w-3" /> Exercise</label>
                        <select
                            value={log.exercise}
                            onChange={e => setLog({ ...log, exercise: e.target.value as ExerciseType })}
                            className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white mt-1 focus:border-blue-500 outline-none"
                        >
                            <option value="None">None</option>
                            <option value="Lifting">Lifting</option>
                            <option value="Cardio">Cardio</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><Brain className="h-3 w-3" /> Energy (1-10)</label>
                        <input
                            type="number" min="1" max="10"
                            value={log.mentalEnergy}
                            onChange={e => setLog({ ...log, mentalEnergy: Number(e.target.value) })}
                            className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white mt-1 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Daily Notes</label>
                    <textarea
                        value={log.notes}
                        onChange={e => setLog({ ...log, notes: e.target.value })}
                        placeholder="How did the session feel? Any breakthroughs?"
                        className="w-full bg-black border border-gray-800 rounded-lg p-2.5 text-white mt-1 h-20 focus:border-blue-500 outline-none custom-scrollbar"
                    />
                </div>
            </div>

            {/* LABORATORY SECTION */}
            <div className="border-t border-gray-800 pt-4">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-bold tracking-wider text-blue-400 uppercase">
                        <ClipboardList className="h-4 w-4" /> Laboratory
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => addCase('OBL')} className="text-[10px] font-bold bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-800/50 hover:bg-blue-900/60">+ OBL</button>
                        <button onClick={() => addCase('CSP')} className="text-[10px] font-bold bg-purple-900/30 text-purple-400 px-2 py-1 rounded border border-purple-800/50 hover:bg-purple-900/60">+ CSP</button>
                        <button onClick={() => addCase('EP')} className="text-[10px] font-bold bg-amber-900/30 text-amber-400 px-2 py-1 rounded border border-amber-800/50 hover:bg-amber-900/60">+ EP</button>
                    </div>
                </div>

                <div className="custom-scrollbar max-h-48 space-y-2 overflow-y-auto pr-1">
                    {log.labCases.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 p-2">
                            <span className={`text-[10px] font-bold w-8 text-center ${c.category === 'OBL' ? 'text-blue-400' : c.category === 'CSP' ? 'text-purple-400' : 'text-amber-400'}`}>{c.category}</span>
                            <input
                                placeholder="Case name"
                                value={c.caseName}
                                onChange={e => {
                                    const newC = [...log.labCases];
                                    newC[i].caseName = e.target.value;
                                    setLog({ ...log, labCases: newC });
                                }}
                                className="bg-black border border-gray-800 rounded p-1.5 text-xs text-white flex-1 outline-none focus:border-gray-500"
                            />
                            <select
                                value={c.state}
                                onChange={e => {
                                    const newC = [...log.labCases];
                                    newC[i].state = e.target.value as CaseStatus;
                                    setLog({ ...log, labCases: newC });
                                }}
                                className="bg-black border border-gray-800 rounded p-1.5 text-xs text-white outline-none focus:border-gray-500"
                            >
                                <option value="Learning">Learning</option>
                                <option value="Drill">Drill</option>
                                <option value="Mastered">Mastered</option>
                            </select>
                            <button onClick={() => removeCase(i)} className="text-gray-600 hover:text-red-500 transition p-1"><X className="h-4 w-4" /></button>
                        </div>
                    ))}
                    {log.labCases.length === 0 && <p className="py-4 text-center text-xs text-gray-600 italic">No cases scheduled for today.</p>}
                </div>
            </div>

            <button
                onClick={saveLog}
                className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-bold text-white transition ${isSaved ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'}`}
            >
                {isSaved ? <><CheckCircle2 className="h-5 w-5" /> Saved Successfully</> : <><Save className="h-5 w-5" /> Save Daily Log</>}
            </button>
        </div>
    );
};