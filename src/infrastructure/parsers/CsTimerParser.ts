import Papa from 'papaparse';
import type { Solve } from '../../domain/entities/Solve';

export const parseCsTimerExport = (csvString: string, blockType: 'Sprint' | 'Resistencia'): Solve[] => {
    const { data } = Papa.parse(csvString, { header: true, skipEmptyLines: true, delimiter: ';' });

    return data.map((row: Record<string, string>) => {
        const comment = row.Comment || '';
        const upperComment = comment.toUpperCase();

        // Extracción regex mejorada
        const oblMatch = comment.match(/OBL\s+([^;,]+)/i);
        const dateObj = new Date(row.Date);
        const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD

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