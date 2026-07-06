import Dexie, { type Table } from 'dexie';
import type { Solve } from '../../domain/entities/Solve';

export type CaseStatus = 'Learning' | 'Drill' | 'Mastered';
export type ExerciseType = 'Lifting' | 'Cardio' | 'Other' | 'None';

export interface CaseRecord {
    id: string; // e.g., 'OBL-copp/copp'
    category: 'OBL' | 'CSP' | 'EP';
    caseName: string;
    status: CaseStatus;
    isGoodAlg?: boolean; // For CSP
}

export interface DailyLog {
    dateStr: string; // YYYY-MM-DD
    exercise: ExerciseType;
    mentalEnergy: number;
    notes: string;
}

export class Sq1Database extends Dexie {
    solves!: Table<Solve & { id?: number }, number>;
    logs!: Table<DailyLog, string>;
    cases!: Table<CaseRecord, string>;

    constructor() {
        super('Sq1TrackerDB');
        // Version 5 implements the new Case management and unique constraints
        this.version(5).stores({
            solves: '++id, dateStr, block, oblCase, time, [dateStr+scramble]',
            logs: 'dateStr',
            cases: 'id, category, status'
        });
    }
}

export const db = new Sq1Database();