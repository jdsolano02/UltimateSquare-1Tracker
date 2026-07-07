import { useState } from 'react';
import { db } from '../../infrastructure/database/db';
import { parseCsTimerExport } from '../../infrastructure/parsers/CsTimerParser';
import { CheckCircle, Flame, Trophy, FileUp, Loader2 } from 'lucide-react';

export const ImportForm = () => {
    const [block, setBlock] = useState<string>('Global');
    const [status, setStatus] = useState<{ count: number; prs: string[] } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);
        setStatus(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const rawText = event.target?.result as string;
                const parsedSolves = parseCsTimerExport(rawText, block as unknown as 'Speedsolving');

                if (parsedSolves.length === 0) {
                    setIsProcessing(false);
                    return;
                }

                let addedCount = 0;
                const newPrs: string[] = [];

                const bestSolveArray = await db.solves.where('block').equals(block).sortBy('time');
                const validSolves = bestSolveArray.filter(s => Number(s.time) > 0);
                const absoluteBest = validSolves.length > 0 ? Number(validSolves[0].time) : Infinity;
                let newBatchBest = Infinity;

                for (const solve of parsedSolves) {
                    const isDuplicate = await db.solves
                        .where({ dateStr: solve.dateStr, scramble: solve.scramble })
                        .first();

                    if (!isDuplicate && Number(solve.time) > 0) {
                        if (Number(solve.time) < newBatchBest) {
                            newBatchBest = Number(solve.time);
                        }
                        await db.solves.add(solve);
                        addedCount++;
                    }
                }

                if (newBatchBest < absoluteBest && newBatchBest !== Infinity) {
                    newPrs.push(`New Absolute PR Single: ${newBatchBest.toFixed(2)}s! 🏆`);
                }

                setStatus({ count: addedCount, prs: newPrs });
                setTimeout(() => setStatus(null), 8000);
            } catch (error) {
                console.error('Database injection error:', error);
                alert('Error parsing CSV. Please check format.');
            } finally {
                setIsProcessing(false);
            }
        };

        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center space-x-2">
                <Flame className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold text-white">Import Session Data</h2>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-400">Block Type</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setBlock('Global')} className={`p-3 text-sm font-semibold rounded-lg border transition ${block === 'Global' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800'}`}>Global</button>
                        <button type="button" onClick={() => setBlock('Case recognition')} className={`p-3 text-sm font-semibold rounded-lg border transition ${block === 'Case recognition' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800'}`}>Case recognition</button>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-400">Upload CsTimer Export (.csv)</label>
                    <div className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-700 bg-gray-950 transition hover:border-blue-500">
                        <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileUpload}
                            disabled={isProcessing}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        />
                        {isProcessing ? (
                            <div className="flex flex-col items-center text-blue-500">
                                <Loader2 className="mb-2 h-8 w-8 animate-spin" />
                                <span className="text-sm font-bold">Processing File...</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-500 transition group-hover:text-blue-400">
                                <FileUp className="mb-2 h-8 w-8" />
                                <span className="text-sm font-bold">{fileName ? fileName : 'Click or Drag CSV here'}</span>
                            </div>
                        )}
                    </div>
                </div>

                {status && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center space-x-2 rounded-lg border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-400">
                            <CheckCircle className="h-4 w-4" />
                            <span>Imported {status.count} new solves.</span>
                        </div>
                        {status.prs.length > 0 && (
                            <div className="flex flex-col space-y-1 rounded-lg border border-yellow-900 bg-yellow-950/50 p-3 text-sm text-yellow-400">
                                {status.prs.map((pr, i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <Trophy className="h-4 w-4" />
                                        <span className="font-bold">{pr}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};