import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../infrastructure/database/db';

export const useSessionMetrics = (blockType: string, dateStr?: string) => {
    return useLiveQuery(async () => {
        try {
            const allSolves = await db.solves.toArray();

            // Ordenamiento seguro en memoria (inmune a errores de índices en DB)
            allSolves.sort((a, b) => {
                const dateA = a.date ? new Date(a.date).getTime() : 0;
                const dateB = b.date ? new Date(b.date).getTime() : 0;
                return dateA - dateB;
            });

            let filtered = allSolves;
            if (blockType === 'Diario' && dateStr) {
                filtered = allSolves.filter(s => s.dateStr === dateStr);
            } else if (blockType !== 'Global') {
                filtered = allSolves.filter(s => s.block === blockType);
            }

            return filtered;
        } catch (error) {
            console.error("Database reading error:", error);
            return [];
        }
    }, [blockType, dateStr]) || [];
};