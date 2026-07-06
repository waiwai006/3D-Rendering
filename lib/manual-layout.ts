import type { PropertyLayout, RoomType } from "@/lib/layout-schema";

export interface DrawnRoom {
  id: string;
  name: string;
  type: RoomType;
  x: number;
  y: number;
  width: number;
  length: number;
}

export function buildManualLayout(rooms: DrawnRoom[], base: PropertyLayout): PropertyLayout {
  const walls = rooms.flatMap((room) => {
    const x2 = room.x + room.width;
    const y2 = room.y + room.length;
    return [
      { id: `${room.id}-north`, start: { x: room.x, y: room.y }, end: { x: x2, y: room.y }, heightMeters: 2.55, thicknessMeters: .1 },
      { id: `${room.id}-east`, start: { x: x2, y: room.y }, end: { x: x2, y: y2 }, heightMeters: 2.55, thicknessMeters: .1 },
      { id: `${room.id}-south`, start: { x: x2, y: y2 }, end: { x: room.x, y: y2 }, heightMeters: 2.55, thicknessMeters: .1 },
      { id: `${room.id}-west`, start: { x: room.x, y: y2 }, end: { x: room.x, y: room.y }, heightMeters: 2.55, thicknessMeters: .1 },
    ];
  });

  return {
    ...base,
    projectId: `manual-${Date.now()}`,
    property: { ...base.property, sourceType: "manual", confidence: .62, sourceUrl: undefined },
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      type: room.type,
      dimensions: { widthMeters: room.width, lengthMeters: room.length, heightMeters: 2.55 },
      position: { x: room.x, y: room.y, z: 0 },
      confidence: .65,
    })),
    walls,
    doors: [],
    windows: [],
    notes: [{ message: "Manually drawn approximation. Add and confirm openings and measurements before renovation planning.", severity: "warning" }],
  };
}
