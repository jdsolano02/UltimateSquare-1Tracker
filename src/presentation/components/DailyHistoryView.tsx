import { useState, useEffect } from 'react';
import { db, type DailyLog } from '../../infrastructure/database/db';
import { Calendar } from 'lucide-react';

export const DailyHistoryView = () => {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [log, setLog] = useState<DailyLog | null>(null);

    useEffect(() => {
        // Carga todas las fechas disponibles que tienen logs
        db.logs.orderBy('dateStr').reverse().primaryKeys().then(keys => {
            setDates(keys as string[]);
        });
    }, []);

    useEffect(() => {
        if (selectedDate) {
            // Corrección: Transformamos 'undefined' a 'null' explícitamente para complacer a TypeScript
            db.logs.get(selectedDate).then(data => setLog(data || null));
        }
    }, [selectedDate]);

    return (
        <div className="rounded-xl bg-gray-900 p-6 text-white">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                <Calendar /> Daily History
            </h2>
            <select
                className="mb-4 w-full rounded bg-black p-2"
                onChange={(e) => setSelectedDate(e.target.value)}
            >
                <option value="">Select a date...</option>
                {dates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {log && (
                <div className="space-y-4">
                    <div className="rounded bg-gray-800 p-4">
                        <p>Exercise: {log.exercise}</p>
                        <p>Mental Energy: {log.mentalEnergy}/10</p>
                        <p>Notes: {log.notes}</p>
                    </div>
                </div>
            )}
        </div>
    );
};