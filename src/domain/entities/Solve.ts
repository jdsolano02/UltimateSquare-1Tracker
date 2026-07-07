export interface Solve {
    id?: number;
    time: string;
    scramble: string;
    date: string;
    dateStr: string;
    comment?: string;
    penalty?: string;
    block: string;
    isCsp: boolean;
    isObl: boolean;
    oblCase?: string;
}