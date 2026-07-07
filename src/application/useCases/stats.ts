/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Solve } from '../../domain/entities/Solve';

export const calculateWcaAverage = (times: number[]) => {
    if (times.length === 0) return { result: 0 };
    if (times.length < 3) {
        return { result: times.reduce((a, b) => a + b, 0) / times.length };
    }
    const trim = Math.ceil(times.length * 0.05);
    const sorted = [...times].sort((a, b) => a - b);
    const trimmed = sorted.slice(trim, times.length - trim);
    return { result: trimmed.reduce((a, b) => a + b, 0) / trimmed.length };
};

export const calculateSessionStats = (solves: Solve[]) => {
    // 1. Filtrado y parseo seguro a números
    const validSolves = solves.filter(s => !isNaN(Number(s.time)) && Number(s.time) > 0);
    const times = validSolves.map(s => Number(s.time));

    if (times.length === 0) return null;

    const min = Math.floor(Math.min(...times));
    const max = Math.ceil(Math.max(...times));

    // 2. Gráfico de Distribución
    const distribution = new Array(max - min + 1).fill(0);
    const labels = new Array(max - min + 1).fill('');

    times.forEach(t => {
        const idx = Math.floor(t) - min;
        if (idx >= 0 && idx < distribution.length) {
            distribution[idx]++;
        }
    });

    for (let i = 0; i < labels.length; i++) {
        labels[i] = `${min + i}s`;
    }

    // 3. Agrupación por casos específicos (OBL / CSP)
    const groups: Record<string, number[]> = {};
    validSolves.forEach(s => {
        // Leemos propiedades de forma segura en caso de que existan en la entidad
        const solveAny = s as any;
        const caseName = solveAny.oblCase || solveAny.cspCase;

        if (caseName) {
            if (!groups[caseName]) groups[caseName] = [];
            groups[caseName].push(Number(s.time));
        }
    });

    // 4. Performance de Sub-categorías
    const onlyOBL = validSolves.filter(s => {
        const isObl = (s as any).isObl || s.comment?.toLowerCase().includes('obl');
        const isCsp = (s as any).isCsp || s.comment?.toLowerCase().includes('csp');
        return isObl && !isCsp;
    });

    const onlyCSP = validSolves.filter(s => {
        const isObl = (s as any).isObl || s.comment?.toLowerCase().includes('obl');
        const isCsp = (s as any).isCsp || s.comment?.toLowerCase().includes('csp');
        return isCsp && !isObl;
    });

    const combo = validSolves.filter(s => {
        const isObl = (s as any).isObl || s.comment?.toLowerCase().includes('obl');
        const isCsp = (s as any).isCsp || s.comment?.toLowerCase().includes('csp');
        return isObl && isCsp;
    });

    // 5. Retorno estructurado para el Dashboard
    return {
        total: times.length,
        min,
        max,
        distribution,
        labels,
        groups,
        performance: {
            avgOBL: calculateWcaAverage(onlyOBL.map(s => Number(s.time))).result.toFixed(2),
            avgCSP: calculateWcaAverage(onlyCSP.map(s => Number(s.time))).result.toFixed(2),
            avgCombo: calculateWcaAverage(combo.map(s => Number(s.time))).result.toFixed(2),
        },
    };
};