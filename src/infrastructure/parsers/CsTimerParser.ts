import Papa from "papaparse";
import type { Solve } from "../../domain/entities/Solve";

export const parseCsTimerExport = (
  csvString: string,
  blockType: "Sprint" | "Resistencia",
): Solve[] => {
  const results = Papa.parse(csvString, {
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

    // Fix 0.00s bug: limpia cualquier caracter que no sea n�mero o punto antes de hacer parseFloat
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
