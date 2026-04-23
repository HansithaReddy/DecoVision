/**
 * lib/design-scorer.ts
 * Feasibility & Sustainability scoring engine for DecoVision.
 * Rule-based weighted system that simulates a trained ML model.
 */

import type { RoomType, DesignTheme } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DesignScoreInput {
  roomWidth: number;       // metres
  roomLength: number;      // metres
  theme: DesignTheme;
  room: RoomType;
  furniture: string[];     // e.g. ["sofa", "coffee table"]
  lightingType: string;    // e.g. "natural", "led"
  prompt: string;          // free-text description
}

export interface DesignScoreResult {
  feasibility: number;       // 0–100
  sustainability: number;    // 0–100
  explanation: string;
  feasibilityBreakdown: ScoreBreakdown[];
  sustainabilityBreakdown: ScoreBreakdown[];
}

export interface ScoreBreakdown {
  label: string;
  score: number;   // 0–100 for this factor
  weight: number;  // 0–1
  note: string;
}

// ---------------------------------------------------------------------------
// Lookup tables
// ---------------------------------------------------------------------------

const FURNITURE_FOOTPRINT: Record<string, number> = {
  "sofa": 2.0, "sectional sofa": 4.0, "loveseat": 1.5, "armchair": 0.7,
  "coffee table": 0.6, "side table": 0.2, "dining table": 2.0,
  "dining chair": 0.3, "desk": 1.2, "office chair": 0.4,
  "bed": 3.5, "king bed": 4.5, "queen bed": 3.5, "single bed": 2.0,
  "wardrobe": 1.2, "dresser": 0.8, "bookshelf": 0.6, "tv unit": 0.8,
  "tv stand": 0.6, "cabinet": 0.6, "shelf": 0.3, "plant": 0.2,
  "rug": 0.0, "lamp": 0.1, "floor lamp": 0.1, "bench": 0.6,
  "ottoman": 0.5, "nightstand": 0.2, "vanity": 0.8,
};

const STYLE_DENSITY_TOLERANCE: Record<string, number> = {
  "minimalist": 0.25, "scandinavian": 0.30, "modern": 0.35,
  "contemporary": 0.35, "industrial": 0.38, "mid-century modern": 0.38,
  "coastal": 0.35, "bohemian": 0.45, "traditional": 0.45,
  "luxury": 0.40, "vintage": 0.42,
};

const MATERIAL_SCORES: Record<string, number> = {
  "wood": 0.80, "solid wood": 0.85, "reclaimed wood": 0.95,
  "bamboo": 0.95, "rattan": 0.90, "cork": 0.90, "linen": 0.80,
  "cotton": 0.75, "wool": 0.78, "leather": 0.50, "faux leather": 0.40,
  "fabric": 0.65, "glass": 0.60, "metal": 0.55, "steel": 0.50,
  "aluminum": 0.60, "concrete": 0.45, "marble": 0.40, "stone": 0.55,
  "ceramic": 0.60, "plastic": 0.20, "pvc": 0.15, "vinyl": 0.18,
  "synthetic": 0.20, "polyester": 0.22, "foam": 0.25,
};

const ECO_KEYWORDS: Record<string, number> = {
  "sustainable": 8, "eco": 7, "eco-friendly": 8, "green": 5,
  "natural": 5, "organic": 6, "recycled": 7, "upcycled": 7,
  "reclaimed": 6, "biophilic": 6, "plants": 4, "plant": 3,
  "low-energy": 5, "energy-saving": 5, "solar": 8, "zero-waste": 8,
  "non-toxic": 5, "local": 4, "handmade": 3, "minimal": 3,
};

const ANTI_ECO_KEYWORDS: Record<string, number> = {
  "plastic": -5, "synthetic": -4, "artificial": -3,
  "pvc": -5, "vinyl": -4, "neon": -3,
};

const LIGHTING_SCORES: Record<string, number> = {
  "natural": 100, "natural light": 100, "skylight": 95, "led": 85,
  "smart lighting": 82, "dimmer": 78, "ambient": 70, "fluorescent": 55,
  "halogen": 40, "incandescent": 30, "artificial": 50, "mixed": 72,
};

const STYLE_SUSTAINABILITY: Record<string, number> = {
  "minimalist": 85, "scandinavian": 80, "bohemian": 70, "modern": 65,
  "coastal": 72, "industrial": 58, "luxury": 50, "traditional": 62,
  "mid-century modern": 68, "contemporary": 65, "vintage": 72,
};

const FEASIBILITY_POSITIVE: Record<string, number> = {
  "open plan": 6, "spacious": 5, "minimalist": 4, "open": 3,
  "airy": 4, "flow": 3, "ergonomic": 5, "functional": 4, "storage": 3,
};

const FEASIBILITY_NEGATIVE: Record<string, number> = {
  "overcrowded": -8, "cramped": -7, "cluttered": -6,
  "too many": -5, "no space": -7, "tight": -5, "small room": -4,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

function normalize(value: number, lo: number, hi: number) {
  if (hi === lo) return 0.5;
  return clamp((value - lo) / (hi - lo), 0, 1);
}

function fuzzyLookup<T>(key: string, table: Record<string, T>, def: T): T {
  const k = key.toLowerCase().trim();
  if (k in table) return table[k];
  for (const [tk, tv] of Object.entries(table)) {
    if (tk.includes(k) || k.includes(tk)) return tv;
  }
  return def;
}

function scanPrompt(prompt: string, table: Record<string, number>): number {
  const text = prompt.toLowerCase();
  return Object.entries(table).reduce(
    (sum, [kw, score]) => (text.includes(kw) ? sum + score : sum),
    0
  );
}

function estimateFootprint(furniture: string[]): number {
  return furniture.reduce(
    (sum, item) => sum + fuzzyLookup(item.toLowerCase(), FURNITURE_FOOTPRINT, 0.5),
    0
  );
}

function getMaterialScore(furniture: string[], prompt: string): number {
  const text = [...furniture, prompt].join(" ").toLowerCase();
  const found = Object.entries(MATERIAL_SCORES).filter(([m]) => text.includes(m));
  if (!found.length) return 55; // neutral default
  return (found.reduce((s, [, v]) => s + v, 0) / found.length) * 100;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------------
// Core scoring
// ---------------------------------------------------------------------------

function computeFeasibility(
  input: DesignScoreInput,
  seed: number
): { score: number; breakdown: ScoreBreakdown[] } {
  const { roomWidth, roomLength, theme, furniture, prompt } = input;
  const area = roomWidth * roomLength;
  const footprint = estimateFootprint(furniture);
  const tolerance = fuzzyLookup(theme.toLowerCase(), STYLE_DENSITY_TOLERANCE, 0.35);
  const breakdown: ScoreBreakdown[] = [];

  // Factor 1: Density (35%)
  const densityRatio = footprint / Math.max(area, 0.01);
  const densityScore = normalize(densityRatio, tolerance * 2, 0) * 100;
  breakdown.push({
    label: "Furniture Density",
    score: clamp(densityScore),
    weight: 0.35,
    note: densityRatio <= tolerance * 0.5
      ? "Well within room capacity"
      : densityRatio <= tolerance
        ? "Appropriate for room size"
        : "May feel slightly crowded",
  });

  // Factor 2: Walkable clearance (30%)
  const walkable = area - footprint;
  const clearanceScore = normalize(walkable, area * 0.10, area * 0.70) * 100;
  breakdown.push({
    label: "Walking Clearance",
    score: clamp(clearanceScore),
    weight: 0.30,
    note: walkable >= area * 0.50
      ? "Generous open walkways"
      : walkable >= area * 0.20
        ? "Adequate clearance maintained"
        : "Tight clearance — ergonomics may suffer",
  });

  // Factor 3: Room proportions (15%)
  const aspect = Math.max(roomWidth, roomLength) / Math.max(Math.min(roomWidth, roomLength), 0.01);
  const proportionScore = normalize(aspect, 3.5, 1.0) * 100;
  breakdown.push({
    label: "Room Proportions",
    score: clamp(proportionScore),
    weight: 0.15,
    note: aspect <= 1.5 ? "Well-proportioned room" : aspect <= 2.5 ? "Slightly elongated" : "Narrow layout — consider zoning",
  });

  // Factor 4: Item count (10%)
  const idealCount = area / 2.5;
  const countScore = normalize(Math.abs(furniture.length - idealCount), idealCount * 1.5, 0) * 100;
  breakdown.push({
    label: "Item Count",
    score: clamp(countScore),
    weight: 0.10,
    note: `${furniture.length} items for ${area.toFixed(1)} m² (ideal ~${Math.round(idealCount)})`,
  });

  // Factor 5: Prompt context (10%)
  const boost = scanPrompt(prompt, FEASIBILITY_POSITIVE);
  const penalty = scanPrompt(prompt, FEASIBILITY_NEGATIVE);
  const promptScore = clamp(50 + boost + penalty);
  breakdown.push({
    label: "Design Intent",
    score: promptScore,
    weight: 0.10,
    note: boost > 5 ? "Prompt indicates open, functional layout" : penalty < -3 ? "Prompt suggests spatial constraints" : "Neutral design intent",
  });

  const raw = breakdown.reduce((sum, f) => sum + f.score * f.weight, 0);
  const noise = (seededRandom(seed) - 0.5) * 6; // ±3
  return { score: clamp(raw + noise), breakdown };
}

function computeSustainability(
  input: DesignScoreInput,
  seed: number
): { score: number; breakdown: ScoreBreakdown[] } {
  const { theme, furniture, lightingType, prompt } = input;
  const breakdown: ScoreBreakdown[] = [];

  // Factor 1: Lighting (30%)
  const lightScore = fuzzyLookup(lightingType.toLowerCase(), LIGHTING_SCORES, 60);
  breakdown.push({
    label: "Lighting Efficiency",
    score: lightScore,
    weight: 0.30,
    note: lightScore >= 85
      ? "Natural or LED lighting — excellent efficiency"
      : lightScore >= 60
        ? "Moderate lighting efficiency"
        : "Consider switching to natural light or LEDs",
  });

  // Factor 2: Materials (35%)
  const matScore = getMaterialScore(furniture, prompt);
  breakdown.push({
    label: "Material Sustainability",
    score: clamp(matScore),
    weight: 0.35,
    note: matScore >= 75
      ? "High proportion of eco-friendly materials"
      : matScore >= 50
        ? "Moderate sustainable material use"
        : "Higher-footprint materials detected",
  });

  // Factor 3: Eco prompt keywords (25%)
  const ecoBoost = scanPrompt(prompt, ECO_KEYWORDS);
  const ecoPenalty = scanPrompt(prompt, ANTI_ECO_KEYWORDS);
  const ecoScore = clamp(50 + ecoBoost * 1.2 + ecoPenalty * 1.2);
  breakdown.push({
    label: "Eco Design Intent",
    score: ecoScore,
    weight: 0.25,
    note: ecoBoost > 10
      ? "Strong eco-conscious design language"
      : ecoBoost > 0
        ? "Some sustainability keywords detected"
        : "No explicit eco keywords in prompt",
  });

  // Factor 4: Style inherent (10%)
  const styleScore = fuzzyLookup(theme.toLowerCase(), STYLE_SUSTAINABILITY, 65);
  breakdown.push({
    label: "Style Alignment",
    score: styleScore,
    weight: 0.10,
    note: styleScore >= 75
      ? `${theme} style naturally aligns with sustainability`
      : `${theme} style has moderate sustainability profile`,
  });

  const raw = breakdown.reduce((sum, f) => sum + f.score * f.weight, 0);
  const noise = (seededRandom(seed + 99) - 0.5) * 6;
  return { score: clamp(raw + noise), breakdown };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function predictDesignScores(input: DesignScoreInput): DesignScoreResult {
  // Use room area as a stable seed for consistent results per session
  const seed = input.roomWidth * 100 + input.roomLength * 10 + input.furniture.length;

  const { score: fScore, breakdown: fBreakdown } = computeFeasibility(input, seed);
  const { score: sScore, breakdown: sBreakdown } = computeSustainability(input, seed);

  const feasibility = Math.round(fScore);
  const sustainability = Math.round(sScore);

  const fLabel = feasibility >= 75 ? "high" : feasibility >= 50 ? "moderate" : "low";
  const sLabel = sustainability >= 75 ? "high" : sustainability >= 50 ? "moderate" : "low";

  const topF = fBreakdown.reduce((a, b) => (a.score * a.weight > b.score * b.weight ? a : b));
  const topS = sBreakdown.reduce((a, b) => (a.score * a.weight > b.score * b.weight ? a : b));

  const area = input.roomWidth * input.roomLength;
  let explanation =
    `Feasibility is ${fLabel} (${feasibility}/100): ` +
    `For a ${input.roomWidth}m × ${input.roomLength}m ${input.room} (${area.toFixed(1)} m²) ` +
    `in ${input.theme} style, ${topF.note.toLowerCase()}. ` +
    `Sustainability is ${sLabel} (${sustainability}/100): ${topS.note}.`;

  if (feasibility < 40)
    explanation += " Consider reducing furniture or choosing a more open layout.";
  if (sustainability < 40)
    explanation += " Switching to natural materials or LED lighting would improve sustainability.";
  if (feasibility >= 85 && sustainability >= 85)
    explanation += " Excellent balance of practicality and eco-consciousness!";

  return { feasibility, sustainability, explanation, feasibilityBreakdown: fBreakdown, sustainabilityBreakdown: sBreakdown };
}
