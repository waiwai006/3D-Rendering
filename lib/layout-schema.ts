export type SourceType = "official" | "secondary" | "user_photos" | "manual";
export type RoomType = "living" | "bedroom" | "kitchen" | "bathroom" | "corridor" | "balcony" | "storage" | "other";

export interface Point2D { x: number; y: number }

export interface LayoutRoom {
  id: string;
  name: string;
  type: RoomType;
  dimensions: { widthMeters: number; lengthMeters: number; heightMeters: number };
  /** x/y are floor-plan coordinates; z is floor elevation. */
  position: { x: number; y: number; z: number };
  confidence: number;
}

export interface LayoutWall {
  id: string;
  start: Point2D;
  end: Point2D;
  heightMeters: number;
  thicknessMeters: number;
}

export interface LayoutDoor {
  id: string;
  wallId: string;
  widthMeters: number;
  positionRatioOnWall: number;
  opensTo: string[];
}

export interface LayoutWindow {
  id: string;
  wallId: string;
  widthMeters: number;
  heightMeters: number;
  positionRatioOnWall: number;
  sillHeightMeters?: number;
}

export interface LayoutPlatform {
  id: string;
  roomId?: string;
  position: Point2D;
  dimensions: { widthMeters: number; lengthMeters: number; heightMeters: number };
}

export interface PropertyLayout {
  schemaVersion: "1.0";
  projectId: string;
  property: { name: string; address: string; sourceType: SourceType; sourceUrl?: string; confidence: number };
  unit: { saleableAreaSqFt?: number; tower?: string; block?: string; floor?: string; flat?: string; orientation?: string };
  rooms: LayoutRoom[];
  walls: LayoutWall[];
  doors: LayoutDoor[];
  windows: LayoutWindow[];
  platforms?: LayoutPlatform[];
  notes: { message: string; severity: "info" | "warning" | "error" }[];
  furnishings?: import("./furnishing-catalog").PlacedFurnishing[];
}

export function validateLayout(layout: PropertyLayout): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const room of layout.rooms) {
    if (ids.has(room.id)) errors.push(`Duplicate room id: ${room.id}`);
    ids.add(room.id);
    if (!Number.isFinite(room.dimensions.widthMeters) || room.dimensions.widthMeters <= 0) errors.push(`${room.name}: width must be positive.`);
    if (!Number.isFinite(room.dimensions.lengthMeters) || room.dimensions.lengthMeters <= 0) errors.push(`${room.name}: length must be positive.`);
  }
  const walls = new Map(layout.walls.map((wall) => [wall.id, wall]));
  for (const opening of [...layout.doors, ...layout.windows]) {
    const wall = walls.get(opening.wallId);
    if (!wall) { errors.push(`${opening.id}: referenced wall does not exist.`); continue; }
    const wallLength = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    if (opening.widthMeters <= 0 || opening.widthMeters > wallLength) errors.push(`${opening.id}: opening width does not fit its wall.`);
    if (opening.positionRatioOnWall < 0 || opening.positionRatioOnWall > 1) errors.push(`${opening.id}: position must be on its wall.`);
  }
  for (const item of layout.furnishings ?? []) {
    if (!ids.has(item.roomId)) errors.push(`${item.id}: referenced room does not exist.`);
    if (!Number.isFinite(item.position.x) || !Number.isFinite(item.position.y) || !Number.isFinite(item.rotationDegrees)) errors.push(`${item.id}: placement must use finite coordinates.`);
  }
  for (const platform of layout.platforms ?? []) {
    if (platform.roomId && !ids.has(platform.roomId)) errors.push(`${platform.id}: referenced room does not exist.`);
    if (!Number.isFinite(platform.position.x) || !Number.isFinite(platform.position.y) || platform.dimensions.widthMeters <= 0 || platform.dimensions.lengthMeters <= 0 || platform.dimensions.heightMeters <= 0) errors.push(`${platform.id}: platform dimensions must be positive.`);
  }
  return errors;
}

export function isPropertyLayout(value: unknown): value is PropertyLayout {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PropertyLayout>;
  if (candidate.schemaVersion !== "1.0" || !candidate.property || !candidate.unit) return false;
  if (!Array.isArray(candidate.rooms) || !Array.isArray(candidate.walls) || !Array.isArray(candidate.doors) || !Array.isArray(candidate.windows) || !Array.isArray(candidate.notes)) return false;
  if (candidate.furnishings !== undefined && (!Array.isArray(candidate.furnishings) || !candidate.furnishings.every((item) => Boolean(item && typeof item.id === "string" && typeof item.catalogId === "string" && typeof item.roomId === "string" && item.position && Number.isFinite(item.position.x) && Number.isFinite(item.position.y) && Number.isFinite(item.rotationDegrees))))) return false;
  if (candidate.platforms !== undefined && (!Array.isArray(candidate.platforms) || !candidate.platforms.every((platform) => Boolean(platform && typeof platform.id === "string" && platform.position && platform.dimensions)))) return false;
  return candidate.rooms.every((room) => Boolean(room && typeof room.id === "string" && room.dimensions && room.position))
    && candidate.walls.every((wall) => Boolean(wall && typeof wall.id === "string" && wall.start && wall.end));
}

export const SOURCE_LABELS: Record<SourceType, string> = {
  official: "Official layout",
  secondary: "Secondary source",
  user_photos: "Estimated from photos",
  manual: "User-created layout",
};

export const ROOM_LABELS: Record<RoomType, string> = {
  living: "Living / dining", bedroom: "Bedroom", kitchen: "Kitchen", bathroom: "Bathroom",
  corridor: "Corridor", balcony: "Balcony", storage: "Storage", other: "Other",
};
