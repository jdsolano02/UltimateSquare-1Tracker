import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../infrastructure/database/db';
import { parseCsTimerExport } from '../../infrastructure/parsers/CsTimerParser';
import { Trophy, UploadCloud, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';

interface PRRecord {
    type: string;
    time: number;
    date: string;
}

export const HistoricalRecords = () => {
    const [rawText, setRawText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Motor reactivo corregido: Trae los datos y los ordena en memoria para evitar errores de índice
    const prs = useLiveQuery(async () => {
        const allSolves = await db.solves.toArray();

        // Orden cronológico exacto usando el objeto Date
        allSolves.sort((a, b) => a.date.getTime() - b.date.getTime());

        const records: PRRecord[] = [];
        let bestSingle = Infinity;

        allSolves.forEach(solve => {
            if (solve.time < bestSingle && solve.time > 0) {
                bestSingle = solve.time;
                records.push({ type: 'Single PR', time: solve.time, date: solve.dateStr });
            }
        });

        return records.reverse(); // Los más recientes arriba
    }, []) || [];

    const handleHistoricalImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rawText.trim()) return;
        setIsProcessing(true);
        setStatus(null);

        try {
            const parsedSolves = parseCsTimerExport(rawText, 'Resistencia');
            if (parsedSolves.length === 0) {
                throw new Error("No valid solves found in CSV.");
            }

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

        } catch (error) {
            console.error('Historical Import Error:', error);
            setStatus({ message: 'Error processing CSV data. Make sure it is a valid CsTimer export.', type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    // Función de Reseteo Total
    const handleFactoryReset = async () => {
        const confirmed = window.confirm("WARNING: This will permanently delete ALL your solves, case progress, and daily logs. Are you absolutely sure?");
        if (confirmed) {
            const doubleCheck = window.confirm("Are you REALLY sure? This action cannot be undone.");
            if (doubleCheck) {
                try {
                    await db.solves.clear();
                    await db.cases.clear();
                    await db.logs.clear();
                    alert("Database wiped successfully. Reloading...");
                    window.location.reload(); // Recarga la app para limpiar la memoria caché de React
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
                        {isProcessing ? 'Processing Data...' : 'Sync Historical Data'}
                    </button>

                    {status && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${status.type === 'success' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-red-900/30 border-red-500/50 text-red-400'}`}>
                            <CheckCircle className="h-4 w-4" /> {status.message}
                        </div>
                    )}
                </form>
            </div>

            {/* TABLA DE RECORDS */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                    <Trophy className="text-yellow-500" /> Personal Records Timeline
                </h2>

                {prs.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No records found yet.</p>
                ) : (
                    <div className="space-y-2">
                        {prs.map((pr, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 p-3">
                                <span className="font-bold text-gray-300">{pr.type}</span>
                                <span className="text-xl font-black text-emerald-400">{pr.time}s</span>
                                <span className="text-sm text-gray-500">{pr.date}</span>
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
                    Need a fresh start? This will permanently wipe your entire database (all solves, metrics, case progress, and daily logs). Make sure you have a backup of your CsTimer exports before proceeding.
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