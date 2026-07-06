import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../infrastructure/database/db';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';

// Motor de trimado WCA preciso
const getStats = (times: number[], type: 'MeanTotal' | 'AvgTotal') => {
    if (times.length < 3) return "0.00";

    // Si es AvgTotal, quitamos el 5% de cada lado (redondeado hacia arriba)
    const trim = type === 'AvgTotal' ? Math.ceil(times.length * 0.05) : 0;

    const sorted = [...times].sort((a, b) => a - b);
    const trimmed = sorted.slice(trim, sorted.length - trim);
    const sum = trimmed.reduce((a, b) => a + b, 0);
    return (sum / trimmed.length).toFixed(2);
};

// Generador de cubetas para la distribuci�n de Gauss
const getFrequencyData = (solves: any[]) => {
    const times = solves.map(s => s.time);
    if (times.length === 0) return [];

    const min = Math.floor(Math.min(...times));
    const max = Math.ceil(Math.max(...times));
    const buckets: { [key: string]: number } = {};

    // Creamos buckets de 1 segundo
    for (let i = min; i <= max; i++) buckets[i.toString()] = 0;

    times.forEach(t => {
        const key = Math.floor(t).toString();
        buckets[key] = (buckets[key] || 0) + 1;
    });

    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
};

export const DashboardView = () => {
    const solves = useLiveQuery(() => db.solves.toArray()) || [];

    const sprintSolves = solves.filter(s => s.block === 'Sprint').map(s => s.time);
    const flowSolves = solves.filter(s => s.block === 'Resistencia').map(s => s.time);
    const allSolves = solves.map(s => s.time);

    return (
        <div className="space-y-6">
            {/* 1. Totales de Sesi�n */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase">Sprint Avg (5% Trim)</p>
                    <h3 className="text-3xl font-black text-white">{getStats(sprintSolves, 'AvgTotal')}s</h3>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase">Flowstate Avg (5% Trim)</p>
                    <h3 className="text-3xl font-black text-white">{getStats(flowSolves, 'AvgTotal')}s</h3>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase">Final Global Avg (5% Trim)</p>
                    <h3 className="text-3xl font-black text-emerald-400">{getStats(allSolves, 'AvgTotal')}s</h3>
                </div>
            </div>

            {/* 2. Gr�ficas */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="h-64 rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <h4 className="mb-4 text-xs font-bold text-gray-500 uppercase">Evolution History</h4>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={solves}>
                            <XAxis dataKey="dateStr" hide />
                            <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none' }} />
                            <Area type="monotone" dataKey="time" stroke="#3b82f6" fill="#1e3a8a" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="h-64 rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <h4 className="mb-4 text-xs font-bold text-gray-500 uppercase">Gauss Distribution</h4>
                    <ResponsiveContainer width="100%" height="80%">
                        <BarChart data={getFrequencyData(solves)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="range" stroke="#666" fontSize={10} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};