// --- OBL CASES ---

export const OBL_BY_PRIORITY = [
    { priority: 0, title: "Priority 0: Base & Fundamental", cases: ["copp/copp", "line/line", "cadj/cadj", "4e/4e", "L/L", "1c/1c", "cadj/copp", "3c/3c", "3e/3e", "L/line", "1e/1e"] },
    { priority: 1, title: "Priority 1: Pair Closing", cases: ["good arrow/arrow", "bad arrow/arrow", "good arrow/pair", "bad arrow/pair", "good kite/cut", "bad kite/cut", "good kite/N", "bad kite/N", "good thumb/thumb", "bad thumb/thumb", "good cut/cut", "bad cut/cut", "good knight/axe", "bad knight/axe"] },
    { priority: 2, title: "Priority 2: Mastered Pairs", cases: ["good kite/kite", "bad kite/kite", "good pair/pair", "bad pair/pair", "good N/N", "bad N/N"] },
    { priority: 3, title: "Priority 3: New Direct Pairs", cases: ["good bird/bird", "bad bird/bird", "good thumb/bunny", "bad thumb/bunny", "good yoshi/bird", "bad yoshi/bird", "good T/T", "bad T/T", "good tie/tie", "bad tie/tie", "good cut/N", "bad cut/N", "good T/tie", "bad T/tie", "same yoshi/yoshi", "diff yoshi/yoshi", "good bunny/bunny", "bad bunny/bunny", "same axe/axe", "diff axe/axe", "good knight/knight", "bad knight/knight"] },
    { priority: 4, title: "Priority 4: Mixed & Complex", cases: ["gem/axe", "squid/axe", "kite/T", "kite/tie", "cut/T", "cut/tie", "T/N", "tie/N", "hazard/hazard", "yoshi/hazard", "shell/shell", "yoshi/shell", "shell/bird", "bird/hazard", "shell/hazard", "squid/squid", "squid/knight", "gem/squid", "gem/knight", "gem/gem"] }
];

export const OBL_BY_SLICES = [
    {
        category: "1 Slicer",
        cases: ["Good Kites"]
    },
    {
        category: "2 Slicers",
        cases: ["Copps", "Good pairs", "Good thumbs/thumb", "Good Ns", "Bad Ns"]
    },
    {
        category: "3 Slicers",
        cases: ["Good pair/arrow", "Good arrows", "Bad arrows", "Gem/axe", "Good Knight/axe", "Bad knight/axe", "Good bunnies", "Yoshi/shell", "Good Yoshi/Bird", "Bad bird/yoshi", "Good kite/cut", "Good kite/N", "Good Ts", "Bad Ts", "Good T/Tie", "Bad T/Tie", "Good cuts", "Good Ties", "Bad ties"]
    },
    {
        category: "4 Slicers",
        cases: ["cadjs", "Bad pairs", "Bad pair/arrow", "Gems", "Gem/Knight", "Gem/Squid", "LR and RL Knights", "RR and LL Knights", "Knight/Squid", "Axe/Squid", "Good thumb/bunny", "Bad thumb/bunny", "Shell/Shell", "Shell/Bird", "Shell/Hazard", "Good birds", "Bad birds", "Bird/Hazard", "Hazard/yoshi", "Kite/T", "Bad Kite/N", "Bad bird/yoshi", "Kite/Tie", "Cut/T", "Good Cut/N", "Bad Cut/N", "Bad Ns", "Bad knight/axe", "Cut/tie", "Bad tie/tie", "Bad T/Tie", "Bad Ts", "LR and RL arrows"]
    },
    {
        category: "5 Slicers",
        cases: ["1c/1c", "3c/3c", "copp/cadj", "cadj/copp", "Squid/squid", "Hazards", "Bad thumbs LR and RL", "Bad birds", "Bad kites", "N/T", "N/Tie", "Bad N/Cut", "Yoshi/Yoshis", "RR and LL Axe", "RL and LR Axe", "RR and LL Knight", "Bad bunnies"]
    },
    {
        category: "6 Slicers",
        cases: ["Bad Kite/cut", "Bad cuts"]
    }
];

// --- EP CASES ---

export const EP_CASES = [
    { category: "Base Cases", cases: ["Adj/Adj", "Opp/Opp", "Ul/Ur (good UU)", "Ur/Ul (good UU)", "Ul/Ul (bad UU)", "Ur/Ur (bad UU)"] },
    { category: "Using Adj/Adj", cases: ["Z/Z", "Ur/-", "Ul/-", "-/Ur", "-/Ul", "U/Z", "Z/U"] },
    { category: "Using M2s", cases: ["Z/-", "-/Z", "O/Opp", "Opp/O", "O/O", "Z/H", "H/Z", "H/-", "-/H"] },
    { category: "Using 2 CP Algs", cases: ["U/H", "H/U", "H/H"] },
    { category: "Using Good UU", cases: ["Adj/O", "O/Adj", "W/O", "O/W", "W/Opp", "Opp/W", "W/Adj", "Adj/W", "W/W"] },
    { category: "Other", cases: ["Adj/Opp", "Opp/Adj"] }
];

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