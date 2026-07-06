import { useState } from 'react';
import { useSessionMetrics } from './presentation/hooks/useSessionMetrics';
import { ImportForm } from './presentation/components/ImportForm';
import { DailyTracker } from './presentation/components/DailyTracker';
import { getCaseAudit, getFrequencyDistribution } from './application/useCases/stats';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { ShieldAlert, CalendarDays, Globe } from 'lucide-react';

export default function App() {
    const [viewMode, setViewMode] = useState<'Global' | 'Diario'>('Diario');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const metrics = useSessionMetrics(viewMode, selectedDate);

    if (!metrics) {
        return <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">Cargando base de datos biométrica...</div>;
    }

    const caseAudit = getCaseAudit(metrics.solves);
    const frequencyData = getFrequencyDistribution(metrics.solves);

    return (
        <div className="min-h-screen bg-gray-950 p-4 text-gray-100 md:p-8">
            {/* HEADER Y FILTROS GLOBALES */}
            <header className="mx-auto mb-8 flex max-w-7xl flex-col justify-between gap-4 border-b border-gray-800 pb-6 md:flex-row md:items-end">
                <div>
                    <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight text-white">
                        SQUARE-1 <span className="rounded border border-emerald-800 bg-emerald-950/50 px-2 py-0.5 text-xl font-medium text-emerald-500">CORE ENGINE</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900 p-2">
                    <button onClick={() => setViewMode('Global')} className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${viewMode === 'Global' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><Globe className="h-4 w-4" /> GLOBAL (Todo)</button>
                    <button onClick={() => setViewMode('Diario')} className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 ${viewMode === 'Diario' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><CalendarDays className="h-4 w-4" /> POR DÍA</button>
                    {viewMode === 'Diario' && (
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-gray-950 text-gray-300 border border-gray-700 rounded p-1.5 text-xs focus:ring-blue-500 ml-2" />
                    )}
                </div>
            </header>

            <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">

                {/* COLUMNA IZQUIERDA: Formularios e Ingesta */}
                <div className="space-y-6 lg:col-span-1">
                    {viewMode === 'Diario' && <DailyTracker selectedDate={selectedDate} />}
                    <ImportForm />
                </div>

                {/* COLUMNA DERECHA: Estadísticas y Auditorías */}
                <div className="space-y-6 lg:col-span-2">

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* PANEL WCA STANDARD */}
                        {metrics.metrics ? (
                            <div className="flex-1 rounded-xl border border-gray-800 bg-gray-900 p-6">
                                <h3 className="mb-4 text-sm font-bold tracking-wider text-gray-400 uppercase">Métricas WCA ({metrics.metrics.totalSolves} solves)</h3>
                                <div className="space-y-2">
                                    <div className="mb-2 grid grid-cols-3 gap-2 border-b border-gray-800 pb-1 font-mono text-xs font-bold text-gray-500 uppercase">
                                        <span>Cat.</span><span>Curr.</span><span>Best</span>
                                    </div>
                                    {[
                                        { label: 'single', current: '-', best: metrics.metrics.single.best },
                                        { label: 'mo3', data: metrics.metrics.mo3 },
                                        { label: 'ao5', data: metrics.metrics.ao5 },
                                        { label: 'ao12', data: metrics.metrics.ao12 },
                                        { label: 'ao100', data: metrics.metrics.ao100 }
                                    ].map(row => (
                                        <div key={row.label} className="grid grid-cols-3 items-center gap-2 font-mono text-sm">
                                            <span className="text-gray-400">{row.label}</span>
                                            {row.data ? (
                                                <>
                                                    <span className="font-semibold text-white">{row.data.current} <span className="ml-1 text-[10px] text-gray-600">({row.data.currentSigma})</span></span>
                                                    <span className="font-semibold text-blue-400">{row.data.best} <span className="ml-1 text-[10px] text-gray-600">({row.data.bestSigma})</span></span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="font-semibold text-white">{row.current}</span>
                                                    <span className="font-bold text-emerald-400">{row.best}</span>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    <div className="mt-4 border-t border-gray-800 pt-3 font-mono text-sm">
                                        <span className="font-bold text-gray-400">Avg Global:</span> <span className="text-lg font-black text-purple-400">{metrics.metrics.globalAvg.result}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center rounded-xl border border-gray-800 bg-gray-900 p-6 font-mono text-sm text-gray-600">Sin registros en este periodo.</div>
                        )}

                        {/* PANEL DE AUDITORÍA DE CASOS DINÁMICA */}
                        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold tracking-wider text-gray-400 uppercase">
                                <ShieldAlert className="h-4 w-4 text-amber-500" /> Auditoría de Casos
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded border border-gray-800 bg-gray-950 p-2.5">
                                    <span className="font-mono text-xs font-bold text-blue-400">Solo OBL ({caseAudit.totalOBL})</span>
                                    <span className="text-sm font-black text-white">{caseAudit.avgOBL}s</span>
                                </div>
                                <div className="flex items-center justify-between rounded border border-gray-800 bg-gray-950 p-2.5">
                                    <span className="font-mono text-xs font-bold text-purple-400">Solo CSP ({caseAudit.totalCSP})</span>
                                    <span className="text-sm font-black text-white">{caseAudit.avgCSP}s</span>
                                </div>
                                <div className="flex items-center justify-between rounded border border-gray-800 bg-gray-950 p-2.5">
                                    <span className="font-mono text-xs font-bold text-amber-400">Combinado OBL+CSP ({caseAudit.totalCombo})</span>
                                    <span className="text-sm font-black text-white">{caseAudit.avgCombo}s</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gráfico de Evolución y Distribución Gaussiana */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="h-64 rounded-xl border border-gray-800 bg-gray-900 p-4">
                            <h3 className="mb-2 text-xs font-bold text-gray-500 uppercase">Evolución</h3>
                            <ResponsiveContainer width="100%" height="100%"><AreaChart data={metrics.solves}><XAxis dataKey="date" hide /><YAxis stroke="#374151" className="font-mono text-xs" /><Tooltip /><Area type="monotone" dataKey="time" stroke="#2563eb" fill="#1e3a8a" /></AreaChart></ResponsiveContainer>
                        </div>
                        <div className="h-64 rounded-xl border border-gray-800 bg-gray-900 p-4">
                            <h3 className="mb-2 text-xs font-bold text-gray-500 uppercase">Distribución (Gauss)</h3>
                            <ResponsiveContainer width="100%" height="100%"><BarChart data={frequencyData}><XAxis dataKey="range" stroke="#374151" className="font-mono text-[10px]" /><Tooltip /><Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}