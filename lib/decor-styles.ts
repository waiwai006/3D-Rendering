export type DecorReference = { label: string; url: string };

export interface DecorStyle {
  id: string;
  name: string;
  chineseName: string;
  whyPopular: string;
  features: string;
  palette: { background: string; wall: string; floor: string; accent: string; platform: string };
  specialistBrief: string;
  workerActions: string[];
  samplePhotoSearchUrl: string;
  details: {
    wallFinish: string;
    floorFinish: string;
    lighting: string;
    kitchenCue: string;
    storageCue: string;
    signatureTouches: string[];
  };
  render: {
    wallFinish: "smooth" | "textured" | "concrete" | "panelled";
    floorPattern: "light-wood" | "mid-wood" | "dark-wood" | "stone-tile" | "polished-concrete" | "soft-cream";
    lighting: "paper-pendant" | "recessed-warm" | "track-black" | "cove-warm" | "linear-smart";
    kitchenCue: "open-island" | "hidden-storage" | "warm-wood" | "metal-shelf" | "hotel-pantry";
  };
  referencePhotoSearches: DecorReference[];
}

function inspirationSearch(query: string) {
  return `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
}

function buildReferenceBoard(styleName: string, extras: string[] = []): DecorReference[] {
  const queries = [
    `${styleName} small apartment living room`,
    `${styleName} bedroom interior`,
    `${styleName} kitchen design`,
    `${styleName} bathroom interior`,
    `${styleName} ceiling lighting`,
    `${styleName} built in storage`,
    `${styleName} furniture details`,
    `${styleName} floor material`,
    `${styleName} feature wall`,
    ...extras,
  ].slice(0, 10);
  return queries.map((query, index) => ({ label: `Ref ${index + 1}`, url: inspirationSearch(query) }));
}

export const DECOR_STYLES: DecorStyle[] = [
  {
    id: "japanese-muji",
    name: "Japanese / Muji",
    chineseName: "日系 / 無印風",
    whyPopular: "Makes small flats feel clean, warm, and uncluttered.",
    features: "Light wood, white walls, simple storage, soft lighting.",
    palette: { background: "#f3f0e8", wall: "#f8f5ec", floor: "#d8c09c", accent: "#9d8767", platform: "#cdb58e" },
    specialistBrief: "Keep the space calm and modular, with pale timber, off-white walls and low visual clutter.",
    workerActions: ["Use light wood flooring", "Keep walls warm white", "Use soft beige accents", "Prioritise storage-looking built-ins"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/muji-interior",
    details: {
      wallFinish: "Warm white paint with low-contrast timber trims.",
      floorFinish: "Pale natural timber planks or tatami-like warmth.",
      lighting: "Soft paper-like pendants and diffuse ceiling glow.",
      kitchenCue: "Quiet compact kitchen with simple flat panels.",
      storageCue: "Modular shelving and clean hidden storage edges.",
      signatureTouches: ["Low furniture", "Open breathing space", "Simple joinery", "Light oak accents"],
    },
    render: { wallFinish: "smooth", floorPattern: "light-wood", lighting: "paper-pendant", kitchenCue: "hidden-storage" },
    referencePhotoSearches: buildReferenceBoard("Muji Japanese interior", ["Muji Japanese apartment dining", "Muji Japanese built in joinery"]),
  },
  {
    id: "japandi",
    name: "Japandi",
    chineseName: "日式北歐風",
    whyPopular: "Feels premium while staying practical for compact flats.",
    features: "Wood, beige/grey tones, clean lines, calm atmosphere.",
    palette: { background: "#ebe7df", wall: "#eee9df", floor: "#bba787", accent: "#6f7469", platform: "#b49b78" },
    specialistBrief: "Blend Japanese restraint with Scandinavian warmth: natural material, muted contrast, and breathable spacing.",
    workerActions: ["Use beige-grey walls", "Use mid-tone wood floor", "Add muted sage accents", "Keep furniture low and balanced"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/japandi-interior",
    details: {
      wallFinish: "Soft greige walls with subtle texture and calm millwork.",
      floorFinish: "Mid-tone timber boards with matte finish.",
      lighting: "Warm recessed glow with occasional soft pendants.",
      kitchenCue: "Open but tidy kitchen frontage with natural timber.",
      storageCue: "Balanced built-ins with hidden handles.",
      signatureTouches: ["Low silhouettes", "Muted textiles", "Natural stone accents", "Quiet shelves"],
    },
    render: { wallFinish: "textured", floorPattern: "mid-wood", lighting: "recessed-warm", kitchenCue: "warm-wood" },
    referencePhotoSearches: buildReferenceBoard("Japandi apartment interior", ["Japandi open kitchen apartment", "Japandi warm lighting apartment"]),
  },
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    chineseName: "現代簡約風",
    whyPopular: "Works well in compact Hong Kong apartments.",
    features: "Hidden storage, plain colors, simple furniture.",
    palette: { background: "#ececec", wall: "#f5f5f2", floor: "#c9c7c0", accent: "#40454a", platform: "#b8b8b2" },
    specialistBrief: "Reduce visual noise. Use flat planes, concealed storage and a tight grey-white palette.",
    workerActions: ["Use neutral floor", "Use crisp light walls", "Use charcoal accents", "Avoid busy contrast"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/minimalist-apartment-interior",
    details: {
      wallFinish: "Smooth painted walls with flush trims.",
      floorFinish: "Quiet large-format tile or neutral timber.",
      lighting: "Neat recessed downlights and clean perimeter light.",
      kitchenCue: "Flat-panel kitchen with hidden appliances.",
      storageCue: "Full-height concealed cabinets.",
      signatureTouches: ["Flush doors", "Minimal handles", "Open circulation", "Low clutter"],
    },
    render: { wallFinish: "smooth", floorPattern: "stone-tile", lighting: "recessed-warm", kitchenCue: "hidden-storage" },
    referencePhotoSearches: buildReferenceBoard("modern minimalist apartment interior", ["modern minimalist hidden storage apartment", "modern minimalist recessed lighting apartment"]),
  },
  {
    id: "nordic-scandinavian",
    name: "Nordic / Scandinavian",
    chineseName: "北歐風",
    whyPopular: "Bright, cozy, family-friendly.",
    features: "White base, pale wood, fabric sofa, soft colors.",
    palette: { background: "#f1f3ef", wall: "#ffffff", floor: "#d9c9ad", accent: "#9db6b3", platform: "#d1bd9b" },
    specialistBrief: "Maximise daylight and comfort using white surfaces, pale timber and soft fabric-like accent colours.",
    workerActions: ["Use white walls", "Use pale wood floors", "Add muted blue-green accents", "Keep room labels/furniture friendly"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/scandinavian-interior",
    details: {
      wallFinish: "Clean white walls with pale timber edges.",
      floorFinish: "Pale oak boards with a matte finish.",
      lighting: "Layered warm pendants and cozy downlights.",
      kitchenCue: "Open family-friendly kitchen with light-wood cabinetry.",
      storageCue: "Practical joinery and woven baskets.",
      signatureTouches: ["Soft textiles", "Light wood dining pieces", "Friendly rounded lamps", "Airy shelves"],
    },
    render: { wallFinish: "smooth", floorPattern: "light-wood", lighting: "recessed-warm", kitchenCue: "warm-wood" },
    referencePhotoSearches: buildReferenceBoard("Scandinavian apartment interior", ["Nordic cozy apartment lighting", "Scandinavian wood furniture apartment"]),
  },
  {
    id: "wabi-sabi",
    name: "Wabi-sabi",
    chineseName: "侘寂風",
    whyPopular: "Popular for boutique/luxury flats.",
    features: "Natural textures, earthy tones, curved shapes, imperfect finishes.",
    palette: { background: "#e7dfd2", wall: "#d8ccbb", floor: "#b79b7a", accent: "#7a6a58", platform: "#a88968" },
    specialistBrief: "Use earthy texture and quiet imperfection; the 3D view should feel grounded and tactile.",
    workerActions: ["Use clay-beige walls", "Use earthy wood floor", "Use muted brown accents", "Make platforms look stone/wood"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/wabi-sabi-interior",
    details: {
      wallFinish: "Textured limewash or clay plaster.",
      floorFinish: "Warm natural boards or matte stone.",
      lighting: "Soft cove-like warmth with gentle pendants.",
      kitchenCue: "Simple earthy joinery with tactile fronts.",
      storageCue: "Quiet handcrafted shelves and low cabinets.",
      signatureTouches: ["Irregular texture", "Organic forms", "Aged stone", "Subtle asymmetry"],
    },
    render: { wallFinish: "textured", floorPattern: "mid-wood", lighting: "cove-warm", kitchenCue: "warm-wood" },
    referencePhotoSearches: buildReferenceBoard("wabi sabi apartment interior", ["wabi sabi textured plaster interior", "wabi sabi stone bathroom apartment"]),
  },
  {
    id: "cream-style",
    name: "Cream Style",
    chineseName: "奶油風",
    whyPopular: "Very popular on Xiaohongshu / Instagram.",
    features: "Cream, beige, rounded furniture, soft warm lighting.",
    palette: { background: "#fbf4e8", wall: "#fff7ec", floor: "#ead7bb", accent: "#d3a77e", platform: "#ecd0ac" },
    specialistBrief: "Create a soft, photogenic cream apartment mood with warm light and rounded beige forms.",
    workerActions: ["Use cream walls", "Use warm beige floors", "Use caramel accents", "Keep contrast gentle"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/cream-interior-design",
    details: {
      wallFinish: "Cream paint with curved corners where possible.",
      floorFinish: "Warm beige timber or light stone.",
      lighting: "Drop ceiling glow and rounded pendants.",
      kitchenCue: "Open soft-edge kitchen with light fronts.",
      storageCue: "Rounded cabinets and low visual contrast storage.",
      signatureTouches: ["Curved forms", "Warm diffuse light", "Soft upholstery", "Peach-beige accents"],
    },
    render: { wallFinish: "smooth", floorPattern: "soft-cream", lighting: "paper-pendant", kitchenCue: "warm-wood" },
    referencePhotoSearches: buildReferenceBoard("cream style apartment interior", ["cream style rounded furniture apartment", "cream style drop ceiling lighting"]),
  },
  {
    id: "modern-luxury",
    name: "Modern Luxury",
    chineseName: "現代輕奢風",
    whyPopular: "Common in new private estates.",
    features: "Marble-look tiles, metal trim, feature wall, warm lighting.",
    palette: { background: "#ece8df", wall: "#f2eee7", floor: "#c9c2b8", accent: "#b38a45", platform: "#d0cbc4" },
    specialistBrief: "Use quiet luxury: light stone surfaces, warm metallic accent, and hotel-like order.",
    workerActions: ["Use stone-like floor", "Use warm off-white walls", "Use gold accent tone", "Keep edges crisp"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/luxury-apartment-interior",
    details: {
      wallFinish: "Large smooth wall planes with a feature panel wall.",
      floorFinish: "Stone or marble-look slab flooring.",
      lighting: "Warm cove lighting with recessed spots.",
      kitchenCue: "Open island kitchen with stone surfaces.",
      storageCue: "Fluted or metallic-accent cabinetry.",
      signatureTouches: ["Brass highlights", "Stone surfaces", "Layered indirect light", "Hotel-like symmetry"],
    },
    render: { wallFinish: "panelled", floorPattern: "stone-tile", lighting: "cove-warm", kitchenCue: "open-island" },
    referencePhotoSearches: buildReferenceBoard("modern luxury apartment interior", ["modern luxury marble kitchen island", "modern luxury brass wall panel apartment"]),
  },
  {
    id: "industrial",
    name: "Industrial",
    chineseName: "工業風",
    whyPopular: "Popular with younger owners and studios.",
    features: "Cement texture, black metal, exposed track lights.",
    palette: { background: "#d9d6ce", wall: "#b9b6ae", floor: "#8f8a82", accent: "#252525", platform: "#77736c" },
    specialistBrief: "Use concrete grey, black metal contrast and a studio-like rawness while keeping the plan readable.",
    workerActions: ["Use cement-grey walls", "Use darker floor", "Use black accents", "Let platforms read as concrete"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/industrial-interior",
    details: {
      wallFinish: "Concrete- or cement-like walls with raw texture.",
      floorFinish: "Polished concrete or darker matte screed.",
      lighting: "Black track lights or surface-mounted fixtures.",
      kitchenCue: "Open kitchen with island, dark steel shelving, and visible metal.",
      storageCue: "Metal racks and exposed shelving.",
      signatureTouches: ["Black frames", "Concrete feel", "Open shelves", "Warehouse-like cues"],
    },
    render: { wallFinish: "concrete", floorPattern: "polished-concrete", lighting: "track-black", kitchenCue: "metal-shelf" },
    referencePhotoSearches: buildReferenceBoard("industrial apartment interior", ["industrial open kitchen island apartment", "industrial track lighting apartment"]),
  },
  {
    id: "smart-home-minimalist",
    name: "Smart Home Minimalist",
    chineseName: "智能簡約風",
    whyPopular: "Good for new flats and tech users.",
    features: "Hidden wiring, smart lighting, motorized curtains, clean design.",
    palette: { background: "#eef1f2", wall: "#f8faf9", floor: "#c6ced0", accent: "#4a6f86", platform: "#b8c2c5" },
    specialistBrief: "Make the 3D model feel clean and tech-ready, with cool neutrals and subtle blue accents.",
    workerActions: ["Use cool white walls", "Use grey flooring", "Use blue tech accent", "Keep fixtures visually hidden"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/smart-home-interior",
    details: {
      wallFinish: "Cool smooth walls with hidden device niches.",
      floorFinish: "Cool neutral tile or engineered boards.",
      lighting: "Linear smart lighting and tidy recessed spots.",
      kitchenCue: "Seamless kitchen fronts with integrated appliances.",
      storageCue: "Concealed charging and hidden cable routes.",
      signatureTouches: ["Linear LEDs", "Slim trims", "Integrated appliances", "Clean corners"],
    },
    render: { wallFinish: "smooth", floorPattern: "stone-tile", lighting: "linear-smart", kitchenCue: "hidden-storage" },
    referencePhotoSearches: buildReferenceBoard("smart home minimalist apartment interior", ["smart home linear lighting apartment", "minimalist integrated appliances apartment"]),
  },
  {
    id: "storage-practical",
    name: "Storage-focused Practical Style",
    chineseName: "收納實用風",
    whyPopular: "Very Hong Kong-specific because space is limited.",
    features: "Full-height cabinets, platform bed, hidden compartments.",
    palette: { background: "#f0eee7", wall: "#f7f4eb", floor: "#c7b18f", accent: "#8d7b5f", platform: "#b49468" },
    specialistBrief: "Prioritise usable storage and raised platforms; the visual language should signal practical built-ins.",
    workerActions: ["Use warm cabinetry tones", "Emphasise platforms", "Use calm walls", "Prefer storage-friendly furnishing"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/small-apartment-storage",
    details: {
      wallFinish: "Clean neutral walls supporting built-in joinery.",
      floorFinish: "Warm durable timber or laminate.",
      lighting: "Simple recessed lighting for visibility.",
      kitchenCue: "Compact kitchen with high storage density.",
      storageCue: "Full-height cabinets, platform beds, and overhead storage.",
      signatureTouches: ["Raised platforms", "Full-height cupboards", "Compact multipurpose zones", "Bridge storage"],
    },
    render: { wallFinish: "smooth", floorPattern: "mid-wood", lighting: "recessed-warm", kitchenCue: "hidden-storage" },
    referencePhotoSearches: buildReferenceBoard("small apartment storage interior", ["Hong Kong storage apartment platform bed", "small apartment full height cabinets"]),
  },
  {
    id: "korean-minimal",
    name: "Korean Minimal",
    chineseName: "韓系簡約風",
    whyPopular: "Softer and warmer than modern minimalist.",
    features: "Cream/white base, rounded edges, low furniture.",
    palette: { background: "#f8f1e8", wall: "#fffaf1", floor: "#e3ceb2", accent: "#c89f83", platform: "#e5c4a2" },
    specialistBrief: "Use soft cream tones, low contrast and gentle rounded furniture cues.",
    workerActions: ["Use creamy walls", "Use light warm floor", "Use peach-beige accent", "Keep the scene soft"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/korean-minimal-interior",
    details: {
      wallFinish: "Soft creamy walls with smooth, rounded transitions.",
      floorFinish: "Light warm timber or pale beige board.",
      lighting: "Warm soft pendants and gentle recessed glow.",
      kitchenCue: "Simple open kitchen with low-contrast fronts.",
      storageCue: "Calm integrated storage with rounded detail.",
      signatureTouches: ["Soft corners", "Low furniture", "Warm cream palette", "Minimal clutter"],
    },
    render: { wallFinish: "smooth", floorPattern: "soft-cream", lighting: "paper-pendant", kitchenCue: "warm-wood" },
    referencePhotoSearches: buildReferenceBoard("Korean minimal apartment interior", ["Korean cream apartment rounded furniture", "Korean minimal warm lighting apartment"]),
  },
  {
    id: "luxury-hotel",
    name: "Luxury Hotel Style",
    chineseName: "酒店風",
    whyPopular: "Popular for premium flats and master bedrooms.",
    features: "Dark wood, stone texture, indirect lighting, built-in panels.",
    palette: { background: "#ddd6cc", wall: "#cfc4b5", floor: "#6e5540", accent: "#d0a45f", platform: "#80634a" },
    specialistBrief: "Make the space feel like a compact suite: darker timber, stone warmth and metallic accent.",
    workerActions: ["Use dark wood floor", "Use warm stone walls", "Use gold accent", "Make the layout feel hotel-like"],
    samplePhotoSearchUrl: "https://unsplash.com/s/photos/hotel-style-bedroom-interior",
    details: {
      wallFinish: "Panelled wall sections with warm stone inserts.",
      floorFinish: "Dark timber and stone thresholds.",
      lighting: "Indirect cove lighting with a suite-like glow.",
      kitchenCue: "Discreet pantry-style or luxury kitchenette treatment.",
      storageCue: "Full-height panelled wardrobes and hidden mini-bar cues.",
      signatureTouches: ["Dark wood", "Panel walls", "Soft indirect light", "Gold accents"],
    },
    render: { wallFinish: "panelled", floorPattern: "dark-wood", lighting: "cove-warm", kitchenCue: "hotel-pantry" },
    referencePhotoSearches: buildReferenceBoard("luxury hotel style apartment interior", ["luxury hotel bedroom panel wall", "luxury hotel indirect lighting suite"]),
  },
];

export function decorStyleById(id?: string) {
  return DECOR_STYLES.find((style) => style.id === id) ?? DECOR_STYLES[0];
}
