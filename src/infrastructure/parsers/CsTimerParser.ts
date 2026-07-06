import Papa from 'papaparse';
import type { Solve } from '../../domain/entities/Solve';

export const parseCsTimerExport = (csvString: string, blockType: 'Sprint' | 'Resistencia'): Solve[] => {
    const results = Papa.parse(csvString, { header: true, skipEmptyLines: true, delimiter: ';' });
    const data = results.data as Record<string, string>[];
    return data.map((row) => {
        const comment = row.Comment || '';
        const upperComment = comment.toUpperCase();
        const oblMatch = comment.match(/OBL\s+([^;,]+)/i);
        const dateObj = new Date(row.Date);
        const dateStr = dateObj.toISOString().split('T')[0];
        return {
            date: dateObj,
            dateStr: dateStr,
            time: parseFloat(row['Time']),
            scramble: row.Scramble,
            comment: comment,
            block: blockType,
            oblCase: oblMatch ? oblMatch[1].trim() : undefined,
            isCsp: upperComment.includes('CSP'),
            isObl: upperComment.includes('OBL'),
            isDnf: row['Time'].includes('DNF'),
            isPlusTwo: row['Time'].includes('+')
        };
    });
};