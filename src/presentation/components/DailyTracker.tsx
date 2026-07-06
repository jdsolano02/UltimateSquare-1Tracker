import { useState, useEffect } from 'react';
import { db, type DailyLog } from '../../infrastructure/database/db';
import { Activity, Brain, Moon, Save, Coffee, X } from 'lucide-react';

export const DailyTracker = ({ selectedDate }: { selectedDate: string }) => {
    const [log, setLog] = useState<Partial<DailyLog>>({
        sleepHours: 7, sleepQuality: 8, mentalEnergy: 8, physicalFatigue: 5, caffeineLevel: 'Medio', coldHands: false, labCases: []
    });

    // Carga asíncrona limpia (Adiós a useLiveQuery para evitar sobrescrituras al guardar)
    useEffect(() => {
        let isMounted = true;

        const fetchDailyLog = async () => {
            const data = await db.logs.get(selectedDate);
            if (isMounted) {
                if (data) {
                    setLog(data);
                } else {
                    // Si no hay datos para este día, reseteamos al valor por defecto
                    setLog({ sleepHours: 7, sleepQuality: 8, mentalEnergy: 8, physicalFatigue: 5, caffeineLevel: 'Medio', coldHands: false, labCases: [] });
                }
            }
        };

        fetchDailyLog();

        return () => {
            isMounted = false;
        };
    }, [selectedDate]);

    const addCase = (category: 'OBL' | 'CSP' | 'EP') => {
        setLog(prev => ({ ...prev, labCases: [...(prev.labCases || []), { category, caseName: '', state: 'Learn', notes: '' }] }));
    };

    const removeCase = (indexToRemove: number) => {
        setLog(prev => ({
            ...prev,
            labCases: prev.labCases?.filter((_, index) => index !== indexToRemove)
        }));
    };

    const saveLog = async () => {
        await db.logs.put({ ...log, dateStr: selectedDate } as DailyLog);
        alert('Biometría y Laboratorio guardados para ' + selectedDate);
    };

    return (
        <div className="space-y-6 rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h2 className="flex items-center gap-2 text-lg font-black text-emerald-400">
                    <Activity className="h-5 w-5" /> 0. BIOMETRÍA Y ESTADO INICIAL (Ruta a Agosto)
                </h2>
            </div>

            {/* Grid Biométrico */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                    <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><Moon className="h-3 w-3" /> Horas Sueño</label>
                    <input type="number" value={log.sleepHours} onChange={e => setLog({ ...log, sleepHours: Number(e.target.value) })} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                </div>
                <div className="space-y-1">
                    <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><Brain className="h-3 w-3" /> Brain Fog (1-10)</label>
                    <input type="number" value={log.mentalEnergy} onChange={e => setLog({ ...log, mentalEnergy: Number(e.target.value) })} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white" />
                </div>
                <div className="space-y-1">
                    <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><Activity className="h-3 w-3" /> Fatiga Triatlón</label>
                    <input type="number" value={log.physicalFatigue} onChange={e => setLog({ ...log, physicalFatigue: Number(e.target.value) })} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white text-xs" placeholder="Nat/Cicl/Carr (1-10)" />
                </div>
                <div className="space-y-1">
                    <label className="flex items-center gap-1 text-xs font-bold text-gray-500 uppercase"><Coffee className="h-3 w-3" /> Cafeína</label>
                    <select value={log.caffeineLevel} onChange={e => setLog({ ...log, caffeineLevel: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded p-2 text-white text-xs">
                        <option>Ninguno</option><option>Medio</option><option>Alto (Pre-workout)</option>
                    </select>
                </div>
            </div>

            {/* Grid Laboratorio Dinámico */}
            <div className="border-t border-gray-800 pt-4">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-lg font-black text-blue-400">
                        <Brain className="h-5 w-5" /> 1. LABORATORIO (Teoría y Precisión)
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => addCase('OBL')} className="text-xs bg-blue-900/50 text-blue-400 px-2 py-1 rounded border border-blue-800 flex items-center hover:bg-blue-800/50 transition">+ OBL</button>
                        <button onClick={() => addCase('CSP')} className="text-xs bg-purple-900/50 text-purple-400 px-2 py-1 rounded border border-purple-800 flex items-center hover:bg-purple-800/50 transition">+ CSP</button>
                        <button onClick={() => addCase('EP')} className="text-xs bg-amber-900/50 text-amber-400 px-2 py-1 rounded border border-amber-800 flex items-center hover:bg-amber-800/50 transition">+ EP</button>
                    </div>
                </div>

                <div className="space-y-3">
                    {log.labCases?.map((c, i) => (
                        <div key={i} className="group flex items-center gap-2 rounded border border-gray-800 bg-gray-950 p-2">
                            <span className={`text-xs font-bold w-10 ${c.category === 'OBL' ? 'text-blue-400' : c.category === 'CSP' ? 'text-purple-400' : 'text-amber-400'}`}>{c.category}</span>

                            <input placeholder="Ej: Bad Arrow/Pair" value={c.caseName} onChange={e => { const newC = [...log.labCases!]; newC[i].caseName = e.target.value; setLog({ ...log, labCases: newC }); }} className="bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white flex-1" />

                            <select value={c.state} onChange={e => { const newC = [...log.labCases!]; newC[i].state = e.target.value; setLog({ ...log, labCases: newC }); }} className="bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white">
                                <option>Learn</option><option>Drill</option><option>Mastered</option>
                            </select>

                            <input placeholder="Notas / Latencia..." value={c.notes} onChange={e => { const newC = [...log.labCases!]; newC[i].notes = e.target.value; setLog({ ...log, labCases: newC }); }} className="bg-gray-900 border border-gray-700 rounded p-1.5 text-xs text-white flex-1" />

                            <button
                                onClick={() => removeCase(i)}
                                className="text-gray-600 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-950/30"
                                title="Eliminar fila"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {(!log.labCases || log.labCases.length === 0) && <p className="text-xs text-gray-600 italic">No hay casos programados para hoy.</p>}
                </div>
            </div>
            <button onClick={saveLog} className="flex w-full items-center justify-center gap-2 rounded bg-emerald-600 py-3 font-bold text-white transition hover:bg-emerald-500"><Save className="h-4 w-4" /> Guardar Bitácora Diaria</button>
        </div>
    );
};