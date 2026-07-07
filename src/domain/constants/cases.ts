// --- OBL CASES (3-Look) ---
export const OBL_BY_SLICES = [
    { category: "Base / Fast Cases", cases: ["line/line", "4e/4e", "L/L", "3e/3e", "L/line", "1e/1e"] },
    { category: "1 Slicer", cases: ["good kite/kite"] },
    { category: "2 Slicers", cases: ["copp/copp", "good pair/pair", "good thumb/thumb", "good N/N"] },
    { category: "3 Slicers", cases: ["good arrow/pair", "good arrow/arrow", "bad arrow/arrow", "gem/axe", "good knight/axe", "good bunny/bunny", "yoshi/shell", "good yoshi/bird", "good kite/cut", "good kite/N", "good T/T", "good cut/cut", "good tie/tie", "bad tie/tie", "good T/tie"] },
    { category: "4 Slicers", cases: ["cadj/cadj", "bad pair/pair", "bad arrow/pair", "gem/gem", "gem/knight", "gem/squid", "good knight/knight", "bad knight/knight", "squid/knight", "squid/axe", "good thumb/bunny", "bad thumb/bunny", "shell/shell", "shell/bird", "shell/hazard", "good bird/bird", "bad bird/bird", "bird/hazard", "yoshi/hazard", "kite/T", "bad kite/N", "kite/tie", "cut/T", "good cut/N", "bad cut/N", "cut/tie", "bad knight/axe", "bad T/tie", "bad T/T"] },
    { category: "5 Slicers", cases: ["1c/1c", "3c/3c", "cadj/copp", "squid/squid", "hazard/hazard", "bad thumb/thumb", "bad kite/kite", "T/N", "tie/N", "bad yoshi/bird", "same yoshi/yoshi", "diff yoshi/yoshi", "same axe/axe", "diff axe/axe", "bad bunny/bunny", "bad N/N"] },
    { category: "6 Slicers", cases: ["bad kite/cut", "bad cut/cut"] }
];

export const OBL_BASE_CASES = OBL_BY_SLICES.flatMap(g => g.cases);

// --- CO & EO CASES (5-Look) ---
export const OBL_CO_CASES = ["1c/1c", "C-opp/C-opp", "C-adj/C-adj", "C-opp/C-adj", "C-adj/C-opp", "3c/3c", "4c/4c"];
export const OBL_EO_CASES = ["1e/1e", "E-opp/E-opp", "E-adj/E-adj", "E-adj/E-opp", "E-opp/E-adj", "3e/3e", "4e/4e"];

export const ALL_OBL_CASES = Array.from(new Set([...OBL_BASE_CASES, ...OBL_CO_CASES, ...OBL_EO_CASES]));


// --- CSP CASES ---
export const CSP_CASES = [
    { name: "Left 4-2 / Paired Edges", prob: 2.61 }, { name: "Right 4-2 / Paired Edges", prob: 2.61 }, { name: "4-1-1 / Paired Edges", prob: 2.61 },
    { name: "6 / Paired Edges", prob: 1.96 }, { name: "3-3 / Paired Edges", prob: 1.96 }, { name: "Left 5-1 / Paired Edges", prob: 1.96 },
    { name: "Right 5-1 / Paired Edges", prob: 1.96 }, { name: "3-1-2 / Paired Edges", prob: 1.96 }, { name: "3-2-1 / Paired Edges", prob: 1.96 },
    { name: "Scallop / Left Fist", prob: 1.96 }, { name: "Scallop / Right Fist", prob: 1.96 }, { name: "Scallop / Shield", prob: 1.96 },
    { name: "Shield / Left Fist", prob: 1.96 }, { name: "Shield / Right Fist", prob: 1.96 }, { name: "Left Fist / Right Fist", prob: 1.96 },
    { name: "Left 4-2 / Perpendicular Edges", prob: 1.74 }, { name: "Right 4-2 / Perpendicular Edges", prob: 1.74 }, { name: "4-1-1 / Perpendicular Edges", prob: 1.74 },
    { name: "6 / Perpendicular Edges", prob: 1.31 }, { name: "3-3 / Perpendicular Edges", prob: 1.31 }, { name: "Left 5-1 / Perpendicular Edges", prob: 1.31 },
    { name: "Right 5-1 / Perpendicular Edges", prob: 1.31 }, { name: "3-1-2 / Perpendicular Edges", prob: 1.31 }, { name: "3-2-1 / Perpendicular Edges", prob: 1.31 },
    { name: "Scallop / Barrel", prob: 1.31 }, { name: "Scallop / Kite", prob: 1.31 }, { name: "Scallop / Right Pawn", prob: 1.31 },
    { name: "Scallop / Left Pawn", prob: 1.31 }, { name: "Scallop / Muffin", prob: 1.31 }, { name: "Muffin / Right Fist", prob: 1.31 },
    { name: "Muffin / Left Fist", prob: 1.31 }, { name: "Shield / Muffin", prob: 1.31 }, { name: "Shield / Barrel", prob: 1.31 },
    { name: "Shield / Kite", prob: 1.31 }, { name: "Kite / Right Fist", prob: 1.31 }, { name: "Kite / Left Fist", prob: 1.31 },
    { name: "Barrel / Right Fist", prob: 1.31 }, { name: "Barrel / Left Fist", prob: 1.31 }, { name: "Right Pawn / Shield", prob: 1.31 },
    { name: "Right Pawn / Right Fist", prob: 1.31 }, { name: "Right Pawn / Left Fist", prob: 1.31 }, { name: "Left Pawn / Shield", prob: 1.31 },
    { name: "Left Pawn / Right Fist", prob: 1.31 }, { name: "Left Pawn / Left Fist", prob: 1.31 }, { name: "Right Fist / Right Fist", prob: 0.98 },
    { name: "Left Fist / Left Fist", prob: 0.98 }, { name: "Scallop / Scallop", prob: 0.98 }, { name: "Shield / Shield", prob: 0.98 },
    { name: "Muffin / Kite", prob: 0.87 }, { name: "Muffin / Barrel", prob: 0.87 }, { name: "Kite / Barrel", prob: 0.87 },
    { name: "Left Pawn / Kite", prob: 0.87 }, { name: "Left Pawn / Muffin", prob: 0.87 }, { name: "Left Pawn / Barrel", prob: 0.87 },
    { name: "Left Pawn / Right Pawn", prob: 0.87 }, { name: "Right Pawn / Kite", prob: 0.87 }, { name: "Right Pawn / Muffin", prob: 0.87 },
    { name: "Right Pawn / Barrel", prob: 0.87 }, { name: "4-1-1 / Parallel Edges", prob: 0.87 }, { name: "Left 4-2 / Parallel Edges", prob: 0.87 },
    { name: "Right 4-2 / Parallel Edges", prob: 0.87 }, { name: "6 / Parallel Edges", prob: 0.65 }, { name: "Left 5-1 / Parallel Edges", prob: 0.65 },
    { name: "Right 5-1 / Parallel Edges", prob: 0.65 }, { name: "3-3 / Parallel Edges", prob: 0.65 }, { name: "3-2-1 / Parallel Edges", prob: 0.65 },
    { name: "3-1-2 / Parallel Edges", prob: 0.65 }, { name: "2-2-2 / Paired Edges", prob: 0.65 }, { name: "Shield / Square", prob: 0.65 },
    { name: "Scallop / Square", prob: 0.65 }, { name: "Left Fist / Square", prob: 0.65 }, { name: "Right Fist / Square", prob: 0.65 },
    { name: "Barrel / Square", prob: 0.44 }, { name: "Muffin / Square", prob: 0.44 }, { name: "Right Pawn / Square", prob: 0.44 },
    { name: "Left Pawn / Square", prob: 0.44 }, { name: "Kite / Square", prob: 0.44 }, { name: "Kite / Kite", prob: 0.44 },
    { name: "Muffin / Muffin", prob: 0.44 }, { name: "Barrel / Barrel", prob: 0.44 }, { name: "2-2-2 / Perpendicular Edges", prob: 0.44 },
    { name: "Right Pawn / Right Pawn", prob: 0.44 }, { name: "Left Pawn / Left Pawn", prob: 0.44 }, { name: "8-0 / Star", prob: 0.44 },
    { name: "6-2 / Star", prob: 0.44 }, { name: "5-3 / Star", prob: 0.44 }, { name: "7-1 / Star", prob: 0.44 },
    { name: "4-4 / Star", prob: 0.27 }, { name: "2-2-2 / Parallel Edges", prob: 0.22 }, { name: "Square / Square", prob: 0.11 }
];


// --- PBL CASES (3-Look) ---
// Separamos los 44 PLLs en Pares (Even) e Impares (Odd)
const EVEN_PLLS = ['Al', 'Ar', 'E', 'F', 'Gal', 'Gar', 'Gol', 'Gor', 'H', 'Ja', 'Jm', 'Na', 'Nm', 'Rr', 'Rl', 'T', 'Ur', 'Ul', 'V', 'Y', 'Z', '-'];
const ODD_PLLS = ['adj', 'Ba', 'Bm', 'Cr', 'Cl', 'Da', 'Dm', 'Ka', 'Km', 'M', 'Or', 'Ol', 'opp', 'Pr', 'Pl', 'pJ', 'pN', 'Q', 'Sa', 'Sm', 'W', 'X'];

// NP PBL = (Even Top x Even Bottom) + (Odd Top x Odd Bottom) -> 968 Casos
export const NP_PBL_CASES = [
    ...EVEN_PLLS.map(top => ({ category: `[NP] ${top} Top`, cases: EVEN_PLLS.map(bot => `${top}/${bot}`) })),
    ...ODD_PLLS.map(top => ({ category: `[NP] ${top} Top`, cases: ODD_PLLS.map(bot => `${top}/${bot}`) }))
];

// DP PBL = (Even Top x Odd Bottom) + (Odd Top x Even Bottom) -> 968 Casos
export const DP_PBL_CASES = [
    ...EVEN_PLLS.map(top => ({ category: `[DP] ${top} Top`, cases: ODD_PLLS.map(bot => `${top}/${bot}`) })),
    ...ODD_PLLS.map(top => ({ category: `[DP] ${top} Top`, cases: EVEN_PLLS.map(bot => `${top}/${bot}`) }))
];

export const NP_PBL_BASE_CASES = NP_PBL_CASES.flatMap(g => g.cases);
export const DP_PBL_BASE_CASES = DP_PBL_CASES.flatMap(g => g.cases);


// --- CP & EP CASES (5-Look) ---
export const PBL_CP_CASES = ["J/-", "-/J", "J/J", "J/N", "N/J", "N/-", "-/N", "N/N"];

export const PBL_EP_CASES = [
    "H/-", "H/H", "H/Ul", "H/Ur", "H/Z", "Z/-", "Z/H", "Z/Ul", "Z/Ur", "Z/Z",
    "Ul/-", "Ur/-", "Ul/H", "Ur/H", "Ul/Ul", "Ul/Ur", "Ur/Ul", "Ur/Ur", "Ul/Z", "Ur/Z",
    "-/H", "-/Ul", "-/Ur", "-/Z", "W/adj", "W/Ol", "W/Or", "W/opp", "W/W",
    "Ol/adj", "Or/adj", "Ol/Ol", "Ol/Or", "Or/Ol", "Or/Or", "Ol/opp", "Or/opp", "Ol/W", "Or/W",
    "adj/adj", "adj/Ol", "adj/Or", "adj/opp", "adj/W", "opp/adj", "opp/Ol", "opp/Or", "opp/opp", "opp/W"
];

// Se unifican evitando duplicados estrictos. Como no hay prefijos, EP y CP que coincidan con NP se absorberán solos en el Set.
export const ALL_PBL_CASES = Array.from(new Set([
    ...NP_PBL_BASE_CASES,
    ...DP_PBL_BASE_CASES,
    ...PBL_CP_CASES,
    ...PBL_EP_CASES
]));