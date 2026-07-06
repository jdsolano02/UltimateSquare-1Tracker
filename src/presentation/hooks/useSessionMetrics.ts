import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../infrastructure/database/db';
import { getWindowStats, calculateMean, calculateWcaAverage, type MetricStats } from '../../application/useCases/stats';

export interface FullMetrics {
    totalSolves: number;
    single: { best: string; worst: string };
    mo3: MetricStats | null;
    ao5: MetricStats | null;
    ao12: MetricStats | null;
    ao25: MetricStats | null;
    ao100: MetricStats | null;
    globalAvg: { result: string; sigma: string };
    globalMean: string;
}

export const useSessionMetrics = (viewMode: 'Global' | 'Diario', dateStr: string) => {
    return useLiveQuery(async () => {
        let query = db.solves.toCollection();

        if (viewMode === 'Diario') {
            query = db.solves.where('dateStr').equals(dateStr);
        }

        const solves = await query.sortBy('date');
        const times = solves.map(s => s.time).filter(t => !isNaN(t) && t > 0);
        const totalSolves = times.length;

        if (totalSolves === 0) return { solves, metrics: null };

        const globalWca = calculateWcaAverage(times);
        const globalMo = calculateMean(times);

        const metrics: FullMetrics = {
            totalSolves,
            single: { best: Math.min(...times).toFixed(2), worst: Math.max(...times).toFixed(2) },
            mo3: getWindowStats(times, 3, 'mean'),
            ao5: getWindowStats(times, 5, 'avg'),
            ao12: getWindowStats(times, 12, 'avg'),
            ao25: getWindowStats(times, 25, 'avg'),
            ao100: getWindowStats(times, 100, 'avg'),
            globalAvg: { result: globalWca.result.toFixed(2), sigma: globalWca.sigma.toFixed(2) },
            globalMean: globalMo.result.toFixed(2)
        };

        return { solves, metrics };
    }, [viewMode, dateStr], { solves: [], metrics: null });
};