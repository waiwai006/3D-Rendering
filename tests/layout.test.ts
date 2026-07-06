import { describe, expect, it } from "vitest";
import { sampleLayout } from "../data/sample-layout";
import { validateLayout } from "../lib/layout-schema";
import { buildManualLayout } from "../lib/manual-layout";
import { estateMatchScore, estateNameFromSourceUrl, extractCentalineFloorPlanImages } from "../lib/source-match";
import { buildEstimatedLayoutFromCrop } from "../lib/image-floorplan";

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

  it("creates a clearly low-confidence layout from a cropped image", () => {
    const width = 40; const height = 30; const data = new Uint8ClampedArray(width * height * 4).fill(255);
    const estimate = buildEstimatedLayoutFromCrop({ width, height, data, colorSpace: "srgb" } as ImageData, sampleLayout);
    expect(estimate.rooms).toHaveLength(1);
    expect(estimate.walls.length).toBeGreaterThanOrEqual(4);
    expect(estimate.property.confidence).toBeLessThan(.5);
    expect(estimate.notes[0].severity).toBe("warning");
  });

  it("supports exact Chinese estate-name matching", () => {
    expect(estateMatchScore("尚翹峰", "尚翹峰")).toBe(1);
    expect(estateMatchScore("尚翘峰", "尚翘峰")).toBe(1);
  });
});
