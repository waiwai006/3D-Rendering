export interface PropertySearchRequest {
  estate: string;
  address?: string;
  tower?: string;
  block?: string;
  floor?: string;
  flat?: string;
  saleableAreaSqFt?: number;
}

export interface FloorPlanCandidate {
  id: string;
  estateName: string;
  title: string;
  source: "Centaline";
  sourceType: "secondary";
  sourceVariant?: "estate-page" | "listing-detail" | "curated-fallback";
  sourceUrl: string;
  imageUrl: string;
  confidence: number;
  matchedFields: string[];
  planScope?: "unit" | "estate" | "site" | "amenity";
  matchQuality?: FloorPlanMatchQuality;
  requiresVisualConfirmation: true;
}

export interface FloorPlanMatchQuality {
  score: number;
  matched: string[];
  missing: string[];
  warning: string;
  nextAction: string;
}

export interface PropertySearchResponse {
  candidates: FloorPlanCandidate[];
  searchedSources: string[];
  warnings: string[];
  sourceCoverage: SourceCoverage[];
}

export interface SourceCoverage {
  name: string;
  url: string;
  status: "searched" | "manual" | "limited";
  note: string;
}

export function buildFloorPlanMatchQuality(request: PropertySearchRequest, matchedFields: string[], confidence: number): FloorPlanMatchQuality {
  const requestedFields = [
    ["estate", request.estate],
    ["tower", request.tower],
    ["block", request.block],
    ["floor", request.floor],
    ["flat", request.flat],
    ["saleable area", request.saleableAreaSqFt],
  ] as const;
  const matched = matchedFields.filter((field) => requestedFields.some(([name]) => name === field));
  const missing = requestedFields.filter(([name, value]) => Boolean(value) && !matched.includes(name)).map(([name]) => name);
  const score = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  const warning = missing.length
    ? `Matched ${matched.join(", ") || "source context"}, but still needs ${missing.join(", ")} confirmation.`
    : "All supplied property fields are represented in the match; still confirm the image visually.";
  const nextAction = missing.length
    ? "Zoom into the source plan and check the missing fields before generating 3D."
    : "Use this plan if the image shape, orientation and room labels match your flat.";
  return { score, matched, missing, warning, nextAction };
}

function normalizeFieldValue(value: string | number | undefined) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

function compactAlphaNumeric(value: string | number | undefined) {
  return normalizeFieldValue(value).replace(/[^a-z0-9\u3400-\u9fff]+/gu, "");
}

function escapedPattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractDigits(value: string | number | undefined) {
  return normalizeFieldValue(value).match(/\d+/g)?.join("") ?? "";
}

function extractLetters(value: string | number | undefined) {
  return normalizeFieldValue(value).replace(/[^a-z]/g, "");
}

function contextualFieldMatch(field: "tower" | "block" | "floor" | "flat", value: string | undefined, pageText: string) {
  if (!value) return false;
  const raw = normalizeFieldValue(pageText);
  const compactText = compactAlphaNumeric(pageText);
  const compactValue = compactAlphaNumeric(value);
  const digits = extractDigits(value);
  const letters = extractLetters(value);
  const patterns: RegExp[] = [];
  const add = (pattern: string) => patterns.push(new RegExp(pattern, "iu"));

  if (compactValue.length > 1 && compactText.includes(compactValue)) return true;

  if (field === "flat") {
    if (letters) {
      add(`\\bflat\\s*${escapedPattern(letters)}\\b`);
      add(`\\bunit\\s*${escapedPattern(letters)}\\b`);
      add(`${escapedPattern(letters)}\\s*(?:室|號|号)`);
      add(`(?:室|號|号)\\s*${escapedPattern(letters)}`);
    }
    if (digits || letters) {
      const code = `${digits}${letters}` || compactValue;
      if (code) {
        add(`\\bflat\\s*${escapedPattern(code)}\\b`);
        add(`\\bunit\\s*${escapedPattern(code)}\\b`);
        add(`${escapedPattern(code)}\\s*(?:室|號|号)`);
      }
    }
  }

  if (field === "floor" && digits) {
    add(`\\bfloor\\s*${escapedPattern(digits)}\\b`);
    add(`\\b${escapedPattern(digits)}\\s*(?:\\/\\s*f|f\\/|floor)\\b`);
    add(`第\\s*${escapedPattern(digits)}\\s*(?:樓|层|層)`);
    add(`${escapedPattern(digits)}\\s*(?:樓|层|層)`);
  }

  if (field === "tower" && digits) {
    add(`\\bt(?:ower)?\\s*${escapedPattern(digits)}\\b`);
    add(`\\btwr\\s*${escapedPattern(digits)}\\b`);
    add(`第\\s*${escapedPattern(digits)}\\s*座`);
    add(`${escapedPattern(digits)}\\s*座`);
  }

  if (field === "block" && digits) {
    add(`\\bblock\\s*${escapedPattern(digits)}\\b`);
    add(`\\bblk\\s*${escapedPattern(digits)}\\b`);
    add(`第\\s*${escapedPattern(digits)}\\s*座`);
    add(`${escapedPattern(digits)}\\s*座`);
  }

  return patterns.some((pattern) => pattern.test(raw));
}

export function buildUnitMatchedFields(
  request: PropertySearchRequest,
  metadata?: Partial<Record<"tower" | "block" | "floor" | "flat", string | string[]>>,
) {
  const matchedFields = ["estate"];
  if (!metadata) return matchedFields;
  const fieldChecks: Array<["tower" | "block" | "floor" | "flat", string | undefined]> = [
    ["tower", request.tower],
    ["block", request.block],
    ["floor", request.floor],
    ["flat", request.flat],
  ];
  for (const [field, requestValue] of fieldChecks) {
    if (!requestValue) continue;
    const requestCompact = compactAlphaNumeric(requestValue);
    const candidates = Array.isArray(metadata[field]) ? metadata[field] : metadata[field] ? [metadata[field] as string] : [];
    if (candidates.some((candidate) => compactAlphaNumeric(candidate) === requestCompact || normalizeFieldValue(candidate) === normalizeFieldValue(requestValue))) {
      matchedFields.push(field);
    }
  }
  return matchedFields;
}

export function buildSourceMatchedFields(request: PropertySearchRequest, pageText: string) {
  const matchedFields = ["estate"];
  const fieldChecks: Array<["tower" | "block" | "floor" | "flat", string | undefined]> = [
    ["tower", request.tower],
    ["block", request.block],
    ["floor", request.floor],
    ["flat", request.flat],
  ];
  for (const [field, value] of fieldChecks) {
    if (contextualFieldMatch(field, value, pageText)) matchedFields.push(field);
  }
  return matchedFields;
}
