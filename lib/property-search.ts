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
