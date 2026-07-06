export const calculateWCA = (times: number[], type: string) => {
    if (times.length === 0) return { result: "0.00", sigma: "0.00" };

    // Safety check para promedios menores a 3 (excepto totales)
    if (times.length < 3 && type !== 'Mean Total' && type !== 'Avg Total') {
        return { result: "0.00", sigma: "0.00" };
    }

    let trim = 0;
    if (type === 'mo3' || type === 'Mean Total') trim = 0;
    else if (type === 'ao5' || type === 'ao12') trim = 1;
    else if (type === 'ao25') trim = 2;
    else if (type === 'ao50') trim = 3;
    else if (type === 'ao100') trim = 5;
    else if (type === 'ao200') trim = 10;
    else if (type === 'ao500') trim = 25;
    else if (type === 'ao1000') trim = 50;
    else if (type === 'ao2000') trim = 100;
    else if (type === 'Avg Total') trim = Math.ceil(times.length * 0.05);

    const sorted = [...times].sort((a, b) => a - b);

    // Evitar recortar más tiempos de los que existen
    const safeTrim = Math.min(trim, Math.floor((sorted.length - 1) / 2));
    const trimmed = sorted.slice(safeTrim, sorted.length - safeTrim);

    if (trimmed.length === 0) return { result: "0.00", sigma: "0.00" };

    const sum = trimmed.reduce((a, b) => a + b, 0);
    const avg = sum / trimmed.length;

    // Standard Deviation (Sigma)
    const variance = trimmed.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / trimmed.length;
    const sigma = Math.sqrt(variance);

    return { result: avg.toFixed(2), sigma: sigma.toFixed(2) };
};