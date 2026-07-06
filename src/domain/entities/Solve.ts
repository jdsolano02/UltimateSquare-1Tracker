export interface Solve {
    id?: number;
    date: Date;
    dateStr: string; // Para buscar por día rápidamente (YYYY-MM-DD)
    time: number;
    scramble: string;
    comment: string;
    block: 'Sprint' | 'Resistencia';
    oblCase?: string;
    isCsp: boolean;
    isObl: boolean;
    isDnf: boolean;
    isPlusTwo: boolean;
}