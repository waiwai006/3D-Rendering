import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { sampleLayout } from "../data/sample-layout";
import { validateLayout } from "../lib/layout-schema";
import { buildFloorPlanMatchQuality, buildSourceMatchedFields } from "../lib/property-search";
import { buildManualLayout } from "../lib/manual-layout";
import { estateMatchScore, estateNameFromSourceUrl, extractCentalineFloorPlanImages, extractCentalineListingDetailUrls } from "../lib/source-match";
import { buildEstimatedLayoutFromCrop } from "../lib/image-floorplan";
import { FURNISHING_CATALOG } from "../lib/furnishing-catalog";
import { expandEstateQueries } from "../lib/estate-aliases";
import { curatedFloorPlanCandidates } from "../lib/curated-floorplans";

describe("sample layout", () => {
  it("is valid and contains the required MVP rooms", () => {
    expect(validateLayout(sampleLayout)).toEqual([]);
    expect(sampleLayout.rooms.filter((room) => room.type === "bedroom")).toHaveLength(2);
    const types = sampleLayout.rooms.map((room) => room.type);
    expect(types).toEqual(expect.arrayContaining(["living", "bedroom", "kitchen", "bathroom"]));
  });

  it("rejects orphan openings and invalid dimensions", () => {
    const invalid = structuredClone(sampleLayout);
    invalid.rooms[0].dimensions.widthMeters = 0;
    invalid.doors[0].wallId = "missing";
    expect(validateLayout(invalid)).toEqual(expect.arrayContaining([
      expect.stringContaining("width must be positive"),
      expect.stringContaining("wall does not exist"),
    ]));
  });

  it("turns drawn rooms into a valid data-driven layout", () => {
    const manual = buildManualLayout([
      { id: "living", name: "Living", type: "living", x: 0, y: 0, width: 4, length: 3 },
      { id: "bed", name: "Bedroom", type: "bedroom", x: 4, y: 0, width: 3, length: 3 },
    ], sampleLayout);
    expect(manual.rooms).toHaveLength(2);
    expect(manual.walls).toHaveLength(8);
    expect(manual.property.sourceType).toBe("manual");
    expect(validateLayout(manual)).toEqual([]);
  });

  it("matches estate sitemap URLs and extracts unique floor-plan images", () => {
    const url = "https://hk.centanet.com/estate/en/THE-ZENITH/3-SAPPWPPOPS";
    expect(estateNameFromSourceUrl(url)).toBe("THE ZENITH");
    expect(estateMatchScore("The Zenith", "THE ZENITH")).toBe(1);
    const html = 'thumbnail:"https:\\u002F\\u002Fhk.centanet.com\\u002Fimgresize\\u002Ffloorplan\\u002Fplan-a.jpg" thumbnail:"https:\\u002F\\u002Fhk.centanet.com\\u002Fimgresize\\u002Ffloorplan\\u002Fplan-a.jpg"';
    expect(extractCentalineFloorPlanImages(html)).toEqual(["https://hk.centanet.com/imgresize/floorplan/plan-a.jpg"]);
    expect(() => estateMatchScore("100% Court", "100% Court")).not.toThrow();
  });

  it("extracts listing detail and listing-level floor-plan images", () => {
    const listingHtml = 'detailUrl:"https:\\u002F\\u002Fhk.centanet.com\\u002Ffindproperty\\u002Fen\\u002Fdetail\\u002FTaikoo-Shing_DAQ212?showgmap=0"';
    expect(extractCentalineListingDetailUrls(listingHtml)).toEqual(["https://hk.centanet.com/findproperty/en/detail/Taikoo-Shing_DAQ212?showgmap=0"]);
    const detailHtml = 'thumbnailUrl:"https:\\u002F\\u002Fhk.centanet.com\\u002Fimgresize\\u002Ffloorplan\\u002F201706\\u002Fplan.png" rawImage:"https:\\u002F\\u002Fhkfloorplan.centanet.com\\u002Fimg\\u002Fimg.aspx?dir=201706&name=plan.png"';
    expect(extractCentalineFloorPlanImages(detailHtml)[0]).toBe("https://hk.centanet.com/imgresize/floorplan/201706/plan.png");
  });

  it("creates a clearly low-confidence layout from a cropped image", () => {
    const width = 40; const height = 30; const data = new Uint8ClampedArray(width * height * 4).fill(255);
    const estimate = buildEstimatedLayoutFromCrop({ width, height, data, colorSpace: "srgb" } as ImageData, sampleLayout);
    expect(estimate.rooms).toHaveLength(1);
    expect(estimate.walls.length).toBeGreaterThanOrEqual(4);
    expect(estimate.doors.length).toBeGreaterThanOrEqual(1);
    expect(estimate.windows.length).toBeGreaterThanOrEqual(1);
    expect(estimate.platforms?.length).toBeGreaterThanOrEqual(1);
    expect(estimate.property.confidence).toBeLessThan(.5);
    expect(estimate.notes[0].severity).toBe("warning");
  });

  it.each([
    { name: "original", left: 0, top: 0, size: 700, resize: 700 },
    { name: "cropped margins", left: 180, top: 80, size: 440, resize: 660 },
    { name: "smaller upload", left: 0, top: 0, size: 700, resize: 350 },
  ])("locates all seven Taikoo doors: $name", async ({ left, top, size, resize }) => {
    const height = top ? 550 : size;
    const { data, info } = await sharp("public/curated-floorplans/taikoo-shing-3.png")
      .extract({ left, top, width: size, height }).resize(resize).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const estimate = buildEstimatedLayoutFromCrop({ width: info.width, height: info.height, data: new Uint8ClampedArray(data), colorSpace: "srgb" } as ImageData, sampleLayout);
    // Independently annotated opening midpoints in the original 700px drawing.
    const expected = [[366.5,105],[270.5,235],[226,318],[327,386.5],[367,438.5],[327,483.5],[367,483.5]];
    expect(estimate.doors).toHaveLength(7);
    expect(validateLayout(estimate)).toEqual([]);
    for (const [x, y] of expected) {
      const meters = 10 / Math.max(size, height);
      const hits = estimate.doors.filter(door => {
        const wall = estimate.walls.find(wall => wall.id === door.wallId)!;
        const px = wall.start.x + (wall.end.x-wall.start.x)*door.positionRatioOnWall;
        const py = wall.start.y + (wall.end.y-wall.start.y)*door.positionRatioOnWall;
        return Math.hypot(px-(x-left)*meters, py-(y-top)*meters) < .09;
      });
      expect(hits, `door at ${x},${y}`).toHaveLength(1);
    }
    for (const door of estimate.doors) {
      const wall = estimate.walls.find(w => w.id === door.wallId)!;
      const length = Math.hypot(wall.end.x-wall.start.x,wall.end.y-wall.start.y);
      expect(door.positionRatioOnWall * length - door.widthMeters/2).toBeGreaterThanOrEqual(0);
      expect(door.positionRatioOnWall * length + door.widthMeters/2).toBeLessThanOrEqual(length);
    }
  });

  it("detects several openings in the South Horizons sample", async () => {
    const { data, info } = await sharp("public/curated-floorplans/south-horizons-1.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const estimate = buildEstimatedLayoutFromCrop({ width: info.width, height: info.height, data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength), colorSpace: "srgb" } as ImageData, sampleLayout);
    expect(estimate.doors.length).toBeGreaterThanOrEqual(3);
    expect(estimate.windows.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps extreme crop aspect ratios bounded for 3D estimation", () => {
    const width = 2; const height = 5000; const data = new Uint8ClampedArray(width * height * 4).fill(255);
    const estimate = buildEstimatedLayoutFromCrop({ width, height, data, colorSpace: "srgb" } as ImageData, sampleLayout);
    expect(estimate.rooms[0].dimensions.widthMeters).toBeLessThanOrEqual(10);
    expect(estimate.rooms[0].dimensions.lengthMeters).toBeLessThanOrEqual(10);
    expect(estimate.walls.length).toBeGreaterThanOrEqual(4);
  });

  it("supports exact Chinese estate-name matching", () => {
    const examples = [
      ["\u592a\u53e4\u57ce", "https://hk.centanet.com/estate/%E5%A4%AA%E5%8F%A4%E5%9F%8E/3-OVDUURFSRJ"],
      ["\u7f8e\u5b5a\u65b0\u90a8", "https://hk.centanet.com/estate/%E7%BE%8E%E5%AD%9A%E6%96%B0%E9%82%A8/3-UDDCFRDSRR"],
      ["\u9ec3\u57d4\u82b1\u5712", "https://hk.centanet.com/estate/%E9%BB%83%E5%9F%94%E8%8A%B1%E5%9C%92/3-MZDIIHHAHN"],
    ];
    for (const [query, url] of examples) {
      const estateName = estateNameFromSourceUrl(url);
      expect(estateName).toBe(query);
      expect(estateMatchScore(query, estateName)).toBe(1);
    }
    expect(estateMatchScore("\u9ec3\u57d4\u82b1\u5712", "\u9ec3\u57d4\u65b0\u5929\u5730")).toBe(0);
    expect(estateMatchScore("\u7f8e\u5b5a\u65b0\u6751", "\u7f8e\u5b5a\u65b0\u90a8")).toBe(1);
  });

  it("expands Chinese estate names into English aliases for search", () => {
    expect(expandEstateQueries("\u592a\u53e4\u57ce")).toEqual(expect.arrayContaining(["Taikoo Shing", "Tai Koo Shing"]));
    expect(expandEstateQueries("\u6d77\u6021\u534a\u5cf6")).toEqual(expect.arrayContaining(["South Horizons"]));
    expect(expandEstateQueries("\u5eb7\u57ce")).toEqual(expect.arrayContaining(["LOHAS Park"]));
    expect(expandEstateQueries("\u5357\u8c50\u65b0\u90a8")).toEqual(expect.arrayContaining(["Nan Fung Sun Chuen"]));
    expect(expandEstateQueries("\u85cd\u7063\u534a\u5cf6")).toEqual(expect.arrayContaining(["Island Resort"]));
    expect(expandEstateQueries("\u8c9d\u6c99\u7063")).toEqual(expect.arrayContaining(["Residence Bel-Air"]));
  });

  it("provides curated public Centaline fallbacks for common Chinese searches", () => {
    expect(curatedFloorPlanCandidates({ estate: "\u592a\u53e4\u57ce" }).length).toBeGreaterThanOrEqual(3);
    expect(curatedFloorPlanCandidates({ estate: "\u6d77\u6021\u534a\u5cf6" }).every((candidate) => candidate.planScope === "unit" || candidate.planScope === "estate")).toBe(true);
    expect(curatedFloorPlanCandidates({ estate: "\u5eb7\u57ce" })[0]?.planScope).toBe("site");
  });

  it("explains match quality gaps before a candidate is used for 3D", () => {
    const quality = buildFloorPlanMatchQuality({ estate: "\u592a\u53e4\u57ce", tower: "Kam Din Terrace", flat: "H" }, ["estate"], .72);
    expect(quality.score).toBe(72);
    expect(quality.matched).toEqual(["estate"]);
    expect(quality.missing).toEqual(["tower", "flat"]);
    expect(quality.nextAction).toContain("missing fields");
    const [candidate] = curatedFloorPlanCandidates({ estate: "\u592a\u53e4\u57ce", tower: "Kam Din Terrace", flat: "H" });
    expect(candidate.matchQuality?.missing).toEqual(["tower", "flat"]);
  });

  it("uses curated unit metadata to narrow South Horizons matches", () => {
    const [candidate] = curatedFloorPlanCandidates({ estate: "\u6d77\u6021\u534a\u5cf6", flat: "C" });
    expect(candidate.planScope).toBe("unit");
    expect(candidate.matchedFields).toEqual(expect.arrayContaining(["estate", "flat"]));
  });

  it("matches unit details from source-specific page wording", () => {
    const sourceText = "South Horizons Tower 12, 18/F, Flat D. 第12座 18樓 D室";
    const matched = buildSourceMatchedFields({ estate: "South Horizons", tower: "T12", floor: "18", flat: "D" }, sourceText);
    expect(matched).toEqual(expect.arrayContaining(["estate", "tower", "floor", "flat"]));
    expect(buildSourceMatchedFields({ estate: "South Horizons", block: "3" }, "Block 3 with seaview layout")).toEqual(expect.arrayContaining(["estate", "block"]));
  });

  it("uses positive real-world furnishing dimensions", () => {
    expect(FURNISHING_CATALOG.length).toBeGreaterThanOrEqual(6);
    for (const item of FURNISHING_CATALOG) {
      expect(item.dimensions.widthMeters).toBeGreaterThan(0);
      expect(item.dimensions.depthMeters).toBeGreaterThan(0);
      expect(item.dimensions.heightMeters).toBeGreaterThan(0);
      expect(item.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});
