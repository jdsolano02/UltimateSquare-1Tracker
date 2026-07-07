import Dexie, { type Table } from 'dexie';
import type { Solve } from '../../domain/entities/Solve';

export type CaseStatus = 'Learning' | 'Drill' | 'Mastered';
export type ExerciseType = 'Lifting' | 'Cardio' | 'Other' | 'None';
export type EvilnessType = 'Evil' | 'Nice' | 'Unrated';

export interface CaseRecord {
    id: string;
    category: 'CSP' | 'OBL' | 'PBL';
    caseName: string;
    status: CaseStatus;
    isGoodAlg?: boolean;
    isBadAlg?: boolean;
    evilness?: EvilnessType;
}

export interface DailyLog {
    dateStr: string; // YYYY-MM-DD
    exercise: ExerciseType;
    mentalEnergy: number;
    notes: string;
    labCases: Array<{
        category: 'OBL' | 'CSP' | 'PBL',
        caseName: string,
        state: CaseStatus,
        notes: string
    }>;
}

export class Sq1Database extends Dexie {
    solves!: Table<Solve & { id?: number }, number>;
    logs!: Table<DailyLog, string>;
    cases!: Table<CaseRecord, string>;

    constructor() {
        super('Sq1TrackerDB');
        this.version(7).stores({
            solves: '++id, dateStr, block, oblCase, time, [dateStr+scramble]',
            logs: 'dateStr',
            cases: 'id, category, status'
        });
    }
}

export const db = new Sq1Database();