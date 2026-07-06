import { useState, useEffect } from 'react';
import { db, type DailyLog, type ExerciseType, type CaseStatus } from '../../infrastructure/database/db';
import { Activity, Brain, Save, X, Dumbbell, ClipboardList } from 'lucide-react';

export const DailyTracker = ({ selectedDate }: { selectedDate: string }) => {
    const [log, setLog] = useState<DailyLog>({
        dateStr: selectedDate,
        exercise: 'None',
        mentalEnergy: 8,
        notes: '',
        labCases: []
    });

    useEffect(() => {
        let isMounted = true;
        const fetchDailyLog = async () => {
            const data = await db.logs.get(selectedDate);
            if (isMounted) {
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
        alert('Data saved successfully for ' + selectedDate);
    };

    return (
        <div className="space-y-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="space-y-4">
                <h2 className="flex items-center gap-2 border-b border-gray-800 pb-2 text-lg font-black text-emerald-400">
                    <Activity className="h-5 w-5" /> BIOMETRICS & STATUS
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><Dumbbell className="h-3 w-3" /> Exercise Type</label>
                        <select
                            value={log.exercise}
                            onChange={e => setLog({ ...log, exercise: e.target.value as ExerciseType })}
                            className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white mt-1"
                        >
                            <option value="None">None</option>
                            <option value="Lifting">Lifting</option>
                            <option value="Cardio">Cardio</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><Brain className="h-3 w-3" /> Mental Energy (1-10)</label>
                        <input type="number" value={log.mentalEnergy} onChange={e => setLog({ ...log, mentalEnergy: Number(e.target.value) })} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white mt-1" />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Daily Notes</label>
                    <textarea value={log.notes} onChange={e => setLog({ ...log, notes: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white mt-1 h-20" />
                </div>
            </div>

            <div className="border-t border-gray-800 pt-4">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-black text-blue-400">
                        <ClipboardList className="h-5 w-5" /> LABORATORY
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => addCase('OBL')} className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-1 rounded border border-blue-800">+ OBL</button>
                        <button onClick={() => addCase('CSP')} className="text-[10px] bg-purple-900/50 text-purple-400 px-2 py-1 rounded border border-purple-800">+ CSP</button>
                        <button onClick={() => addCase('EP')} className="text-[10px] bg-amber-900/50 text-amber-400 px-2 py-1 rounded border border-amber-800">+ EP</button>
                    </div>
                </div>

                <div className="h-64 space-y-2 overflow-y-auto rounded border border-gray-800 bg-gray-950 p-2 pr-2">
                    {log.labCases.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 rounded border border-gray-800 bg-gray-900 p-1.5">
                            <span className={`text-[10px] font-bold w-8 ${c.category === 'OBL' ? 'text-blue-400' : c.category === 'CSP' ? 'text-purple-400' : 'text-amber-400'}`}>{c.category}</span>

                            <input placeholder="Case" value={c.caseName} onChange={e => {
                                const newC = [...log.labCases];
                                newC[i].caseName = e.target.value;
                                setLog({ ...log, labCases: newC });
                            }} className="bg-black border border-gray-700 rounded p-1 text-[10px] text-white flex-1" />

                            <select value={c.state} onChange={e => {
                                const newC = [...log.labCases];
                                newC[i].state = e.target.value as CaseStatus;
                                setLog({ ...log, labCases: newC });
                            }} className="bg-black border border-gray-700 rounded p-1 text-[10px] text-white">
                                <option value="Learning">Learning</option>
                                <option value="Drill">Drill</option>
                                <option value="Mastered">Mastered</option>
                            </select>

                            <button onClick={() => removeCase(i)} className="text-gray-600 hover:text-red-500"><X className="h-3 w-3" /></button>
                        </div>
                    ))}
                    {log.labCases.length === 0 && <p className="text-center text-[10px] text-gray-600 italic">No cases scheduled.</p>}
                </div>
            </div>

            <button onClick={saveLog} className="flex w-full items-center justify-center gap-2 rounded bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-500">
                <Save className="h-4 w-4" /> Save Daily Log
            </button>
        </div>
    );
};