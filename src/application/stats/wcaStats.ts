export const calculateWCA = (times: number[], type: string) => {
    if (times.length < 3) return { avg: "0.00", sigma: "0.00" };

    // Calculate trim count once
    const trim = ((): number => {
        switch (type) {
            case 'Mo3': return 0;
            case 'Ao5': return 1;
            case 'Ao10': return 1;
            case 'Ao25': return 2;
            case 'Ao50': return 3;
            case 'Ao100': return 5;
            case 'Ao200': return 10;
            case 'Ao500': return 25;
            case 'Ao1000': return 50;
            case 'Ao2000': return 100;
            default: return Math.ceil(times.length * 0.05);
        }
    })();

    const sorted = [...times].sort((a, b) => a - b);
    const trimmed = sorted.slice(trim, sorted.length - trim);

    const sum = trimmed.reduce((a, b) => a + b, 0);
    const avg = sum / trimmed.length;

    const variance = trimmed.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / trimmed.length;
    const sigma = Math.sqrt(variance);

    return { avg: avg.toFixed(2), sigma: sigma.toFixed(2) };
};