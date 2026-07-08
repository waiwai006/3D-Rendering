export type FurnishingCategory = "furniture" | "electronics";
export type FurnishingRoomCategory = "living" | "bedroom" | "kitchen" | "bathroom" | "work" | "storage";
export type FurnishingShape =
  | "sofa"
  | "bed"
  | "table"
  | "desk"
  | "chair"
  | "wardrobe"
  | "bookcase"
  | "cabinet"
  | "tv"
  | "fridge"
  | "washer"
  | "microwave"
  | "aircon";

export interface FurnishingCatalogItem {
  id: string;
  name: string;
  brand: string;
  category: FurnishingCategory;
  roomCategory: FurnishingRoomCategory;
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
    id: "ikea-kivik-2-seat", name: "KIVIK 2-seat sofa", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "sofa",
    dimensions: { widthMeters: 1.9, depthMeters: .95, heightMeters: .83 }, color: "#a9a69d",
    sourceUrl: "https://www.ikea.com.hk/zh/products/sofas-and-armchairs/sofas/kivik-spr-19440594",
    note: "IKEA Hong Kong dimensions: 190 × 95 × 83 cm.",
  },
  {
    id: "ikea-friheten-sofa-bed", name: "FRIHETEN sofa-bed", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "sofa",
    dimensions: { widthMeters: 2.25, depthMeters: 1.05, heightMeters: .83 }, color: "#6f7478",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=FRIHETEN%20sofa-bed",
    note: "Compact sofa-bed baseline for living rooms: about 225 × 105 × 83 cm.",
  },
  {
    id: "ikea-malm-double", name: "MALM double bed", brand: "IKEA", category: "furniture", roomCategory: "bedroom", shape: "bed",
    dimensions: { widthMeters: 1.5, depthMeters: 1.99, heightMeters: 1 }, color: "#d8d1c2",
    sourceUrl: "https://www.ikea.com.hk/en/products/beds/bed-frames/malm-spr-69176290",
    note: "IKEA Hong Kong bed-frame family baseline: 150 × 199 cm; 100 cm headboard.",
  },
  {
    id: "ikea-malm-single", name: "MALM single bed", brand: "IKEA", category: "furniture", roomCategory: "bedroom", shape: "bed",
    dimensions: { widthMeters: .9, depthMeters: 1.99, heightMeters: 1 }, color: "#f1eee6",
    sourceUrl: "https://www.ikea.com.hk/en/products/beds/bed-frames/malm-spr-69176290",
    note: "Single-bed baseline using the MALM family footprint: 90 × 199 cm.",
  },
  {
    id: "ikea-alhult-table", name: "ÅLHULT dining table", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "table",
    dimensions: { widthMeters: 1.2, depthMeters: .8, heightMeters: .75 }, color: "#a8784f",
    sourceUrl: "https://www.ikea.com.hk/en/products/dining-tables-and-sets/dining-tables---folding-tables/alhult-art-60600768",
    note: "IKEA Hong Kong dimensions: 120 × 80 × 75 cm.",
  },
  {
    id: "ikea-lack-coffee-table", name: "LACK coffee table", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "table",
    dimensions: { widthMeters: .9, depthMeters: .55, heightMeters: .45 }, color: "#efe8d7",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=LACK%20coffee%20table",
    note: "Common LACK coffee-table footprint: about 90 × 55 × 45 cm.",
  },
  {
    id: "ikea-micke-desk", name: "MICKE desk", brand: "IKEA", category: "furniture", roomCategory: "work", shape: "desk",
    dimensions: { widthMeters: 1.05, depthMeters: .5, heightMeters: .75 }, color: "#eeeae0",
    sourceUrl: "https://www.ikea.com.hk/en/products/work-desks/home-desks/micke-art-80354276It",
    note: "IKEA Hong Kong dimensions: 105 × 50 × 75 cm.",
  },
  {
    id: "ikea-poang-armchair", name: "POÄNG armchair", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "chair",
    dimensions: { widthMeters: .68, depthMeters: .82, heightMeters: 1 }, color: "#b79a76",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=PO%C3%84NG%20armchair",
    note: "IKEA armchair baseline: about 68 × 82 × 100 cm.",
  },
  {
    id: "ikea-pax-wardrobe", name: "PAX wardrobe", brand: "IKEA", category: "furniture", roomCategory: "bedroom", shape: "wardrobe",
    dimensions: { widthMeters: 1, depthMeters: .6, heightMeters: 2.01 }, color: "#f6f3ea",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=PAX%20wardrobe%20100x60x201",
    note: "Common PAX wardrobe module: about 100 × 60 × 201 cm.",
  },
  {
    id: "ikea-billy-bookcase", name: "BILLY bookcase", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "bookcase",
    dimensions: { widthMeters: .8, depthMeters: .28, heightMeters: 2.02 }, color: "#fff8ec",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=BILLY%20bookcase%2080x28x202",
    note: "Common BILLY bookcase module: about 80 × 28 × 202 cm.",
  },
  {
    id: "ikea-besta-tv-bench", name: "BESTÅ TV bench", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "cabinet",
    dimensions: { widthMeters: 1.8, depthMeters: .42, heightMeters: .39 }, color: "#d6d2c9",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=BEST%C3%85%20TV%20bench",
    note: "Common TV-bench baseline: about 180 × 42 × 39 cm.",
  },
  {
    id: "ikea-kallax-shelf", name: "KALLAX shelf unit", brand: "IKEA", category: "furniture", roomCategory: "storage", shape: "bookcase",
    dimensions: { widthMeters: .77, depthMeters: .39, heightMeters: .77 }, color: "#f4f1e8",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=KALLAX%20shelf%2077x77",
    note: "Common KALLAX shelf unit: about 77 × 39 × 77 cm.",
  },
  {
    id: "ikea-ekedalen-extendable", name: "EKEDALEN extendable dining table", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "table",
    dimensions: { widthMeters: 1.2, depthMeters: .8, heightMeters: .75 }, color: "#6d4f38",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=EKEDALEN%20table",
    note: "Four-seat dining baseline: about 120 × 80 × 75 cm.",
  },
  {
    id: "ikea-brimnes-storage-bed", name: "BRIMNES storage bed", brand: "IKEA", category: "furniture", roomCategory: "bedroom", shape: "bed",
    dimensions: { widthMeters: 1.46, depthMeters: 2.06, heightMeters: .47 }, color: "#f5f1e9",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=BRIMNES%20bed",
    note: "Storage-bed baseline for compact bedrooms: about 146 × 206 × 47 cm.",
  },
  {
    id: "fortress-55-tv", name: "55-inch television", brand: "Fortress baseline", category: "electronics", roomCategory: "living", shape: "tv",
    dimensions: { widthMeters: 1.23, depthMeters: .22, heightMeters: .75 }, color: "#202526",
    sourceUrl: "https://www.fortress.com.hk/en/shop/tv-entertainment/tv-by-screen-size/55-inch-tv/c/1545",
    note: "Scaled to a common 55-inch 16:9 television with tabletop stand.",
  },
  {
    id: "fortress-43-tv", name: "43-inch television", brand: "Fortress baseline", category: "electronics", roomCategory: "bedroom", shape: "tv",
    dimensions: { widthMeters: .97, depthMeters: .2, heightMeters: .62 }, color: "#1c2124",
    sourceUrl: "https://www.fortress.com.hk/en/shop/tv-entertainment/tv-by-screen-size/40-43-inch-tv/c/1543",
    note: "Scaled to a common 43-inch 16:9 television with tabletop stand.",
  },
  {
    id: "fortress-slim-fridge", name: "Slim 2-door refrigerator", brand: "Fortress baseline", category: "electronics", roomCategory: "kitchen", shape: "fridge",
    dimensions: { widthMeters: .55, depthMeters: .56, heightMeters: 1.68 }, color: "#e8eceb",
    sourceUrl: "https://www.fortress.com.hk/en/product/ttf2470-247l-2-door-inverter-compressor-refrigerator-fridge/p/BP_14047467",
    note: "Fortress product width/depth: 55 × 56 cm; height uses the model class envelope.",
  },
  {
    id: "fortress-front-load-washer", name: "Front-load washing machine", brand: "Fortress baseline", category: "electronics", roomCategory: "bathroom", shape: "washer",
    dimensions: { widthMeters: .6, depthMeters: .55, heightMeters: .85 }, color: "#edf1f2",
    sourceUrl: "https://www.fortress.com.hk/en/shop/home-appliances/washing-machine/front-load-washing-machine/c/1201",
    note: "Common Hong Kong front-load washer envelope: about 60 × 55 × 85 cm.",
  },
  {
    id: "fortress-microwave", name: "Countertop microwave oven", brand: "Fortress baseline", category: "electronics", roomCategory: "kitchen", shape: "microwave",
    dimensions: { widthMeters: .45, depthMeters: .36, heightMeters: .26 }, color: "#2d3133",
    sourceUrl: "https://www.fortress.com.hk/en/shop/home-appliances/microwave-oven/c/1221",
    note: "Compact countertop microwave baseline: about 45 × 36 × 26 cm.",
  },
  {
    id: "fortress-window-aircon", name: "Window air conditioner", brand: "Fortress baseline", category: "electronics", roomCategory: "bedroom", shape: "aircon",
    dimensions: { widthMeters: .45, depthMeters: .58, heightMeters: .35 }, color: "#dde7e8",
    sourceUrl: "https://www.fortress.com.hk/en/shop/home-appliances/air-conditioner/window-type-air-conditioner/c/1211",
    note: "Compact window-type air-conditioner envelope: about 45 × 58 × 35 cm.",
  },
  {
    id: "hktvmall-dehumidifier", name: "Dehumidifier", brand: "HKTVmall baseline", category: "electronics", roomCategory: "bathroom", shape: "fridge",
    dimensions: { widthMeters: .35, depthMeters: .25, heightMeters: .58 }, color: "#dfe6e8",
    sourceUrl: "https://www.hktvmall.com/hktv/en/search_a?keyword=dehumidifier",
    note: "Compact dehumidifier baseline for Hong Kong flats: about 35 × 25 × 58 cm.",
  },
];

export function catalogItem(id: string) {
  return FURNISHING_CATALOG.find((item) => item.id === id);
}
