import React, { useState } from 'react';
import { db } from '../../infrastructure/database/db';
import { parseCsTimerExport } from '../../infrastructure/parsers/CsTimerParser';
import { Clipboard, CheckCircle, Flame } from 'lucide-react';

export const ImportForm = () => {
    const [rawText, setRawText] = useState('');
    const [block, setBlock] = useState<'Sprint' | 'Resistencia'>('Sprint');
    const [successCount, setSuccessCount] = useState<number | null>(null);

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rawText.trim()) return;

        try {
            const parsedSolves = parseCsTimerExport(rawText, block);
            if (parsedSolves.length === 0) return;

            // Inserción masiva atómica en IndexedDB
            await db.solves.bulkAdd(parsedSolves);
            setSuccessCount(parsedSolves.length);
            setRawText('');
            setTimeout(() => setSuccessCount(null), 4000);
        } catch (error) {
            console.error('Error inyección base de datos:', error);
        }
    };

    return (
        <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-xl">
            <div className="mb-4 flex items-center space-x-2">
                <Flame className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-bold text-white">Ingesta de Tiempos de Práctica</h2>
            </div>

            <form onSubmit={handleImport} className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-gray-400">
                        Tipo de Bloque
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setBlock('Sprint')}
                            className={`p-3 text-sm font-semibold rounded-lg border transition ${block === 'Sprint'
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30'
                                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Sprint (Enfoque Casos)
                        </button>
                        <button
                            type="button"
                            onClick={() => setBlock('Resistencia')}
                            className={`p-3 text-sm font-semibold rounded-lg border transition ${block === 'Resistencia'
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30'
                                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            Flow State (Resistencia)
                        </button>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-sm font-medium text-gray-400">
                        Pegar Sesión Histórica de csTimer
                    </label>
                    <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Pegar aquí las líneas con formato del delimitador: No.;Time;Comment;Scramble;Date..."
                        className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={!rawText.trim()}
                    className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 p-3 font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Clipboard className="h-4 w-4" />
                    <span>Procesar y Sincronizar Sesión</span>
                </button>

                {successCount && (
                    <div className="flex items-center space-x-2 rounded-lg border border-emerald-500/50 bg-emerald-900/30 p-3 text-sm text-emerald-400">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Sincronización exitosa: {successCount} solves agregados al bloque {block}.</span>
                    </div>
                )}
            </form>
        </div>
    );
};