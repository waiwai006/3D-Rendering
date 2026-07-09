import { buildFloorPlanMatchQuality, buildUnitMatchedFields, type FloorPlanCandidate, type PropertySearchRequest } from "./property-search";
import { expandEstateQueries } from "./estate-aliases";
import { estateMatchScore, normalizeSourceText } from "./source-match";

type CuratedFloorPlanImage = {
  path: string;
  title: string;
  planScope: "unit" | "estate" | "site" | "amenity";
  metadata?: Partial<Record<"tower" | "block" | "floor" | "flat", string | string[]>>;
  baseConfidence: number;
};

type CuratedFloorPlan = {
  estateName: string;
  aliases: string[];
  sourceUrl: string;
  images: CuratedFloorPlanImage[];
};

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const asset = (path: string) => `${BASE_PATH}${path}`;

const CURATED_CENTALINE_PLANS: CuratedFloorPlan[] = [
  {
    estateName: "Taikoo Shing",
    aliases: ["Taikoo Shing", "Tai Koo Shing", "太古城"],
    sourceUrl: "https://hk.centanet.com/findproperty/en/detail/TAIKOO-SHING_DAZ418?showgmap=0",
    images: [
      { path: asset("/curated-floorplans/taikoo-shing-1.png"), title: "Taikoo Shing public Centaline unit-plan fallback 1", planScope: "unit", metadata: { flat: ["A", "B", "C"] }, baseConfidence: .73 },
      { path: asset("/curated-floorplans/taikoo-shing-2.png"), title: "Taikoo Shing public Centaline unit-plan fallback 2", planScope: "unit", metadata: { flat: ["B", "C", "D"] }, baseConfidence: .74 },
      { path: asset("/curated-floorplans/taikoo-shing-3.png"), title: "Taikoo Shing public Centaline unit-plan fallback 3", planScope: "unit", metadata: { flat: ["D"] }, baseConfidence: .79 },
    ],
  },
  {
    estateName: "South Horizons",
    aliases: ["South Horizons", "海怡半島", "海怡半岛"],
    sourceUrl: "https://hk.centanet.com/findproperty/en/detail/South-Horizons_TIP072?showgmap=0",
    images: [
      { path: asset("/curated-floorplans/south-horizons-1.png"), title: "South Horizons public Centaline unit-plan fallback 1", planScope: "unit", metadata: { flat: ["C"] }, baseConfidence: .78 },
      { path: asset("/curated-floorplans/south-horizons-2.png"), title: "South Horizons public Centaline estate site reference", planScope: "site", baseConfidence: .28 },
      { path: asset("/curated-floorplans/south-horizons-3.png"), title: "South Horizons public Centaline phase/site reference", planScope: "site", baseConfidence: .24 },
    ],
  },
  {
    estateName: "LOHAS Park",
    aliases: ["LOHAS Park", "日出康城", "康城"],
    sourceUrl: "https://hk.centanet.com/findproperty/en/detail/LOHAS-PARK_SZC509?showgmap=0",
    images: [
      { path: asset("/curated-floorplans/lohas-park-1.jpg"), title: "LOHAS Park public Centaline tower/site reference", planScope: "site", metadata: { tower: ["T1", "T2", "T3", "T5", "T6"] }, baseConfidence: .22 },
      { path: asset("/curated-floorplans/lohas-park-2.jpg"), title: "LOHAS Park public Centaline tower/site reference 2", planScope: "site", metadata: { tower: ["T1", "T2", "T3", "T5", "T6"] }, baseConfidence: .2 },
      { path: asset("/curated-floorplans/lohas-park-3.jpg"), title: "LOHAS Park public Centaline amenity/clubhouse reference", planScope: "amenity", metadata: { floor: ["3", "5"] }, baseConfidence: .12 },
    ],
  },
];

function candidateConfidence(baseConfidence: number, matchedFields: string[], planScope: CuratedFloorPlanImage["planScope"]) {
  const detailBonus = Math.min(.12, Math.max(0, matchedFields.length - 1) * .035);
  const scopePenalty = planScope === "unit" ? 0 : planScope === "estate" ? .06 : planScope === "site" ? .18 : .28;
  return Number(Math.max(.05, Math.min(.9, baseConfidence + detailBonus - scopePenalty)).toFixed(2));
}

export function curatedFloorPlanCandidates(request: PropertySearchRequest): FloorPlanCandidate[] {
  const estate = request.estate?.trim();
  if (!estate) return [];
  const estateQueries = expandEstateQueries(estate);
  const match = CURATED_CENTALINE_PLANS.find((entry) => Math.max(...estateQueries.map((query) => Math.max(...entry.aliases.map((alias) => estateMatchScore(query, alias))))) >= .84);
  if (!match) return [];
  const allCandidates = match.images.map((image, index) => {
    const matchedFields = buildUnitMatchedFields(request, image.metadata);
    const confidence = candidateConfidence(image.baseConfidence, matchedFields, image.planScope);
    return {
      id: `centaline-curated-${normalizeSourceText(match.estateName).replace(/\s/g, "-")}-${index + 1}`,
      estateName: match.estateName,
      title: image.title,
      source: "Centaline" as const,
      sourceType: "secondary" as const,
      sourceVariant: "curated-fallback" as const,
      sourceUrl: match.sourceUrl,
      imageUrl: image.path,
      confidence,
      matchedFields,
      planScope: image.planScope,
      matchQuality: buildFloorPlanMatchQuality(request, matchedFields, confidence),
      requiresVisualConfirmation: true as const,
    };
  });
  const preferred = allCandidates.filter((candidate) => candidate.planScope === "unit" || candidate.planScope === "estate");
  const pool = preferred.length ? preferred : allCandidates;
  return pool.sort((a, b) => b.confidence - a.confidence || b.matchedFields.length - a.matchedFields.length);
}
