import type { Solve } from '../../domain/entities/Solve';

// Calcula la Desviación Estándar Poblacional (σ)
const calculateSigma = (arr: number[], mean: number): number => {
    if (arr.length <= 1) return 0;
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
};

// Arithmetic Mean (mo) - No elimina tiempos
export const calculateMean = (times: number[]) => {
    if (times.length === 0) return { result: 0, sigma: 0 };
    const sum = times.reduce((a, b) => a + b, 0);
    const result = sum / times.length;
    return { result, sigma: calculateSigma(times, result) };
};

// WCA Average (ao) - Elimina el 5% (techo) de arriba y abajo
export const calculateWcaAverage = (times: number[]) => {
    if (times.length < 3) return { result: 0, sigma: 0 };
    const dropCount = Math.ceil(times.length * 0.05); // WCA 9f2
    const sorted = [...times].sort((a, b) => a - b);
    const trimmed = sorted.slice(dropCount, times.length - dropCount);
    const sum = trimmed.reduce((a, b) => a + b, 0);
    const result = sum / trimmed.length;
    return { result, sigma: calculateSigma(trimmed, result) };
};

// Generador de Ventanas Deslizantes (Current vs Best)
export interface MetricStats {
    current: string;
    currentSigma: string;
    best: string;
    bestSigma: string;
}

export const getWindowStats = (times: number[], size: number, type: 'mean' | 'avg'): MetricStats | null => {
    if (times.length < size) return null;

    const calcFn = type === 'mean' ? calculateMean : calculateWcaAverage;

    // Cálculo Current (Últimos X solves)
    const currentWindow = times.slice(-size);
    const currentData = calcFn(currentWindow);

    // Cálculo Best (Buscando la mejor ventana histórica)
    let bestVal = Infinity;
    let bestSigma = 0;

    for (let i = 0; i <= times.length - size; i++) {
        const window = times.slice(i, i + size);
        const data = calcFn(window);
        if (data.result < bestVal) {
            bestVal = data.result;
            bestSigma = data.sigma;
        }
    }

    return {
        current: currentData.result.toFixed(2),
        currentSigma: currentData.sigma.toFixed(2),
        best: bestVal.toFixed(2),
        bestSigma: bestSigma.toFixed(2)
    };
};

/* --- MANTENER TUS FUNCIONES OBL Y FREQUENCY INTACTAS ABAJO --- */
export interface OblLatency { caseName: string; averageTime: number; count: number; }
export const getOBLPerformance = (solves: Solve[]): OblLatency[] => {
    const groups: { [key: string]: number[] } = {};
    solves.forEach(s => {
        if (s.oblCase && !isNaN(s.time)) {
            if (!groups[s.oblCase]) groups[s.oblCase] = [];
            groups[s.oblCase].push(s.time);
        }
    });
    return Object.keys(groups).map(caseName => {
        const times = groups[caseName];
        const sum = times.reduce((acc, t) => acc + t, 0);
        return { caseName, averageTime: parseFloat((sum / times.length).toFixed(2)), count: times.length };
    }).sort((a, b) => b.averageTime - a.averageTime);
};

export interface FrequencyData { range: string; count: number; }
export const getFrequencyDistribution = (solves: Solve[]): FrequencyData[] => {
    const validSolves = solves.filter(s => !isNaN(s.time));
    if (validSolves.length === 0) return [];
    const times = validSolves.map(s => s.time);
    const min = Math.floor(Math.min(...times));
    const max = Math.ceil(Math.max(...times));
    const distribution: { [key: number]: number } = {};
    for (let i = min; i <= max; i++) distribution[i] = 0;
    times.forEach(t => { distribution[Math.floor(t)]++; });
    return Object.keys(distribution).map(key => ({ range: `${key}s`, count: distribution[parseInt(key)] }));
};

// --- AUDITORÍA DE CASOS (OBL / CSP) ---
export interface CaseAudit {
    totalOBL: number;
    totalCSP: number;
    totalCombo: number;
    avgOBL: string;
    avgCSP: string;
    avgCombo: string;
}

export const getCaseAudit = (solves: Solve[]): CaseAudit => {
    const onlyOBL = solves.filter(s => s.isObl && !s.isCsp && !isNaN(s.time));
    const onlyCSP = solves.filter(s => s.isCsp && !s.isObl && !isNaN(s.time));
    const combo = solves.filter(s => s.isObl && s.isCsp && !isNaN(s.time));

    return {
        totalOBL: onlyOBL.length,
        totalCSP: onlyCSP.length,
        totalCombo: combo.length,
        avgOBL: calculateWcaAverage(onlyOBL.map(s => s.time)).result.toFixed(2),
        avgCSP: calculateWcaAverage(onlyCSP.map(s => s.time)).result.toFixed(2),
        avgCombo: calculateWcaAverage(combo.map(s => s.time)).result.toFixed(2),
    };
};