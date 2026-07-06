import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../infrastructure/database/db';
import { parseCsTimerExport } from '../../infrastructure/parsers/CsTimerParser';
import { Trophy, UploadCloud, CheckCircle } from 'lucide-react';

interface PRRecord {
    type: string;
    time: number;
    date: string;
}

export const HistoricalRecords = () => {
    const [rawText, setRawText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Motor reactivo de Dexie: Reemplaza completamente a useEffect y previene los re-renders en cascada
    const prs = useLiveQuery(async () => {
        const allSolves = await db.solves.orderBy('date').toArray();
        const records: PRRecord[] = [];
        let bestSingle = Infinity;

        allSolves.forEach(solve => {
            if (solve.time < bestSingle && solve.time > 0) {
                bestSingle = solve.time;
                records.push({ type: 'Single PR', time: solve.time, date: solve.dateStr });
            }
        });
        return records.reverse();
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
            setStatus({ message: 'Error processing CSV data.', type: 'error' });
        } finally {
            setIsProcessing(false);
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
        </div>
    );
};