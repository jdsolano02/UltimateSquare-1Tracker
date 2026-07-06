import Dexie, { type Table } from 'dexie';
import type { Solve } from '../../domain/entities/Solve';

// Nueva Entidad para el Tracker Diario
export interface DailyLog {
    dateStr: string; // YYYY-MM-DD
    sleepHours: number;
    sleepQuality: number;
    mentalEnergy: number;
    physicalFatigue: number; // Fatiga de triatlón (Natación/Ciclismo/Carrera)
    caffeineLevel: string;
    coldHands: boolean;
    labCases: Array<{ category: 'OBL' | 'CSP' | 'EP', caseName: string, state: string, notes: string }>;
}

export class Sq1Database extends Dexie {
    solves!: Table<Solve, string>;
    logs!: Table<DailyLog, string>; // Nueva tabla

    constructor() {
        super('Sq1TrackerDB');
        // Incrementamos la versión a 2 para que Dexie cree la nueva tabla automáticamente
        this.version(2).stores({
            solves: '++id, date, block, oblCase, time, dateStr',
            logs: 'dateStr'
        });
    }
}

export const db = new Sq1Database();