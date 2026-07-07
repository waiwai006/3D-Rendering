export type FurnishingCategory = "furniture" | "electronics";
export type FurnishingShape = "sofa" | "bed" | "table" | "desk" | "tv" | "fridge";

export interface FurnishingCatalogItem {
  id: string;
  name: string;
  brand: string;
  category: FurnishingCategory;
  shape: FurnishingShape;
  dimensions: { widthMeters: number; depthMeters: number; heightMeters: number };
  color: string;
  sourceUrl: string;
  note: string;
}

export interface PlacedFurnishing {
  id: string;
  catalogId: string;
  roomId: string;
  position: { x: number; y: number };
  rotationDegrees: number;
}

export const FURNISHING_CATALOG: FurnishingCatalogItem[] = [
  {
    id: "ikea-kivik-2-seat", name: "KIVIK 2-seat sofa", brand: "IKEA", category: "furniture", shape: "sofa",
    dimensions: { widthMeters: 1.9, depthMeters: .95, heightMeters: .83 }, color: "#a9a69d",
    sourceUrl: "https://www.ikea.com.hk/zh/products/sofas-and-armchairs/sofas/kivik-spr-19440594",
    note: "IKEA Hong Kong product dimensions: 190 × 95 × 83 cm.",
  },
  {
    id: "ikea-malm-double", name: "MALM double bed", brand: "IKEA", category: "furniture", shape: "bed",
    dimensions: { widthMeters: 1.5, depthMeters: 1.99, heightMeters: 1 }, color: "#d8d1c2",
    sourceUrl: "https://www.ikea.com.hk/en/products/beds/bed-frames/malm-spr-69176290",
    note: "IKEA Hong Kong frame dimensions: 150 × 199 cm; 100 cm headboard.",
  },
  {
    id: "ikea-alhult-table", name: "ÅLHULT dining table", brand: "IKEA", category: "furniture", shape: "table",
    dimensions: { widthMeters: 1.2, depthMeters: .8, heightMeters: .75 }, color: "#a8784f",
    sourceUrl: "https://www.ikea.com.hk/en/products/dining-tables-and-sets/dining-tables---folding-tables/alhult-art-60600768",
    note: "IKEA Hong Kong product dimensions: 120 × 80 × 75 cm.",
  },
  {
    id: "ikea-micke-desk", name: "MICKE desk", brand: "IKEA", category: "furniture", shape: "desk",
    dimensions: { widthMeters: 1.05, depthMeters: .5, heightMeters: .75 }, color: "#eeeae0",
    sourceUrl: "https://www.ikea.com.hk/en/products/work-desks/home-desks/micke-art-80354276It",
    note: "IKEA Hong Kong product dimensions: 105 × 50 × 75 cm.",
  },
  {
    id: "fortress-55-tv", name: "55-inch television", brand: "Fortress baseline", category: "electronics", shape: "tv",
    dimensions: { widthMeters: 1.23, depthMeters: .22, heightMeters: .75 }, color: "#202526",
    sourceUrl: "https://www.fortress.com.hk/en/shop/tv-entertainment/tv-by-screen-size/55-inch-tv/c/1545",
    note: "Scaled to a common 55-inch 16:9 television with tabletop stand.",
  },
  {
    id: "fortress-slim-fridge", name: "Slim 2-door refrigerator", brand: "Fortress baseline", category: "electronics", shape: "fridge",
    dimensions: { widthMeters: .55, depthMeters: .56, heightMeters: 1.68 }, color: "#e8eceb",
    sourceUrl: "https://www.fortress.com.hk/en/product/ttf2470-247l-2-door-inverter-compressor-refrigerator-fridge/p/BP_14047467",
    note: "Fortress product width/depth: 55 × 56 cm; height uses the model class envelope.",
  },
];

export function catalogItem(id: string) {
  return FURNISHING_CATALOG.find((item) => item.id === id);
}
