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
  chineseName: string;
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
    id: "ikea-kivik-2-seat", name: "KIVIK 2-seat sofa", chineseName: "KIVIK 雙人梳化", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "sofa",
    dimensions: { widthMeters: 1.9, depthMeters: .95, heightMeters: .83 }, color: "#a9a69d",
    sourceUrl: "https://www.ikea.com.hk/zh/products/sofas-and-armchairs/sofas/kivik-spr-19440594",
    note: "IKEA Hong Kong dimensions: 190 x 95 x 83 cm.",
  },
  {
    id: "ikea-friheten-sofa-bed", name: "FRIHETEN sofa-bed", chineseName: "FRIHETEN 梳化床", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "sofa",
    dimensions: { widthMeters: 2.25, depthMeters: 1.05, heightMeters: .83 }, color: "#6f7478",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=FRIHETEN%20sofa-bed",
    note: "Compact sofa-bed baseline for living rooms: about 225 x 105 x 83 cm.",
  },
  {
    id: "ikea-malm-double", name: "MALM double bed", chineseName: "MALM 雙人床", brand: "IKEA", category: "furniture", roomCategory: "bedroom", shape: "bed",
    dimensions: { widthMeters: 1.5, depthMeters: 1.99, heightMeters: 1 }, color: "#d8d1c2",
    sourceUrl: "https://www.ikea.com.hk/en/products/beds/bed-frames/malm-spr-69176290",
    note: "IKEA Hong Kong bed-frame family baseline: 150 x 199 cm; 100 cm headboard.",
  },
  {
    id: "ikea-malm-single", name: "MALM single bed", chineseName: "MALM 單人床", brand: "IKEA", category: "furniture", roomCategory: "bedroom", shape: "bed",
    dimensions: { widthMeters: .9, depthMeters: 1.99, heightMeters: 1 }, color: "#f1eee6",
    sourceUrl: "https://www.ikea.com.hk/en/products/beds/bed-frames/malm-spr-69176290",
    note: "Single-bed baseline using the MALM family footprint: 90 x 199 cm.",
  },
  {
    id: "ikea-alhult-table", name: "ALHULT dining table", chineseName: "ALHULT 餐桌", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "table",
    dimensions: { widthMeters: 1.2, depthMeters: .8, heightMeters: .75 }, color: "#a8784f",
    sourceUrl: "https://www.ikea.com.hk/en/products/dining-tables-and-sets/dining-tables---folding-tables/alhult-art-60600768",
    note: "IKEA Hong Kong dimensions: 120 x 80 x 75 cm.",
  },
  {
    id: "ikea-lack-coffee-table", name: "LACK coffee table", chineseName: "LACK 茶几", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "table",
    dimensions: { widthMeters: .9, depthMeters: .55, heightMeters: .45 }, color: "#efe8d7",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=LACK%20coffee%20table",
    note: "Common LACK coffee-table footprint: about 90 x 55 x 45 cm.",
  },
  {
    id: "ikea-micke-desk", name: "MICKE desk", chineseName: "MICKE 書桌", brand: "IKEA", category: "furniture", roomCategory: "work", shape: "desk",
    dimensions: { widthMeters: 1.05, depthMeters: .5, heightMeters: .75 }, color: "#eeeae0",
    sourceUrl: "https://www.ikea.com.hk/en/products/work-desks/home-desks/micke-art-80354276It",
    note: "IKEA Hong Kong dimensions: 105 x 50 x 75 cm.",
  },
  {
    id: "ikea-poang-armchair", name: "POANG armchair", chineseName: "POANG 扶手椅", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "chair",
    dimensions: { widthMeters: .68, depthMeters: .82, heightMeters: 1 }, color: "#b79a76",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=PO%C3%84NG%20armchair",
    note: "IKEA armchair baseline: about 68 x 82 x 100 cm.",
  },
  {
    id: "ikea-pax-wardrobe", name: "PAX wardrobe", chineseName: "PAX 衣櫃", brand: "IKEA", category: "furniture", roomCategory: "bedroom", shape: "wardrobe",
    dimensions: { widthMeters: 1, depthMeters: .6, heightMeters: 2.01 }, color: "#f6f3ea",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=PAX%20wardrobe%20100x60x201",
    note: "Common PAX wardrobe module: about 100 x 60 x 201 cm.",
  },
  {
    id: "ikea-billy-bookcase", name: "BILLY bookcase", chineseName: "BILLY 書櫃", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "bookcase",
    dimensions: { widthMeters: .8, depthMeters: .28, heightMeters: 2.02 }, color: "#fff8ec",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=BILLY%20bookcase%2080x28x202",
    note: "Common BILLY bookcase module: about 80 x 28 x 202 cm.",
  },
  {
    id: "ikea-besta-tv-bench", name: "BESTA TV bench", chineseName: "BESTA 電視櫃", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "cabinet",
    dimensions: { widthMeters: 1.8, depthMeters: .42, heightMeters: .39 }, color: "#d6d2c9",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=BEST%C3%85%20TV%20bench",
    note: "Common TV-bench baseline: about 180 x 42 x 39 cm.",
  },
  {
    id: "ikea-kallax-shelf", name: "KALLAX shelf unit", chineseName: "KALLAX 層架", brand: "IKEA", category: "furniture", roomCategory: "storage", shape: "bookcase",
    dimensions: { widthMeters: .77, depthMeters: .39, heightMeters: .77 }, color: "#f4f1e8",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=KALLAX%20shelf%2077x77",
    note: "Common KALLAX shelf unit: about 77 x 39 x 77 cm.",
  },
  {
    id: "ikea-ekedalen-extendable", name: "EKEDALEN extendable dining table", chineseName: "EKEDALEN 伸縮餐桌", brand: "IKEA", category: "furniture", roomCategory: "living", shape: "table",
    dimensions: { widthMeters: 1.2, depthMeters: .8, heightMeters: .75 }, color: "#6d4f38",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=EKEDALEN%20table",
    note: "Four-seat dining baseline: about 120 x 80 x 75 cm.",
  },
  {
    id: "ikea-brimnes-storage-bed", name: "BRIMNES storage bed", chineseName: "BRIMNES 儲物床", brand: "IKEA", category: "furniture", roomCategory: "bedroom", shape: "bed",
    dimensions: { widthMeters: 1.46, depthMeters: 2.06, heightMeters: .47 }, color: "#f5f1e9",
    sourceUrl: "https://www.ikea.com.hk/en/search/?q=BRIMNES%20bed",
    note: "Storage-bed baseline for compact bedrooms: about 146 x 206 x 47 cm.",
  },
  {
    id: "fortress-55-tv", name: "55-inch television", chineseName: "55 吋電視", brand: "Fortress baseline", category: "electronics", roomCategory: "living", shape: "tv",
    dimensions: { widthMeters: 1.23, depthMeters: .22, heightMeters: .75 }, color: "#202526",
    sourceUrl: "https://www.fortress.com.hk/en/shop/tv-entertainment/tv-by-screen-size/55-inch-tv/c/1545",
    note: "Scaled to a common 55-inch 16:9 television with tabletop stand.",
  },
  {
    id: "fortress-43-tv", name: "43-inch television", chineseName: "43 吋電視", brand: "Fortress baseline", category: "electronics", roomCategory: "bedroom", shape: "tv",
    dimensions: { widthMeters: .97, depthMeters: .2, heightMeters: .62 }, color: "#1c2124",
    sourceUrl: "https://www.fortress.com.hk/en/shop/tv-entertainment/tv-by-screen-size/40-43-inch-tv/c/1543",
    note: "Scaled to a common 43-inch 16:9 television with tabletop stand.",
  },
  {
    id: "fortress-slim-fridge", name: "Slim 2-door refrigerator", chineseName: "纖巧雙門雪櫃", brand: "Fortress baseline", category: "electronics", roomCategory: "kitchen", shape: "fridge",
    dimensions: { widthMeters: .55, depthMeters: .56, heightMeters: 1.68 }, color: "#e8eceb",
    sourceUrl: "https://www.fortress.com.hk/en/product/ttf2470-247l-2-door-inverter-compressor-refrigerator-fridge/p/BP_14047467",
    note: "Fortress product width/depth: 55 x 56 cm; height uses the model class envelope.",
  },
  {
    id: "fortress-front-load-washer", name: "Front-load washing machine", chineseName: "前置式洗衣機", brand: "Fortress baseline", category: "electronics", roomCategory: "bathroom", shape: "washer",
    dimensions: { widthMeters: .6, depthMeters: .55, heightMeters: .85 }, color: "#edf1f2",
    sourceUrl: "https://www.fortress.com.hk/en/shop/home-appliances/washing-machine/front-load-washing-machine/c/1201",
    note: "Common Hong Kong front-load washer envelope: about 60 x 55 x 85 cm.",
  },
  {
    id: "fortress-microwave", name: "Countertop microwave oven", chineseName: "座檯式微波爐", brand: "Fortress baseline", category: "electronics", roomCategory: "kitchen", shape: "microwave",
    dimensions: { widthMeters: .45, depthMeters: .36, heightMeters: .26 }, color: "#2d3133",
    sourceUrl: "https://www.fortress.com.hk/en/shop/home-appliances/microwave-oven/c/1221",
    note: "Compact countertop microwave baseline: about 45 x 36 x 26 cm.",
  },
  {
    id: "fortress-window-aircon", name: "Window air conditioner", chineseName: "窗口式冷氣機", brand: "Fortress baseline", category: "electronics", roomCategory: "bedroom", shape: "aircon",
    dimensions: { widthMeters: .45, depthMeters: .58, heightMeters: .35 }, color: "#dde7e8",
    sourceUrl: "https://www.fortress.com.hk/en/shop/home-appliances/air-conditioner/window-type-air-conditioner/c/1211",
    note: "Compact window-type air-conditioner envelope: about 45 x 58 x 35 cm.",
  },
  {
    id: "hktvmall-dehumidifier", name: "Dehumidifier", chineseName: "抽濕機", brand: "HKTVmall baseline", category: "electronics", roomCategory: "bathroom", shape: "fridge",
    dimensions: { widthMeters: .35, depthMeters: .25, heightMeters: .58 }, color: "#dfe6e8",
    sourceUrl: "https://www.hktvmall.com/hktv/en/search_a?keyword=dehumidifier",
    note: "Compact dehumidifier baseline for Hong Kong flats: about 35 x 25 x 58 cm.",
  },
];

export function catalogItem(id: string) {
  return FURNISHING_CATALOG.find((item) => item.id === id);
}
