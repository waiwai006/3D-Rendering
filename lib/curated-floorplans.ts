import type { FloorPlanCandidate, PropertySearchRequest } from "./property-search";
import { expandEstateQueries } from "./estate-aliases";
import { normalizeSourceText } from "./source-match";

type CuratedFloorPlan = {
  estateName: string;
  aliases: string[];
  sourceUrl: string;
  images: string[];
};

const CURATED_CENTALINE_PLANS: CuratedFloorPlan[] = [
  {
    estateName: "Taikoo Shing",
    aliases: ["Taikoo Shing", "Tai Koo Shing", "\u592a\u53e4\u57ce"],
    sourceUrl: "https://hk.centanet.com/findproperty/en/detail/TAIKOO-SHING_DAZ418?showgmap=0",
    images: [
      "https://hk.centanet.com/imgresize/floorplan/201706/19cpal00079407HDZOXIQS.png",
      "https://hk.centanet.com/imgresize/floorplan/newFP/202103/399_2000_Centaline.png",
      "https://hk.centanet.com/imgresize/floorplan/newUP/202102/4975_2000_Centaline.png",
    ],
  },
  {
    estateName: "South Horizons",
    aliases: ["South Horizons", "\u6d77\u6021\u534a\u5cf6", "\u6d77\u6021\u534a\u5c9b"],
    sourceUrl: "https://hk.centanet.com/findproperty/en/detail/South-Horizons_TIP072?showgmap=0",
    images: [
      "https://hk.centanet.com/imgresize/floorplan/newUP/202105/5970_2000_Centaline.png",
      "https://hk.centanet.com/imgresize/floorplan/2000cen/FPBA/SPSDYWBPWAPKFPS",
      "https://hk.centanet.com/imgresize/floorplan/2000cen/FPBA/SPSDYWBPWAPKSPS",
    ],
  },
  {
    estateName: "LOHAS Park",
    aliases: ["LOHAS Park", "\u65e5\u51fa\u5eb7\u57ce", "\u5eb7\u57ce"],
    sourceUrl: "https://hk.centanet.com/findproperty/en/detail/LOHAS-PARK_SZC509?showgmap=0",
    images: [
      "https://hk.centanet.com/imgresize/floorplan/201405/26cpal00052417GNEBGSPX.jpg",
      "https://hk.centanet.com/imgresize/floorplan/200803/04cpal00019830BEPOJDBK.jpg",
      "https://hk.centanet.com/imgresize/floorplan/200803/04cpal00019832NKLRXVKA.jpg",
    ],
  },
];

export function curatedFloorPlanCandidates(request: PropertySearchRequest): FloorPlanCandidate[] {
  const estate = request.estate?.trim();
  if (!estate) return [];
  const querySet = new Set(expandEstateQueries(estate).map((query) => normalizeSourceText(query).replace(/\s/g, "")));
  const match = CURATED_CENTALINE_PLANS.find((entry) => entry.aliases.some((alias) => querySet.has(normalizeSourceText(alias).replace(/\s/g, ""))));
  if (!match) return [];
  const matchedFields = ["estate"];
  return match.images.map((imageUrl, index) => ({
    id: `centaline-curated-${normalizeSourceText(match.estateName).replace(/\s/g, "-")}-${index + 1}`,
    estateName: match.estateName,
    title: `${match.estateName} public Centaline floor-plan fallback ${index + 1}`,
    source: "Centaline",
    sourceType: "secondary",
    sourceUrl: match.sourceUrl,
    imageUrl,
    confidence: .72,
    matchedFields,
    requiresVisualConfirmation: true,
  }));
}
