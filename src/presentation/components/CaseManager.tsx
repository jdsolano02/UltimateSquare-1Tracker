import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type CaseStatus, type EvilnessType } from '../../infrastructure/database/db';
import { OBL_BY_SLICES, OBL_BY_PRIORITY, CSP_CASES, EP_CASES } from '../../domain/constants/cases';
import { Target, BookOpen, Layers, Flame, Smile } from 'lucide-react';

interface CaseManagerProps {
    category: 'OBL' | 'CSP' | 'EP';
}

interface CaseItem {
    name: string;
    prob?: number;
}

interface CaseGroup {
    title: string;
    items: CaseItem[];
}

export const CaseManager: React.FC<CaseManagerProps> = ({ category }) => {
    const [oblView, setOblView] = useState<'slices' | 'priority'>('slices');

    const savedCases = useLiveQuery(
        () => db.cases.where('category').equals(category).toArray(),
        [category]
    ) || [];

    const caseMap = new Map(savedCases.map(c => [c.caseName, c]));

    let totalCases = 0;
    let groups: CaseGroup[] = [];

    if (category === 'OBL') {
        const source = oblView === 'slices' ? OBL_BY_SLICES : OBL_BY_PRIORITY;
        groups = source.map(g => ({
            title: 'category' in g ? g.category : g.title,
            items: g.cases.map(name => ({ name }))
        }));
        totalCases = groups.reduce((acc, g) => acc + g.items.length, 0);
    } else if (category === 'EP') {
        groups = EP_CASES.map(g => ({
            title: g.category,
            items: g.cases.map(name => ({ name }))
        }));
        totalCases = groups.reduce((acc, g) => acc + g.items.length, 0);
    } else if (category === 'CSP') {
        groups = [{
            title: 'All CSP Cases',
            items: CSP_CASES.map(c => ({ name: c.name, prob: c.prob }))
        }];
        totalCases = CSP_CASES.length;
    }

    const learnedCount = savedCases.length;
    const progressPercent = totalCases === 0 ? 0 : Math.round((learnedCount / totalCases) * 100);

    const handleFieldChange = async (caseName: string, field: string, value: string | boolean) => {
        const id = `${category}-${caseName}`;
        const existing = caseMap.get(caseName) || { id, category, caseName, status: 'Learning' as CaseStatus };

        if (field === 'status' && value === 'Unlearned') {
            await db.cases.delete(id);
            return;
        }

        const updatedData = { ...existing, [field]: value };
        await db.cases.put(updatedData);
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-6">
            <div className="mb-6 shrink-0 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-2xl font-black text-white">
                        {category === 'OBL' && <BookOpen className="text-blue-500" />}
                        {category === 'CSP' && <Target className="text-purple-500" />}
                        {category === 'EP' && <Layers className="text-amber-500" />}
                        {category} Training Matrix
                    </h2>

                    {category === 'OBL' && (
                        <div className="flex rounded-lg border border-gray-800 bg-gray-950 p-1">
                            <button onClick={() => setOblView('slices')} className={`px-3 py-1 text-xs font-bold rounded-md transition ${oblView === 'slices' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>By Slices</button>
                            <button onClick={() => setOblView('priority')} className={`px-3 py-1 text-xs font-bold rounded-md transition ${oblView === 'priority' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}>By Priority</button>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 p-4">
                    <div>
                        <p className="text-xs font-bold tracking-wider text-gray-500 uppercase">Completion</p>
                        <p className="text-2xl font-black text-white">{learnedCount} <span className="text-lg text-gray-600">/ {totalCases}</span></p>
                    </div>
                    <div className="w-1/2">
                        <div className="mb-1 flex justify-between text-xs font-bold">
                            <span className="text-emerald-500">Progress</span>
                            <span className="text-white">{progressPercent}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="custom-scrollbar flex-1 space-y-8 overflow-y-auto pr-2">
                {groups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-3">
                        <h3 className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900 pb-2 text-sm font-bold text-gray-400">
                            {group.title}
                        </h3>

                        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {group.items.map((item: CaseItem, itemIdx: number) => {
                                const savedData = caseMap.get(item.name);
                                const currentStatus = savedData?.status || 'Unlearned';

                                const isGoodAlg = savedData?.isGoodAlg || false;
                                const isBadAlg = savedData?.isBadAlg || false;
                                const evilness: EvilnessType = savedData?.evilness || 'Unrated';

                                return (
                                    <div key={itemIdx} className={`p-3 rounded-lg border transition-all ${currentStatus !== 'Unlearned' ? 'bg-gray-800 border-gray-700' : 'bg-gray-950 border-gray-800/50 opacity-70 hover:opacity-100'}`}>
                                        <div className="mb-2 flex items-start justify-between">
                                            <span className={`text-sm font-bold ${currentStatus === 'Mastered' ? 'text-emerald-400' : 'text-gray-200'}`}>
                                                {item.name}
                                            </span>
                                            {item.prob && (
                                                <span className="rounded border border-purple-800/50 bg-purple-900/30 px-1.5 py-0.5 text-[10px] text-purple-400">
                                                    {item.prob}%
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <select
                                                value={currentStatus}
                                                onChange={(e) => handleFieldChange(item.name, 'status', e.target.value)}
                                                className="w-full bg-black border border-gray-700 rounded p-1.5 text-xs text-white focus:border-blue-500 outline-none"
                                            >
                                                <option value="Unlearned">Not Learned</option>
                                                <option value="Learning">Learning</option>
                                                <option value="Drill">Drill</option>
                                                <option value="Mastered">Mastered ✓</option>
                                            </select>

                                            {category === 'CSP' && (
                                                <div className="mt-1 space-y-2 border-t border-gray-700 pt-2">
                                                    <div className="flex gap-2">
                                                        <label className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1 border rounded cursor-pointer transition ${isGoodAlg ? 'bg-emerald-900/40 border-emerald-500 text-emerald-400' : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                                                            <input type="checkbox" className="hidden" checked={isGoodAlg} onChange={(e) => handleFieldChange(item.name, 'isGoodAlg', e.target.checked)} />
                                                            Good Alg
                                                        </label>
                                                        <label className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1 border rounded cursor-pointer transition ${isBadAlg ? 'bg-red-900/40 border-red-500 text-red-400' : 'bg-black border-gray-700 text-gray-500 hover:border-gray-500'}`}>
                                                            <input type="checkbox" className="hidden" checked={isBadAlg} onChange={(e) => handleFieldChange(item.name, 'isBadAlg', e.target.checked)} />
                                                            Bad Alg
                                                        </label>
                                                    </div>

                                                    <div className="flex overflow-hidden rounded border border-gray-700 bg-black">
                                                        <button
                                                            onClick={() => handleFieldChange(item.name, 'evilness', 'Nice')}
                                                            className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 border-r border-gray-700 transition ${evilness === 'Nice' ? 'bg-blue-900/50 text-blue-400 font-bold' : 'text-gray-500 hover:bg-gray-800'}`}
                                                        >
                                                            <Smile className="h-3 w-3" /> Nice
                                                        </button>
                                                        <button
                                                            onClick={() => handleFieldChange(item.name, 'evilness', 'Unrated')}
                                                            className={`flex-1 flex items-center justify-center text-[10px] py-1.5 border-r border-gray-700 transition ${evilness === 'Unrated' ? 'bg-gray-800 text-gray-300 font-bold' : 'text-gray-600 hover:bg-gray-800'}`}
                                                        >
                                                            -
                                                        </button>
                                                        <button
                                                            onClick={() => handleFieldChange(item.name, 'evilness', 'Evil')}
                                                            className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 transition ${evilness === 'Evil' ? 'bg-orange-900/50 text-orange-500 font-bold' : 'text-gray-500 hover:bg-gray-800'}`}
                                                        >
                                                            <Flame className="h-3 w-3" /> Evil
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
                ))}
            </div>
        </div>
    );
};