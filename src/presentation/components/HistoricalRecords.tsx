import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../infrastructure/database/db';
import { parseCsTimerExport } from '../../infrastructure/parsers/CsTimerParser';
import { Trophy, UploadCloud, CheckCircle, AlertTriangle, Trash2, Loader2, Database, FileUp, Download, Upload, X, Copy, Timer } from 'lucide-react';
import type { Solve } from '../../domain/entities/Solve';

interface PRRecord { type: string; time: string; date: string; solves: Solve[]; }

export const HistoricalRecords = ({ currentSession }: { currentSession: string }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const [prs, setPrs] = useState<PRRecord[]>([]);
    const [isCalculating, setIsCalculating] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [selectedRecord, setSelectedRecord] = useState<{ label: string, avg: string, solves: Solve[] } | null>(null);

    const [manualTime, setManualTime] = useState('');

    const allSolves = useLiveQuery(async () => {
        try {
            const data = await db.solves.toArray();
            data.sort((a, b) => {
                const dA = a.date ? new Date(a.date).getTime() : 0;
                const dB = b.date ? new Date(b.date).getTime() : 0;
                return dA - dB;
            });
            return data;
        } catch (error) {
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
        return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    };

    useEffect(() => {
        let isMounted = true;
        const crunchData = async () => {
            if (isMounted) setIsCalculating(true);
            try {
                if (allSolves.length === 0) { if (isMounted) { setPrs([]); setIsCalculating(false); } return; }
                await new Promise(resolve => setTimeout(resolve, 50));
                if (!isMounted) return;

                const validSolves = allSolves.filter(s => Number(s.time) > 0);
                const categories = [1, 3, 5, 12, 50, 100, 200, 500, 1000, 2000, 3000, 4000, 5000, 10000];
                const records: PRRecord[] = [];
                const timesOnly = validSolves.map(s => Number(s.time));

                for (const size of categories) {
                    if (validSolves.length < size) continue;
                    let best = Infinity, bestDateStr = '', bestWindow: Solve[] = [];
                    if (size === 1) {
                        for (const solve of validSolves) {
                            if (Number(solve.time) < best) { best = Number(solve.time); bestDateStr = solve.dateStr; bestWindow = [solve]; }
                        }
                    } else {
                        for (let i = 0; i <= timesOnly.length - size; i++) {
                            const currentAvg = calculateAvg(timesOnly.slice(i, i + size), size);
                            if (currentAvg < best) { best = currentAvg; bestDateStr = validSolves[i + size - 1].dateStr; bestWindow = validSolves.slice(i, i + size); }
                            if (i % 500 === 0) { await new Promise(r => setTimeout(r, 0)); if (!isMounted) return; }
                        }
                    }
                    if (best !== Infinity) records.push({ type: size === 1 ? 'Single' : size === 3 ? 'Mo3' : `Ao${size}`, time: best.toFixed(2), date: bestDateStr, solves: bestWindow });
                }
                if (isMounted) { setPrs(records); setIsCalculating(false); }
            } catch (error) {
                console.error("Error calculating Historical Data:", error);
                if (isMounted) setIsCalculating(false);
            }
        };
        crunchData();
        return () => { isMounted = false; };
    }, [allSolves.length]);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const timeVal = parseFloat(manualTime);
        if (!manualTime || isNaN(timeVal) || timeVal <= 0) return;

        await db.solves.add({
            time: timeVal.toFixed(2),
            scramble: 'Manual Entry (No Scramble)',
            date: new Date(),
            dateStr: new Date().toISOString().split('T')[0],
            block: currentSession === 'Global' ? 'Speedsolving' : currentSession,
            isCsp: false,
            isObl: false
        } as unknown as Solve);

        setManualTime('');
        setRefreshTrigger(p => p + 1);
        setStatus({ message: `Time added to ${currentSession === 'Global' ? 'Speedsolving' : currentSession}!`, type: 'success' });
        setTimeout(() => setStatus(null), 3000);
    };

    const handleHistoricalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name); setIsProcessing(true); setStatus(null); setImportProgress({ current: 0, total: 0 });

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsedSolves = parseCsTimerExport(event.target?.result as string, 'Speedsolving');
                if (parsedSolves.length === 0) throw new Error("No valid solves found.");
                setImportProgress({ current: 0, total: parsedSolves.length });
                let addedCount = 0;
                for (let i = 0; i < parsedSolves.length; i++) {
                    const solve = parsedSolves[i];
                    const isDuplicate = await db.solves.where({ dateStr: solve.dateStr, scramble: solve.scramble }).first();
                    if (!isDuplicate && Number(solve.time) > 0) { await db.solves.add(solve); addedCount++; }
                    if (i % 50 === 0) { setImportProgress({ current: i + 1, total: parsedSolves.length }); await new Promise(r => setTimeout(r, 0)); }
                }
                setImportProgress({ current: parsedSolves.length, total: parsedSolves.length });
                setStatus({ message: `Historical Sync Complete: ${addedCount} new solves added.`, type: 'success' });
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error("Error reading CSV:", error);
                setStatus({ message: 'Error processing CSV data.', type: 'error' });
            } finally { setIsProcessing(false); }
        };
        reader.readAsText(file); e.target.value = '';
    };

    const handleExportBackup = async () => {
        try {
            const allSolvesData = await db.solves.toArray();
            const allCasesData = await db.cases.toArray();
            const backupData = { version: 1, date: new Date().toISOString(), solves: allSolvesData, cases: allCasesData };
            const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `sq1_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click(); URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export Error:", error);
            alert("Error exporting data.");
        }
    };

    const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!window.confirm("WARNING: Importing a JSON backup will overwrite all your current Data. Are you sure?")) return;
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.solves) { await db.solves.clear(); await db.solves.bulkAdd(json.solves); }
                if (json.cases) { await db.cases.clear(); await db.cases.bulkAdd(json.cases); }
                alert("Backup restored successfully!"); window.location.reload();
            } catch (error) {
                console.error("Import Error:", error);
                alert("Invalid JSON backup file.");
            } finally { setIsProcessing(false); }
        };
        reader.readAsText(file); e.target.value = '';
    };

    const handleClearSolves = async () => { if (window.confirm("WARNING: This will delete ALL your SOLVES. Your case progress will remain. Are you sure?")) { await db.solves.clear(); setRefreshTrigger(prev => prev + 1); } };
    const handleClearCases = async () => { if (window.confirm("WARNING: This will reset your CASE PROGRESS (OBL/CSP/PBL) back to 0. Solves will remain. Are you sure?")) { await db.cases.clear(); alert("Case Tracker cleared successfully."); } };

    const copyToClipboard = () => {
        if (!selectedRecord) return;
        const text = `SQ-1 Absolute PR ${selectedRecord.label}: ${selectedRecord.avg}s\n\n${selectedRecord.solves.map((s, i) => `${i + 1}. ${Number(s.time).toFixed(2)} - ${s.scramble}`).join('\n')}`;
        navigator.clipboard.writeText(text);
        alert("Scrambles copied to clipboard! Ready to share.");
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                    <Timer className="text-emerald-500" /> Manual Data Entry
                </h2>
                <p className="mb-4 text-xs text-gray-400">Add a solve manually to your currently selected session: <strong className="text-blue-400">{currentSession === 'Global' ? 'Speedsolving' : currentSession}</strong></p>
                <form onSubmit={handleManualSubmit} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Enter time (e.g., 12.34)"
                        value={manualTime}
                        onChange={e => setManualTime(e.target.value)}
                        className="flex-1 bg-black border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-emerald-500 transition"
                    />
                    <button type="submit" className="rounded-lg bg-emerald-600 px-6 py-3 font-bold whitespace-nowrap text-white shadow-lg transition hover:bg-emerald-500">
                        Add Time
                    </button>
                </form>
                {status && status.message.includes('added') && (
                    <div className={`mt-4 flex items-center gap-2 p-3 rounded-lg border text-sm bg-emerald-900/30 border-emerald-500/50 text-emerald-400`}>
                        <CheckCircle className="h-4 w-4" /> {status.message}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button onClick={handleExportBackup} className="flex items-center justify-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-xl transition hover:border-blue-500 hover:bg-gray-800">
                    <div className="rounded-lg bg-blue-900/50 p-2"><Download className="h-6 w-6 text-blue-400" /></div>
                    <div className="text-left"><span className="block font-bold text-white">Export Backup JSON</span><span className="text-xs text-gray-500">Save all solves and cases</span></div>
                </button>
                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-5 shadow-xl transition hover:border-emerald-500 hover:bg-gray-800">
                    <div className="rounded-lg bg-emerald-900/50 p-2"><Upload className="h-6 w-6 text-emerald-400" /></div>
                    <div className="text-left"><span className="block font-bold text-white">Restore Backup JSON</span><span className="text-xs text-gray-500">Load from previous backup</span></div>
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                </label>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white"><UploadCloud className="text-blue-500" /> Import CsTimer CSV</h2>
                <p className="mb-4 text-xs text-gray-400">Upload your complete CsTimer CSV export here. Duplicates are auto-ignored.</p>
                <div className="space-y-4">
                    <div className="group relative flex h-32 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-700 bg-gray-950 transition hover:border-blue-500">
                        <input type="file" accept=".csv,.txt" onChange={handleHistoricalFileUpload} disabled={isProcessing} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
                        {isProcessing ? (
                            <div className="flex w-full flex-col items-center px-8">
                                <span className="mb-2 text-sm font-bold text-blue-400">Processing: {importProgress.current} / {importProgress.total}</span>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800"><div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${importProgress.total === 0 ? 0 : (importProgress.current / importProgress.total) * 100}%` }} /></div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-gray-500 transition group-hover:text-blue-400"><FileUp className="mb-2 h-8 w-8" /><span className="text-sm font-bold">{fileName ? fileName : 'Click or Drag CsTimer CSV here'}</span></div>
                        )}
                    </div>
                    {status && !status.message.includes('added to') && <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${status.type === 'success' ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' : 'bg-red-900/30 border-red-500/50 text-red-400'}`}><CheckCircle className="h-4 w-4" /> {status.message}</div>}
                </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-xl font-bold text-white"><Trophy className="text-yellow-500" /> Absolute Personal Records</h2>
                    {!isCalculating && prs.length > 0 && <span className="flex items-center gap-1 rounded bg-emerald-900/30 px-2 py-1 font-bold tracking-wider text-[10px] text-emerald-500 uppercase"><Database className="h-3 w-3" /> Data Synchronized</span>}
                </div>
                {isCalculating ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400"><Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-500" /><p className="mb-2 text-sm font-bold tracking-wider uppercase">Analyzing Big Data Set</p><p className="text-xs text-gray-500">Calculating your absolute records...</p></div>
                ) : prs.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No records found. Import data above.</p>
                ) : (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {prs.map((pr) => (
                            <div key={pr.type} onClick={() => setSelectedRecord({ label: pr.type, avg: pr.time, solves: pr.solves })} className="flex flex-col rounded-lg border border-gray-800 bg-gray-950 p-4 transition hover:border-emerald-900/50 hover:bg-gray-900 cursor-pointer group">
                                <span className="mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase transition group-hover:text-emerald-400">{pr.type}</span>
                                <span className="mb-2 text-3xl leading-none font-black text-white">{pr.time}s</span>
                                <span className="self-start rounded border border-gray-800 bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] text-gray-500">{pr.date}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8 rounded-xl border border-red-900/30 bg-red-950/10 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-red-500/80 uppercase"><AlertTriangle className="h-4 w-4" /> Danger Zone</h2>
                <div className="flex flex-col gap-4 sm:flex-row">
                    <button onClick={handleClearSolves} className="flex flex-1 items-center justify-center gap-2 rounded border border-red-800 bg-red-900/50 px-4 py-3 text-xs font-bold text-white transition hover:bg-red-600"><Trash2 className="h-4 w-4" /> Clear All Solves</button>
                    <button onClick={handleClearCases} className="flex flex-1 items-center justify-center gap-2 rounded border border-orange-800 bg-orange-900/50 px-4 py-3 text-xs font-bold text-white transition hover:bg-orange-600"><Trash2 className="h-4 w-4" /> Reset Case Progress</button>
                </div>
            </div>

            {selectedRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedRecord(null)}>
                    <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-950 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex shrink-0 items-center justify-between border-b border-gray-800 bg-gray-900 p-6">
                            <div>
                                <h2 className="text-2xl font-black text-white">Absolute PB {selectedRecord.label}: <span className="text-emerald-400">{selectedRecord.avg}s</span></h2>
                                <p className="mt-1 font-mono text-xs text-gray-500">Achieved on: {selectedRecord.solves[selectedRecord.solves.length - 1]?.dateStr}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={copyToClipboard} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-500"><Copy className="h-4 w-4" /> <span className="hidden sm:inline">Copy Scrambles</span></button>
                                <button onClick={() => setSelectedRecord(null)} className="rounded-lg border border-gray-800 bg-gray-950 p-2 text-gray-500 transition hover:text-white"><X className="h-5 w-5" /></button>
                            </div>
                        </div>
                        <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-6">
                            {selectedRecord.solves.length > 100 ? (
                                <div className="flex h-32 items-center justify-center rounded-lg border border-gray-800 bg-gray-900"><p className="font-bold text-yellow-500 italic">This average is too large to render the detailed list.</p></div>
                            ) : (
                                selectedRecord.solves.map((s, i) => (
                                    <div key={i} className="flex gap-4 rounded-lg border border-gray-800 bg-gray-900 p-3 font-mono text-sm transition hover:border-gray-600">
                                        <span className="w-6 text-right font-bold text-gray-600">{i + 1}.</span>
                                        <span className="w-14 font-black text-blue-400">{Number(s.time).toFixed(2)}</span>
                                        <span className="flex-1 leading-relaxed break-words text-[11px] text-gray-400">{s.scramble}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};