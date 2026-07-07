import React, { useState } from 'react';
import { db } from '../../infrastructure/database/db';
import { parseCsTimerExport } from '../../infrastructure/parsers/CsTimerParser';
import { CheckCircle, FileUp, Loader2, Database } from 'lucide-react';

export const ImportForm = ({ activeSession }: { activeSession: string }) => {
    const [status, setStatus] = useState<{ count: number } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsProcessing(true);
        setStatus(null);

        const targetSession = activeSession === 'Global (View All)' ? 'Global' : activeSession;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const rawText = event.target?.result as string;
                const parsedSolves = parseCsTimerExport(rawText, targetSession as unknown as 'Speedsolving');

                if (parsedSolves.length === 0) { setIsProcessing(false); return; }

                let addedCount = 0;
                for (const solve of parsedSolves) {
                    // Check duplicate ONLY in the target session
                    const isDuplicate = await db.solves
                        .where({ dateStr: solve.dateStr, scramble: solve.scramble })
                        .filter(s => s.block === targetSession)
                        .first();

                    if (!isDuplicate && Number(solve.time) > 0) {
                        await db.solves.add(solve);
                        addedCount++;
                    }
                }
                setStatus({ count: addedCount });
                setTimeout(() => setStatus(null), 8000);
            } catch (error) {
                console.error('Database injection error:', error);
                alert('Error parsing CSV. Please check format.');
            } finally { setIsProcessing(false); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-xl">
            <h3 className="mb-4 flex items-center text-sm font-bold tracking-wider text-gray-400 uppercase">
                <Database className="mr-2 h-4 w-4 text-blue-500" /> Auto-Import to '{activeSession === 'Global (View All)' ? 'Global' : activeSession}'
            </h3>

            <div className="space-y-4">
                <div className="group relative flex h-24 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-700 bg-gray-950 transition hover:border-blue-500">
                    <input type="file" accept=".csv,.txt" onChange={handleFileUpload} disabled={isProcessing} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
                    {isProcessing ? (
                        <div className="flex flex-col items-center text-blue-500">
                            <Loader2 className="mb-2 h-6 w-6 animate-spin" />
                            <span className="text-xs font-bold">Processing File...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-gray-500 transition group-hover:text-blue-400">
                            <FileUp className="mb-2 h-6 w-6" />
                            <span className="text-xs font-bold">{fileName ? fileName : 'Click or Drag CsTimer CSV'}</span>
                        </div>
                    )}
                </div>

                {status && (
                    <div className="flex items-center space-x-2 rounded-lg border border-emerald-900 bg-emerald-950/50 p-3 text-sm text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>Imported {status.count} new solves to session.</span>
                    </div>
                )}
            </div>
        </div>
    );
};