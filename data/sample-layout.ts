import type { PropertyLayout } from "@/lib/layout-schema";

const room = (id: string, name: string, type: PropertyLayout["rooms"][number]["type"], width: number, length: number, x: number, y: number, confidence: number): PropertyLayout["rooms"][number] => ({
  id, name, type, dimensions: { widthMeters: width, lengthMeters: length, heightMeters: 2.55 }, position: { x, y, z: 0 }, confidence,
});

export const sampleLayout: PropertyLayout = {
  schemaVersion: "1.0",
  projectId: "demo-harbour-view",
  property: { name: "Harbour View Court", address: "Demo property, Hong Kong", sourceType: "manual", confidence: 0.84 },
  unit: { saleableAreaSqFt: 524, floor: "18/F", orientation: "South-east" },
  rooms: [
    room("living", "Living & dining", "living", 4.8, 3.8, 0, 0, .92),
    room("bed-1", "Main bedroom", "bedroom", 3.2, 2.8, 4.8, 0, .86),
    room("bed-2", "Bedroom 2", "bedroom", 3.2, 3.1, 4.8, 2.8, .78),
    room("kitchen", "Kitchen", "kitchen", 2.1, 2.1, 0, 3.8, .88),
    room("bath", "Bathroom", "bathroom", 1.8, 2.1, 2.1, 3.8, .81),
  ],
  walls: [
    { id: "north", start: { x: 0, y: 0 }, end: { x: 8, y: 0 }, heightMeters: 2.55, thicknessMeters: .12 },
    { id: "east", start: { x: 8, y: 0 }, end: { x: 8, y: 5.9 }, heightMeters: 2.55, thicknessMeters: .12 },
    { id: "south", start: { x: 8, y: 5.9 }, end: { x: 0, y: 5.9 }, heightMeters: 2.55, thicknessMeters: .12 },
    { id: "west", start: { x: 0, y: 5.9 }, end: { x: 0, y: 0 }, heightMeters: 2.55, thicknessMeters: .12 },
    { id: "living-bed", start: { x: 4.8, y: 0 }, end: { x: 4.8, y: 5.9 }, heightMeters: 2.55, thicknessMeters: .1 },
    { id: "beds", start: { x: 4.8, y: 2.8 }, end: { x: 8, y: 2.8 }, heightMeters: 2.55, thicknessMeters: .1 },
    { id: "service", start: { x: 0, y: 3.8 }, end: { x: 4.8, y: 3.8 }, heightMeters: 2.55, thicknessMeters: .1 },
    { id: "kitchen-bath", start: { x: 2.1, y: 3.8 }, end: { x: 2.1, y: 5.9 }, heightMeters: 2.55, thicknessMeters: .1 },
  ],
  doors: [
    { id: "entry", wallId: "west", widthMeters: .9, positionRatioOnWall: .48, opensTo: ["living"] },
    { id: "main-door", wallId: "living-bed", widthMeters: .78, positionRatioOnWall: .28, opensTo: ["living", "bed-1"] },
    { id: "bed2-door", wallId: "living-bed", widthMeters: .75, positionRatioOnWall: .65, opensTo: ["living", "bed-2"] },
    { id: "kitchen-door", wallId: "service", widthMeters: .75, positionRatioOnWall: .2, opensTo: ["living", "kitchen"] },
    { id: "bath-door", wallId: "service", widthMeters: .7, positionRatioOnWall: .65, opensTo: ["living", "bath"] },
  ],
  windows: [
    { id: "living-window", wallId: "north", widthMeters: 2.2, heightMeters: 1.25, positionRatioOnWall: .27, sillHeightMeters: .8 },
    { id: "main-window", wallId: "north", widthMeters: 1.6, heightMeters: 1.15, positionRatioOnWall: .75, sillHeightMeters: .85 },
    { id: "bed2-window", wallId: "east", widthMeters: 1.35, heightMeters: 1.1, positionRatioOnWall: .72, sillHeightMeters: .9 },
    { id: "kitchen-window", wallId: "south", widthMeters: 1, heightMeters: .9, positionRatioOnWall: .87, sillHeightMeters: 1.15 },
  ],
  notes: [{ message: "Demo dimensions are manual approximations and require user confirmation.", severity: "info" }],
};
