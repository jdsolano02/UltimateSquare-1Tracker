import React, { useState } from 'react';
import { db } from '../../infrastructure/database/db';
import { parseCsTimerExport } from '../../infrastructure/parsers/CsTimerParser';
import { Clipboard, CheckCircle, Flame, Trophy } from 'lucide-react';

export const ImportForm = () => {
    const [rawText, setRawText] = useState('');
    const [block, setBlock] = useState<'Sprint' | 'Resistencia'>('Sprint');
    const [status, setStatus] = useState<{ count: number; prs: string[] } | null>(null);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rawText.trim()) return;

        try {
            const parsedSolves = parseCsTimerExport(rawText, block);
            if (parsedSolves.length === 0) return;

            let addedCount = 0;
            const newPrs: string[] = [];

            // 1. Get current best time for this block to check PRs
            const bestSolve = await db.solves
                .where('block')
                .equals(block)
                .sortBy('time');
            let currentBest = bestSolve.length > 0 ? bestSolve[0].time : Infinity;

            // 2. Process solves one by one to prevent duplicates and check PRs
            for (const solve of parsedSolves) {
                // Check if exists using composite key: dateStr + scramble
                const isDuplicate = await db.solves
                    .where({ dateStr: solve.dateStr, scramble: solve.scramble })
                    .first();

                if (!isDuplicate) {
                    // Check if it's a new Single PR
                    if (solve.time < currentBest && solve.time > 0) {
                        newPrs.push(`New PR Single: ${solve.time}s`);
                        currentBest = solve.time;
                    }

                    await db.solves.add(solve);
                    addedCount++;
                }
            }

            setStatus({ count: addedCount, prs: newPrs });
            setRawText('');
            setTimeout(() => setStatus(null), 8000);

        } catch (error) {
            console.error('Database injection error:', error);
        }
    };

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-xl">
            <div className="mb-4 flex items-center space-x-2">
                <Flame className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold text-white">Import Session Data</h2>
            </div>

            <form onSubmit={handleImport} className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-400">
                        Block Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setBlock('Sprint')}
                            className={`p-3 text-sm font-semibold rounded-lg border transition ${block === 'Sprint'
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Sprint
                        </button>
                        <button
                            type="button"
                            onClick={() => setBlock('Resistencia')}
                            className={`p-3 text-sm font-semibold rounded-lg border transition ${block === 'Resistencia'
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Flow State
                        </button>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-400">
                        Paste CsTimer Export
                    </label>
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Paste your CsTimer CSV data here..."
                        className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!rawText.trim()}
                    className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 p-3 font-bold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                    <Clipboard className="h-4 w-4" />
                    <span>Sync Session</span>
                </button>

                {status && (
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center space-x-2 rounded-lg border border-emerald-500/50 bg-emerald-900/30 p-3 text-sm text-emerald-400">
                            <CheckCircle className="h-4 w-4" />
                            <span>Imported {status.count} new solves.</span>
                        </div>
                        {status.prs.length > 0 && (
                            <div className="flex flex-col space-y-1 rounded-lg border border-yellow-500/50 bg-yellow-900/30 p-3 text-sm text-yellow-400">
                                {status.prs.map((pr, i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <Trophy className="h-4 w-4" />
                                        <span>{pr}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};