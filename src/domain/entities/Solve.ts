export interface Solve {
    id?: number;
    date: Date;
    dateStr: string; // YYYY-MM-DD
    time: number; // in seconds, 0 for DNF
    scramble: string;
    comment: string;
    block: 'Speedsolving' | 'Case recognition';
    oblCase?: string;
    isCsp: boolean;
    isObl: boolean;
    isDnf: boolean;
    isPlusTwo: boolean;
}