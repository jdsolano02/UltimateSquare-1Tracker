import Papa from "papaparse";
import type { Solve } from "../../domain/entities/Solve";

export const parseCsTimerExport = (
    csvString: string,
    blockType: "Speedsolving" | "Case recognition",
): Solve[] => {
    let dataString = csvString.trim();

    // FIX CRÍTICO: Si el texto empieza con un número y punto y coma (ej. "2396;13.42"), 
    // significa que falta la cabecera oficial. Se la inyectamos para que PapaParse funcione.
    if (/^\d+;/.test(dataString)) {
        dataString = "No.;Time;Comment;Scramble;Date\n" + dataString;
    }

    const results = Papa.parse(dataString, {
        header: true,
        skipEmptyLines: true,
        delimiter: ";",
    });
    const data = results.data as Record<string, string>[];

    return data.map((row) => {
        const comment = row.Comment || "";
        const upperComment = comment.toUpperCase();
        const oblMatch = comment.match(/OBL\s+([^;,]+)/i);

        const dateObj = row.Date ? new Date(row.Date) : new Date();
        const dateStr = dateObj.toISOString().split("T")[0];

        const rawTime = row["Time"] || "0";
        const isDnf = rawTime.includes("DNF");
        const isPlusTwo = rawTime.includes("+");

        const cleanTimeStr = rawTime.replace(/[^\d.]/g, "");
        const parsedTime = parseFloat(cleanTimeStr);
        const timeValue = isNaN(parsedTime) ? 0 : parsedTime;

        return {
            date: dateObj,
            dateStr: dateStr,
            time: timeValue,
            scramble: row.Scramble || "",
            comment: comment,
            block: blockType,
            oblCase: oblMatch ? oblMatch[1].trim() : undefined,
            isCsp: upperComment.includes("CSP"),
            isObl: upperComment.includes("OBL"),
            isDnf: isDnf,
            isPlusTwo: isPlusTwo,
        };
    });
};