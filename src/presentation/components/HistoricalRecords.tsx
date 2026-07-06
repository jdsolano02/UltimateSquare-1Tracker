import { useEffect, useState } from 'react';
import { db } from '../../infrastructure/database/db';

// 1. Definimos la interfaz estricta
interface PRRecord {
    type: string;
    time: number;
    date: string;
}

export const HistoricalRecords = () => {
    // 2. Usamos la interfaz en el estado
    const [prs, setPrs] = useState<PRRecord[]>([]);

    useEffect(() => {
        const calculatePRs = async () => {
            const allSolves = await db.solves.orderBy('dateStr').toArray();

            // 3. Eliminamos el 'any' usando la interfaz aquí también
            const records: PRRecord[] = [];
            let bestSingle = Infinity;

            allSolves.forEach(solve => {
                if (solve.time < bestSingle && solve.time > 0) {
                    bestSingle = solve.time;
                    records.push({ type: 'Single', time: solve.time, date: solve.dateStr });
                }
            });
            setPrs(records);
        };
        calculatePRs();
    }, []);

    return (
        <div className="rounded-xl bg-gray-900 p-6 text-white">
            <h2 className="mb-4 text-xl font-bold">Historical Records</h2>
            <div className="space-y-2">
                {prs.map((pr, i) => (
                    <div key={i} className="flex justify-between border-b border-gray-700 p-2">
                        <span>{pr.type}</span>
                        <span className="font-mono text-emerald-400">{pr.time}s</span>
                        <span className="text-sm text-gray-500">{pr.date}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};