import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../infrastructure/database/db';
import { parseCsTimerExport } from '../../infrastructure/parsers/CsTimerParser';
import { Trophy, UploadCloud, CheckCircle, AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface PRRecord {
    type: string;
    time: string;
    date: string;
}

export const HistoricalRecords = () => {
    const [rawText, setRawText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const calculateAvg = (times: number[], size: number): number => {
        if (times.length !== size) return Infinity;
        const trim = size === 3 ? 0 : Math.ceil(size * 0.05);
        const sorted = [...times].sort((a, b) => a - b);
        const trimmed = sorted.slice(trim, size - trim);
        const sum = trimmed.reduce((a, b) => a + b, 0);
        return sum / trimmed.length;
    };

    // Dexie's useLiveQuery manejará el estado de carga (devuelve 'undefined' mientras procesa)
    // y se actualizará automáticamente si db.solves cambia. ¡Adiós useEffect!
    const prs = useLiveQuery(async () => {
        try {
            const allSolves = await db.solves.orderBy('date').toArray();
            const validSolves = allSolves.filter(s => s.time > 0);

            const categories = [
                { label: 'Single', size: 1 },
                { label: 'Mo3', size: 3 },
                { label: 'Ao5', size: 5 },
                { label: 'Ao12', size: 12 },
                { label: 'Ao25', size: 25 },
                { label: 'Ao50', size: 50 },
                { label: 'Ao100', size: 100 },
                { label: 'Ao500', size: 500 },
                { label: 'Ao1000', size: 1000 },
                { label: 'Ao2000', size: 2000 },
                { label: 'Ao4000', size: 4000 },
            ];

            const records: PRRecord[] = [];

            for (const cat of categories) {
                if (validSolves.length < cat.size) continue;

                let best = Infinity;
                let bestDateStr = '';

                if (cat.size === 1) {
                    for (const solve of validSolves) {
                        if (solve.time < best) {
                            best = solve.time;
                            bestDateStr = solve.dateStr;
                        }
                    }
                } else {
                    const timesOnly = validSolves.map(s => s.time);
                    for (let i = 0; i <= timesOnly.length - cat.size; i++) {
                        const window = timesOnly.slice(i, i + cat.size);
                        const currentAvg = calculateAvg(window, cat.size);

                        if (currentAvg < best) {
                            best = currentAvg;
                            bestDateStr = validSolves[i + cat.size - 1].dateStr;
                        }
                    }
                }

                if (best !== Infinity) {
                    records.push({
                        type: cat.label === 'Single' ? 'Single' : cat.label,
                        time: best.toFixed(2),
                        date: bestDateStr
                    });
                }
            }

            return records;
        } catch (error) {
            console.error("Error calculating PRs:", error);
            return [];
        }
    }, []);

    // Variables derivadas para simplificar el renderizado
    const isLoadingPrs = prs === undefined;
    const recordsToDisplay = prs || [];

    const handleHistoricalImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rawText.trim()) return;
        setIsProcessing(true);
        setStatus(null);

        try {
            const parsedSolves = parseCsTimerExport(rawText, 'Resistencia');
            if (parsedSolves.length === 0) throw new Error("No valid solves found in CSV.");

            let addedCount = 0;
            for (const solve of parsedSolves) {
                const isDuplicate = await db.solves
                    .where({ dateStr: solve.dateStr, scramble: solve.scramble })
                    .first();

                if (!isDuplicate && solve.time > 0) {
                    await db.solves.add(solve);
                    addedCount++;
                }
            }

            setStatus({ message: `Historical Sync Complete: ${addedCount} new solves added.`, type: 'success' });
            setRawText('');
            // Ya no hace falta recalcular manualmente, useLiveQuery lo detecta solo y refresca la pantalla.

        } catch (error) {
            console.error('Historical Import Error:', error);
            setStatus({ message: 'Error processing CSV data. Make sure it is a valid CsTimer export.', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFactoryReset = async () => {
        const confirmed = window.confirm("WARNING: This will permanently delete ALL your solves and case progress. Are you absolutely sure?");
        if (confirmed) {
            const doubleCheck = window.confirm("Are you REALLY sure? This action cannot be undone.");
            if (doubleCheck) {
                try {
                    await db.solves.clear();
                    await db.cases.clear();
                    alert("Database wiped successfully. Reloading...");
                    window.location.reload();
                } catch (error) {
                    console.error("Error clearing database:", error);
                    alert("An error occurred while wiping the database.");
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* INGESTA HISTÓRICA */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                    <UploadCloud className="text-blue-500" /> Import Historical Data
                </h2>
                <p className="mb-4 text-xs text-gray-400">Paste your complete CsTimer CSV export here. Duplicates will be automatically ignored.</p>

                <form onSubmit={handleHistoricalImport} className="space-y-4">
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        disabled={isProcessing}
                        placeholder="Paste full CSV data here..."
                        className="w-full h-32 bg-gray-950 border border-gray-800 rounded-lg p-3 text-sm text-gray-300 font-mono focus:border-blue-500 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!rawText.trim() || isProcessing}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isProcessing ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing Data...</> : 'Sync Historical Data'}
                    </button>

                    {status && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${status.type === 'success' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-red-900/30 border-red-500/50 text-red-400'}`}>
                            <CheckCircle className="h-4 w-4" /> {status.message}
                        </div>
                    )}
                </form>
            </div>

            {/* TABLA DE RECORDS ABSOLUTOS */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                    <Trophy className="text-yellow-500" /> Absolute Personal Records
                </h2>

                {isLoadingPrs ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-500" />
                        <p className="text-sm">Calculating absolute records...</p>
                    </div>
                ) : recordsToDisplay.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No records found yet. Import your data above.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {recordsToDisplay.map((pr, i) => (
                            <div key={i} className="flex flex-col rounded-lg border border-gray-800 bg-gray-950 p-4 transition hover:border-emerald-900/50">
                                <span className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase">{pr.type}</span>
                                <div className="flex items-end justify-between">
                                    <span className="text-2xl font-black text-emerald-400">{pr.time}s</span>
                                    <span className="rounded bg-gray-900 px-2 py-1 font-mono text-xs text-gray-500">{pr.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ZONA DE PELIGRO (FACTORY RESET) */}
            <div className="mt-8 rounded-xl border border-red-900/50 bg-red-950/20 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-red-500">
                    <AlertTriangle className="text-red-500" /> Danger Zone
                </h2>
                <p className="mb-4 text-xs text-gray-400">
                    Need a fresh start? This will permanently wipe your entire database (all solves and case progress).
                </p>
                <button
                    onClick={handleFactoryReset}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-700 bg-red-900/80 px-4 py-2 font-bold text-white transition hover:bg-red-600 md:w-auto"
                >
                    <Trash2 className="h-4 w-4" /> Nuke Database (Factory Reset)
                </button>
            </div>
        </div>
    );
};