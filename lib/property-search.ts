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
  sourceUrl: string;
  imageUrl: string;
  confidence: number;
  matchedFields: string[];
  requiresVisualConfirmation: true;
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
