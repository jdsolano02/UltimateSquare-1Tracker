import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import type { Solve } from '../../domain/entities/Solve';

const getFrequencyData = (solves: Solve[]) => {
    const times = solves.map(s => Number(s.time));
    if (times.length === 0) return [];

    const min = Math.floor(Math.min(...times));
    const max = Math.ceil(Math.max(...times));
    const buckets: { [key: string]: number } = {};

    for (let i = min; i <= max; i++) buckets[i.toString()] = 0;

    times.forEach(t => {
        const key = Math.floor(t).toString();
        buckets[key] = (buckets[key] || 0) + 1;
    });

    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
};

export const DashboardView = ({ solves, viewMode }: { solves: Solve[], viewMode: string }) => {
    const validSolves = solves.filter(s => Number(s.time) > 0);
    const totalCount = validSolves.length;

    let mean = 0;

    if (totalCount > 0) {
        // Cálculo WCA con Trim del 5%
        const trim = Math.ceil(totalCount * 0.05);
        const sorted = [...validSolves.map(s => Number(s.time))].sort((a, b) => a - b);
        const trimmed = sorted.slice(trim, sorted.length - trim);
        const sum = trimmed.reduce((a, b) => a + b, 0);
        mean = trimmed.length > 0 ? sum / trimmed.length : 0;
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex h-64 flex-col rounded-xl border border-gray-800 bg-gray-900 p-4 shadow-xl">
                <div className="mb-4 flex items-end justify-between">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">{viewMode} Evolution</h4>
                    <span className="text-xl font-black text-blue-400">{mean > 0 ? mean.toFixed(2) : '-'}s <span className="text-[10px] text-gray-500 uppercase">Avg</span></span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={validSolves}>
                        <XAxis dataKey="dateStr" hide />
                        <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#3b82f6' }} />
                        <Area type="monotone" dataKey="time" stroke="#3b82f6" fill="#1e3a8a" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="flex h-64 flex-col rounded-xl border border-gray-800 bg-gray-900 p-4 shadow-xl">
                <div className="mb-4 flex items-end justify-between">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Gauss Distribution</h4>
                    <span className="text-xl font-black text-purple-400">{totalCount} <span className="text-[10px] text-gray-500 uppercase">Solves</span></span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getFrequencyData(validSolves)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="range" stroke="#4b5563" fontSize={10} tickFormatter={(val) => `${val}s`} />
                        <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px' }} cursor={{ fill: '#1f2937' }} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};