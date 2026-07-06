import Dexie, { type Table } from 'dexie';
import type { Solve } from '../../domain/entities/Solve';

export interface DailyLog {
    dateStr: string;
    sleepHours: number;
    sleepQuality: number;
    mentalEnergy: number;
    physicalFatigue: number;
    caffeineLevel: string;
    coldHands: boolean;
    labCases: Array<{ category: 'OBL' | 'CSP' | 'EP', caseName: string, state: string, notes: string }>;
}

export class Sq1Database extends Dexie {
    solves!: Table<Solve, string>;
    logs!: Table<DailyLog, string>;
    constructor() {
        super('Sq1TrackerDB');
        this.version(2).stores({
            solves: '++id, date, block, oblCase, time, dateStr',
            logs: 'dateStr'
        });
    }
}
export const db = new Sq1Database();