import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CaseStatus, type EvilnessType } from '../../infrastructure/database/db';
import {
    OBL_BY_SLICES, OBL_CO_CASES, OBL_EO_CASES,
    CSP_CASES,
    NP_PBL_CASES, DP_PBL_CASES, PBL_CP_CASES, PBL_EP_CASES
} from '../../domain/constants/cases';
import { Target, BookOpen, Flame, Smile, Grid3X3, Search, Info } from 'lucide-react';

interface CaseManagerProps { category: 'OBL' | 'CSP' | 'PBL'; }
interface CaseItem { name: string; prob?: number; }
interface CaseGroup { title: string; items: CaseItem[]; }

const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative ml-2 inline-flex items-center justify-center">
        <Info className="h-4 w-4 cursor-help text-gray-500 transition hover:text-blue-400" />
        <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded bg-gray-100 p-2.5 text-center font-sans text-xs leading-snug font-bold text-gray-900 shadow-xl">{text}</div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-100"></div>
        </div>
    </div>
);

export const CaseManager: React.FC<CaseManagerProps> = ({ category }) => {
    const [statusFilter, setStatusFilter] = useState<'All' | 'Unlearned' | 'Learning' | 'Drill' | 'Mastered'>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [oblFilters, setOblFilters] = useState<string[]>(['Slices']);
    const [pblFilters, setPblFilters] = useState<string[]>(['CP', 'EP']);

    const savedCases = useLiveQuery(() => db.cases.where('category').equals(category).toArray(), [category]) || [];
    const caseMap = new Map(savedCases.map(c => [c.caseName, c]));

    const toggleFilter = (f: string, current: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (current.includes(f)) setter(current.filter(item => item !== f));
        else setter([...current, f]);
    };

    let groups: CaseGroup[] = [];

    if (category === 'OBL') {
        if (oblFilters.includes('Slices')) groups.push(...OBL_BY_SLICES.map(g => ({ title: g.category, items: g.cases.map(name => ({ name })) })));
        if (oblFilters.includes('CO')) groups.push({ title: 'Corner Orientation (CO)', items: OBL_CO_CASES.map(name => ({ name })) });
        if (oblFilters.includes('EO')) groups.push({ title: 'Edge Orientation (EO)', items: OBL_EO_CASES.map(name => ({ name })) });
    } else if (category === 'PBL') {
        if (pblFilters.includes('CP')) groups.push({ title: 'Corner Permutation (CP)', items: PBL_CP_CASES.map(name => ({ name })) });
        if (pblFilters.includes('EP')) groups.push({ title: 'Edge Permutation (EP)', items: PBL_EP_CASES.map(name => ({ name })) });
        if (pblFilters.includes('NP PBL')) groups.push(...NP_PBL_CASES.map(g => ({ title: g.category, items: g.cases.map(name => ({ name })) })));
        if (pblFilters.includes('DP PBL')) groups.push(...DP_PBL_CASES.map(g => ({ title: g.category, items: g.cases.map(name => ({ name })) })));
    } else if (category === 'CSP') {
        groups = [{ title: 'All CSP Cases', items: CSP_CASES.map(c => ({ name: c.name, prob: c.prob })) }];
    }

    const uniqueDisplayedCases = new Set(groups.flatMap(g => g.items.map(i => i.name)));

    const getLocalYYYYMMDD = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };

    const handleFieldChange = async (caseName: string, field: string, value: string | boolean) => {
        const id = `${category}-${caseName}`;
        const existing = caseMap.get(caseName) || { id, category, caseName, status: 'Unlearned' as CaseStatus };

        if (field === 'status' && value === 'Unlearned') {
            await db.cases.delete(id);
            return;
        }

        const updatedData = { ...existing, [field]: value } as typeof existing & { dateUpdated?: string };

        if (field === 'status') {
            updatedData.dateUpdated = getLocalYYYYMMDD();
        }

        await db.cases.put(updatedData);
    };

    let totalCases: number;
    let masteredCount: number;

    if (category === 'OBL') {
        totalCases = 73;
        masteredCount = Array.from(uniqueDisplayedCases).filter(name => caseMap.get(name)?.status === 'Mastered').length;
    } else if (category === 'PBL') {
        totalCases = 1934;
        masteredCount = Array.from(uniqueDisplayedCases).filter(name => caseMap.get(name)?.status === 'Mastered').length;
    } else {
        totalCases = uniqueDisplayedCases.size;
        masteredCount = Array.from(uniqueDisplayedCases).filter(name => caseMap.get(name)?.status === 'Mastered').length;
    }

    const progressPercent = totalCases === 0 ? 0 : Math.round((masteredCount / totalCases) * 100);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Mastered': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] border-emerald-500';
            case 'Drill': return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)] border-yellow-500';
            case 'Learning': return 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] border-orange-500';
            default: return 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)] border-red-600';
        }
    };

    const filteredGroups = groups.map(g => ({
        ...g,
        items: g.items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const currentStatus = caseMap.get(item.name)?.status || 'Unlearned';
            const matchesStatus = statusFilter === 'All' || currentStatus === statusFilter;
            return matchesSearch && matchesStatus;
        })
    })).filter(g => g.items.length > 0);

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-6 shrink-0 space-y-4">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <h2 className="flex items-center gap-2 text-2xl font-black text-white">
                        {category === 'OBL' && <BookOpen className="text-blue-500" />}
                        {category === 'CSP' && <Target className="text-purple-500" />}
                        {category === 'PBL' && <Grid3X3 className="text-pink-500" />}
                        {category} Training Matrix
                        <Tooltip text={`Select multiple subsets below. The search bar filters cases instantly.`} />
                    </h2>

                    <div className="relative w-full md:w-64">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-4 w-4 text-gray-500" /></div>
                        <input type="text" className="block w-full rounded-lg border border-gray-800 bg-gray-950 p-2.5 pl-10 text-sm text-white transition outline-none focus:border-blue-500 focus:ring-blue-500" placeholder={`Search ${category} cases...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="custom-scrollbar flex items-center justify-start gap-2 overflow-x-auto pb-1">
                    {category === 'OBL' && ['Slices', 'CO', 'EO'].map(f => (
                        <button key={f} onClick={() => toggleFilter(f, oblFilters, setOblFilters)} className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition ${oblFilters.includes(f) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-500 hover:text-white'}`}>{f}</button>
                    ))}
                    {category === 'PBL' && ['NP PBL', 'DP PBL', 'CP', 'EP'].map(f => (
                        <button key={f} onClick={() => toggleFilter(f, pblFilters, setPblFilters)} className={`whitespace-nowrap px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition ${pblFilters.includes(f) ? 'bg-pink-600 border-pink-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-500 hover:text-white'}`}>{f}</button>
                    ))}
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 p-4">
                    <div>
                        <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">Mastered Overall</p>
                        <p className="text-2xl font-black text-white">{masteredCount} <span className="text-lg text-gray-600">/ {totalCases}</span></p>
                    </div>
                    <div className="w-1/2">
                        <div className="mb-1 flex justify-between text-xs font-bold">
                            <span className="text-emerald-500">View Completion</span>
                            <span className="text-white">{progressPercent}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                </div>

                <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-2">
                    {(['All', 'Unlearned', 'Learning', 'Drill', 'Mastered'] as const).map(f => (
                        <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition ${statusFilter === f ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-950 border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white'}`}>{f}</button>
                    ))}
                </div>
            </div>

            <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto pr-2">
                {filteredGroups.length === 0 ? (
                    <div className="py-10 text-center text-gray-500 italic">Select at least one sub-category and ensure your filters match the cases.</div>
                ) : (
                    filteredGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-3">
                            <h3 className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900 pb-2 text-sm font-bold text-blue-400">{group.title}</h3>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                {group.items.map((item: CaseItem, itemIdx: number) => {
                                    const savedData = caseMap.get(item.name);
                                    const currentStatus = savedData?.status || 'Unlearned';
                                    const isGoodAlg = savedData?.isGoodAlg || false;
                                    const isBadAlg = savedData?.isBadAlg || false;
                                    const evilness: EvilnessType = savedData?.evilness || 'Unrated';

                                    return (
                                        <div key={`${groupIdx}-${itemIdx}`} className={`p-4 rounded-lg border transition-all ${currentStatus !== 'Unlearned' ? 'bg-gray-800 border-gray-700 shadow-md' : 'bg-gray-950 border-gray-800/50 opacity-80 hover:opacity-100'}`}>
                                            <div className="mb-4 flex items-start justify-between">
                                                <span className={`text-base font-black ${currentStatus === 'Mastered' ? 'text-emerald-400' : 'text-gray-200'} break-all pr-2 leading-tight`}>{item.name}</span>
                                                {item.prob && <span className="rounded border border-purple-800/50 bg-purple-900/30 px-1.5 py-0.5 whitespace-nowrap text-[10px] text-purple-400">{item.prob}%</span>}
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <div className="mb-1 flex w-full gap-1">
                                                    {[
                                                        { status: 'Unlearned', label: 'Not' },
                                                        { status: 'Learning', label: 'Learn' },
                                                        { status: 'Drill', label: 'Drill' },
                                                        { status: 'Mastered', label: 'Master' }
                                                    ].map(s => (
                                                        <button key={s.status} title={s.status} onClick={() => handleFieldChange(item.name, 'status', s.status)}
                                                            className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-black rounded border transition-all uppercase tracking-tight ${currentStatus === s.status ? getStatusColor(s.status) + ' text-white' : 'bg-black border-gray-700 text-gray-500 hover:bg-gray-800'
                                                                }`}
                                                        >
                                                            {s.label}
                                                        </button>
                                                    ))}
                                                </div>

                                                {category === 'CSP' && (
                                                    <div className="mt-1 space-y-2 border-t border-gray-700 pt-3">
                                                        <div className="flex gap-2">
                                                            <label className={`flex-1 flex items-center justify-center gap-1 text-[11px] py-2 border rounded cursor-pointer font-bold transition ${isGoodAlg ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                                                                <input type="checkbox" className="hidden" checked={isGoodAlg} onChange={(e) => handleFieldChange(item.name, 'isGoodAlg', e.target.checked)} />
                                                                Good Alg
                                                            </label>
                                                            <label className={`flex-1 flex items-center justify-center gap-1 text-[11px] py-2 border rounded cursor-pointer font-bold transition ${isBadAlg ? 'bg-red-900/40 border-red-500 text-red-400' : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                                                                <input type="checkbox" className="hidden" checked={isBadAlg} onChange={(e) => handleFieldChange(item.name, 'isBadAlg', e.target.checked)} />
                                                                Bad Alg
                                                            </label>
                                                        </div>
                                                        <div className="flex overflow-hidden rounded border border-gray-700 bg-black">
                                                            <button onClick={() => handleFieldChange(item.name, 'evilness', 'Nice')} className={`flex-1 flex items-center justify-center gap-1 text-[11px] py-2 border-r border-gray-700 transition ${evilness === 'Nice' ? 'bg-blue-900/50 text-blue-400 font-bold' : 'text-gray-500 hover:bg-gray-800'}`}>
                                                                <Smile className="h-4 w-4" /> Nice
                                                            </button>
                                                            <button onClick={() => handleFieldChange(item.name, 'evilness', 'Unrated')} className={`flex-1 flex items-center justify-center text-[11px] py-2 border-r border-gray-700 transition ${evilness === 'Unrated' ? 'bg-gray-800 text-gray-300 font-bold' : 'text-gray-600 hover:bg-gray-800'}`}>-</button>
                                                            <button onClick={() => handleFieldChange(item.name, 'evilness', 'Evil')} className={`flex-1 flex items-center justify-center gap-1 text-[11px] py-2 transition ${evilness === 'Evil' ? 'bg-orange-900/50 text-orange-500 font-bold' : 'text-gray-500 hover:bg-gray-800'}`}>
                                                                <Flame className="h-4 w-4" /> Evil
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};