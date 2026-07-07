import { useState } from 'react';
import { db } from '../../infrastructure/database/db';
import { parseCsTimerExport } from '../../infrastructure/parsers/CsTimerParser';
import { UploadCloud, CheckCircle, AlertTriangle, Trash2, FileUp, Download, Upload, Timer } from 'lucide-react';
import type { Solve } from '../../domain/entities/Solve';

export const HistoricalRecords = ({ currentSession }: { currentSession: string }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [manualTime, setManualTime] = useState('');

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const timeVal = parseFloat(manualTime);
        if (!manualTime || isNaN(timeVal) || timeVal <= 0) return;

        // Validamos la sesión correcta de entrada
        const finalSession = currentSession === 'Global (View All)' ? 'Global' : currentSession;

        const newSolve = {
            time: timeVal.toFixed(2),
            scramble: 'Manual Entry (No Scramble)',
            date: new Date().toISOString(),
            dateStr: new Date().toISOString().split('T')[0],
            block: finalSession,
            isCsp: false,
            isObl: false
        } as unknown as Solve;

        await db.solves.add(newSolve);

        setManualTime('');
        setStatus({ message: `Time added to ${finalSession}!`, type: 'success' });
        setTimeout(() => setStatus(null), 3000);
    };

    const handleHistoricalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name); setIsProcessing(true); setStatus(null); setImportProgress({ current: 0, total: 0 });

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                // Siempre importamos a Global por defecto
                const parsedSolves = parseCsTimerExport(event.target?.result as string, 'Global' as unknown as 'Speedsolving');
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

    const handleClearSolves = async () => { if (window.confirm("WARNING: This will delete ALL your SOLVES. Your case progress will remain. Are you sure?")) { await db.solves.clear(); window.location.reload(); } };
    const handleClearCases = async () => { if (window.confirm("WARNING: This will reset your CASE PROGRESS (OBL/CSP/PBL) back to 0. Solves will remain. Are you sure?")) { await db.cases.clear(); alert("Case Tracker cleared successfully."); } };

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
                    <Timer className="text-emerald-500" /> Manual Data Entry
                </h2>
                <p className="mb-4 text-xs text-gray-400">Add a solve manually to your currently selected session: <strong className="text-blue-400">{currentSession === 'Global (View All)' ? 'Global' : currentSession}</strong></p>
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

            <div className="mt-8 rounded-xl border border-red-900/30 bg-red-950/10 p-6 shadow-xl">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-red-500/80 uppercase"><AlertTriangle className="h-4 w-4" /> Danger Zone</h2>
                <div className="flex flex-col gap-4 sm:flex-row">
                    <button onClick={handleClearSolves} className="flex flex-1 items-center justify-center gap-2 rounded border border-red-800 bg-red-900/50 px-4 py-3 text-xs font-bold text-white transition hover:bg-red-600"><Trash2 className="h-4 w-4" /> Clear All Solves</button>
                    <button onClick={handleClearCases} className="flex flex-1 items-center justify-center gap-2 rounded border border-orange-800 bg-orange-900/50 px-4 py-3 text-xs font-bold text-white transition hover:bg-orange-600"><Trash2 className="h-4 w-4" /> Reset Case Progress</button>
                </div>
            </div>
        </div>
    );
};