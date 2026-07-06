import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../infrastructure/database/db';
import { parseCsTimerExport } from '../../infrastructure/parsers/CsTimerParser';
import { Trophy, UploadCloud, CheckCircle, AlertTriangle, Trash2, Loader2, Database, FileUp } from 'lucide-react';

interface PRRecord {
    type: string;
    time: string;
    date: string;
}

export const HistoricalRecords = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const [prs, setPrs] = useState<PRRecord[]>([]);
    const [isCalculating, setIsCalculating] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const allSolves = useLiveQuery(async () => {
        try {
            const data = await db.solves.toArray();
            data.sort((a, b) => {
                const dA = a.date ? new Date(a.date).getTime() : 0;
                const dB = b.date ? new Date(b.date).getTime() : 0;
                return dA - dB;
            });
            return data;
        } catch (error) { // FIX: Cambiado a 'error' y lo usamos abajo
            console.error("Error reading database:", error);
            return [];
        }
    }, [refreshTrigger]) || [];

    const calculateAvg = (times: number[], size: number): number => {
        if (times.length !== size) return Infinity;
        if (size === 3) return times.reduce((a, b) => a + b, 0) / 3;

        const trim = Math.ceil(size * 0.05);
        const sorted = [...times].sort((a, b) => a - b);
        const trimmed = sorted.slice(trim, size - trim);
        const sum = trimmed.reduce((a, b) => a + b, 0);
        return sum / trimmed.length;
    };

    useEffect(() => {
        let isMounted = true;

        const crunchData = async () => {
            if (isMounted) setIsCalculating(true);

            try {
                if (allSolves.length === 0) {
                    if (isMounted) { setPrs([]); setIsCalculating(false); }
                    return;
                }

                await new Promise(resolve => setTimeout(resolve, 50));
                if (!isMounted) return;

                const validSolves = allSolves.filter(s => Number(s.time) > 0);
                const categories = [1, 3, 5, 12, 50, 100, 200, 500, 1000, 2000, 3000, 4000, 5000, 10000];
                const records: PRRecord[] = [];
                const timesOnly = validSolves.map(s => Number(s.time));

                for (const size of categories) {
                    if (validSolves.length < size) continue;
                    let best = Infinity;
                    let bestDateStr = '';

                    if (size === 1) {
                        for (const solve of validSolves) {
                            if (Number(solve.time) < best) {
                                best = Number(solve.time);
                                bestDateStr = solve.dateStr;
                            }
                        }
                    } else {
                        for (let i = 0; i <= timesOnly.length - size; i++) {
                            const window = timesOnly.slice(i, i + size);
                            const currentAvg = calculateAvg(window, size);

                            if (currentAvg < best) {
                                best = currentAvg;
                                bestDateStr = validSolves[i + size - 1].dateStr;
                            }

                            if (i % 500 === 0) {
                                await new Promise(resolve => setTimeout(resolve, 0));
                                if (!isMounted) return;
                            }
                        }
                    }

                    if (best !== Infinity) {
                        records.push({
                            type: size === 1 ? 'Single' : size === 3 ? 'Mo3' : `Ao${size}`,
                            time: best.toFixed(2),
                            date: bestDateStr
                        });
                    }
                }

                if (isMounted) {
                    setPrs(records);
                    setIsCalculating(false);
                }
            } catch (error) {
                console.error("Crash prevented in Historical Records:", error);
                if (isMounted) setIsCalculating(false);
            }
        };

        crunchData();
        return () => { isMounted = false; };
    }, [allSolves.length]);

    const handleHistoricalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);
        setStatus(null);
        setImportProgress({ current: 0, total: 0 });

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const rawText = event.target?.result as string;
                const parsedSolves = parseCsTimerExport(rawText, 'Speedsolving');

                if (parsedSolves.length === 0) throw new Error("No valid solves found in CSV.");

                setImportProgress({ current: 0, total: parsedSolves.length });
                let addedCount = 0;

                for (let i = 0; i < parsedSolves.length; i++) {
                    const solve = parsedSolves[i];
                    const isDuplicate = await db.solves
                        .where({ dateStr: solve.dateStr, scramble: solve.scramble })
                        .first();

                    if (!isDuplicate && Number(solve.time) > 0) {
                        await db.solves.add(solve);
                        addedCount++;
                    }

                    if (i % 50 === 0) {
                        setImportProgress({ current: i + 1, total: parsedSolves.length });
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }

                setImportProgress({ current: parsedSolves.length, total: parsedSolves.length });
                setStatus({ message: `Historical Sync Complete: ${addedCount} new solves added.`, type: 'success' });
                setRefreshTrigger(prev => prev + 1);

            } catch (error) {
                console.error('Historical Import Error:', error);
                setStatus({ message: 'Error processing CSV data.', type: 'error' });
            } finally {
                setIsProcessing(false);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleClearSolves = async () => {
        if (window.confirm("WARNING: This will delete ALL your SOLVES. Your case progress will remain. Are you sure?")) {
            await db.solves.clear();
            setRefreshTrigger(prev => prev + 1);
        }
    };

    const handleClearCases = async () => {
        if (window.confirm("WARNING: This will reset your CASE PROGRESS (OBL/CSP/EP) back to 0. Solves will remain. Are you sure?")) {
            await db.cases.clear();
            alert("Case Tracker cleared successfully.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                    <UploadCloud className="text-blue-500" /> Import Historical Data
                </h2>
                <p className="mb-4 text-xs text-gray-400">Upload your complete CsTimer CSV export here. Duplicates are auto-ignored.</p>

                <div className="space-y-4">
                    <div className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-700 bg-gray-950 transition hover:border-blue-500">
                        <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleHistoricalFileUpload}
                            disabled={isProcessing}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        />
                        {isProcessing ? (
                            <div className="flex w-full flex-col items-center px-8">
                                <span className="mb-2 text-sm font-bold text-blue-400">
                                    Processing: {importProgress.current} / {importProgress.total}
                                </span>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                                    <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${importProgress.total === 0 ? 0 : (importProgress.current / importProgress.total) * 100}%` }} />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-500 transition group-hover:text-blue-400">
                                <FileUp className="mb-2 h-8 w-8" />
                                <span className="text-sm font-bold">{fileName ? fileName : 'Click or Drag CSV here'}</span>
                            </div>
                        )}
                    </div>

                    {status && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${status.type === 'success' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-red-900/30 border-red-500/50 text-red-400'}`}>
                            <CheckCircle className="h-4 w-4" /> {status.message}
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                        <Trophy className="text-yellow-500" /> Absolute Personal Records
                    </h2>
                    {!isCalculating && prs.length > 0 && (
                        <span className="flex items-center gap-1 rounded bg-emerald-900/30 px-2 py-1 font-bold tracking-wider text-[10px] text-emerald-500 uppercase">
                            <Database className="h-3 w-3" /> Data Synchronized
                        </span>
                    )}
                </div>

                {isCalculating ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-500" />
                        <p className="mb-2 text-sm font-bold tracking-wider uppercase">Analyzing Big Data Set</p>
                        <p className="text-xs text-gray-500">Calculating your absolute records...</p>
                    </div>
                ) : prs.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No records found. Import data above.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {prs.map((pr, i) => (
                            <div key={i} className="flex flex-col rounded-lg border border-gray-800 bg-gray-950 p-4 transition hover:border-emerald-900/50">
                                <span className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase">{pr.type}</span>
                                <span className="mb-2 text-3xl leading-none font-black text-white">{pr.time}s</span>
                                <span className="self-start rounded bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">{pr.date}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8 rounded-xl border border-red-900/30 bg-red-950/10 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-red-500/80 uppercase">
                    <AlertTriangle className="h-4 w-4" /> Danger Zone
                </h2>
                <div className="flex flex-col gap-4 sm:flex-row">
                    <button
                        onClick={handleClearSolves}
                        className="flex flex-1 items-center justify-center gap-2 rounded border border-red-800 bg-red-900/50 px-4 py-3 text-xs font-bold text-white transition hover:bg-red-600"
                    >
                        <Trash2 className="h-4 w-4" /> Clear All Solves
                    </button>
                    <button
                        onClick={handleClearCases}
                        className="flex flex-1 items-center justify-center gap-2 rounded border border-orange-800 bg-orange-900/50 px-4 py-3 text-xs font-bold text-white transition hover:bg-orange-600"
                    >
                        <Trash2 className="h-4 w-4" /> Reset Case Progress
                    </button>
                </div>
            </div>
        </div>
    );
};