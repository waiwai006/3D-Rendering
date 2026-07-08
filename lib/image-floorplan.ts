import type { PropertyLayout } from "@/lib/layout-schema";

type Segment = { orientation: "h" | "v"; fixed: number; start: number; end: number; score: number };
type DetectedDoorSymbol = { ratio: number; swing: { hinge: "start" | "end"; direction: 1 | -1 }; confidence: number };

function detectDoorSymbol(image: ImageData): DetectedDoorSymbol | undefined {
  const zones = [
    { key: "top-left", x0: 0, y0: 0, x1: .32, y1: .32, ratio: .18, swing: { hinge: "start" as const, direction: 1 as const } },
    { key: "top-right", x0: .68, y0: 0, x1: 1, y1: .32, ratio: .82, swing: { hinge: "end" as const, direction: -1 as const } },
    { key: "bottom-left", x0: 0, y0: .68, x1: .32, y1: 1, ratio: .18, swing: { hinge: "start" as const, direction: -1 as const } },
    { key: "bottom-right", x0: .68, y0: .68, x1: 1, y1: 1, ratio: .82, swing: { hinge: "end" as const, direction: 1 as const } },
  ];
  const scores = zones.map((zone) => {
    let darkPixels = 0;
    let curvedBandPixels = 0;
    let total = 0;
    const x0 = Math.floor(image.width * zone.x0);
    const x1 = Math.floor(image.width * zone.x1);
    const y0 = Math.floor(image.height * zone.y0);
    const y1 = Math.floor(image.height * zone.y1);
    const cx = zone.x0 < .5 ? x0 : x1;
    const cy = zone.y0 < .5 ? y0 : y1;
    const minRadius = Math.min(image.width, image.height) * .055;
    const maxRadius = Math.min(image.width, image.height) * .24;
    for (let y = y0; y < y1; y += 2) {
      for (let x = x0; x < x1; x += 2) {
        const index = (y * image.width + x) * 4;
        const luminance = image.data[index] * .299 + image.data[index + 1] * .587 + image.data[index + 2] * .114;
        if (image.data[index + 3] > 80 && luminance < 150) {
          darkPixels++;
          const radius = Math.hypot(x - cx, y - cy);
          if (radius >= minRadius && radius <= maxRadius) curvedBandPixels++;
        }
        total++;
      }
    }
    return { ...zone, score: curvedBandPixels * 2 + darkPixels * .2, density: darkPixels / Math.max(1, total) };
  }).sort((a, b) => b.score - a.score);
  const best = scores[0];
  if (!best || best.score < 8 || best.density < .008) return undefined;
  return { ratio: best.ratio, swing: best.swing, confidence: Math.min(.85, best.score / 80) };
}

export function buildEstimatedLayoutFromCrop(image: ImageData, base: PropertyLayout): PropertyLayout {
  const maxGridSide = 48;
  const minGridSide = 16;
  const aspect = image.width / Math.max(1, image.height);
  const columns = aspect >= 1 ? maxGridSide : Math.max(minGridSide, Math.round(maxGridSide * aspect));
  const rows = aspect >= 1 ? Math.max(minGridSide, Math.round(maxGridSide / aspect)) : maxGridSide;
  const dark = Array.from({ length: rows }, () => Array(columns).fill(false));

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < columns; gx++) {
      const x0 = Math.floor(gx * image.width / columns);
      const x1 = Math.max(x0 + 1, Math.floor((gx + 1) * image.width / columns));
      const y0 = Math.floor(gy * image.height / rows);
      const y1 = Math.max(y0 + 1, Math.floor((gy + 1) * image.height / rows));
      const cx = Math.min(image.width - 1, Math.max(0, Math.floor((x0 + x1) / 2)));
      const cy = Math.min(image.height - 1, Math.max(0, Math.floor((y0 + y1) / 2)));
      let count = 0;
      let darkCount = 0;
      for (let y = Math.max(0, cy - 1); y <= Math.min(image.height - 1, cy + 1); y++) for (let x = Math.max(0, cx - 1); x <= Math.min(image.width - 1, cx + 1); x++) {
        const index = (y * image.width + x) * 4;
        const luminance = image.data[index] * .299 + image.data[index + 1] * .587 + image.data[index + 2] * .114;
        if (image.data[index + 3] > 80 && luminance < 125) darkCount++;
        count++;
      }
      dark[gy][gx] = darkCount / Math.max(count, 1) > .22;
    }
  }

  const segments: Segment[] = [];
  const minimumRun = Math.max(3, Math.round(Math.min(columns, rows) * .08));
  for (let y = 0; y < rows; y++) {
    let start = -1;
    for (let x = 0; x <= columns; x++) {
      if (x < columns && dark[y][x]) { if (start < 0) start = x; }
      else if (start >= 0) { if (x - start >= minimumRun) segments.push({ orientation: "h", fixed: y, start, end: x, score: x - start }); start = -1; }
    }
  }
  for (let x = 0; x < columns; x++) {
    let start = -1;
    for (let y = 0; y <= rows; y++) {
      if (y < rows && dark[y][x]) { if (start < 0) start = y; }
      else if (start >= 0) { if (y - start >= minimumRun) segments.push({ orientation: "v", fixed: x, start, end: y, score: y - start }); start = -1; }
    }
  }

  const chosen: Segment[] = [];
  for (const segment of segments.sort((a, b) => b.score - a.score)) {
    const duplicate = chosen.some((other) => other.orientation === segment.orientation && Math.abs(other.fixed - segment.fixed) <= 2 && Math.abs(other.start - segment.start) <= 4 && Math.abs(other.end - segment.end) <= 4);
    if (!duplicate) chosen.push(segment);
    if (chosen.length >= 20) break;
  }

  const scale = 10 / Math.max(columns, rows);
  const walls = chosen.map((segment, index) => segment.orientation === "h" ? {
    id: `detected-wall-${index}`,
    start: { x: segment.start * scale, y: segment.fixed * scale },
    end: { x: segment.end * scale, y: segment.fixed * scale },
    heightMeters: 2.55, thicknessMeters: .1,
  } : {
    id: `detected-wall-${index}`,
    start: { x: segment.fixed * scale, y: segment.start * scale },
    end: { x: segment.fixed * scale, y: segment.end * scale },
    heightMeters: 2.55, thicknessMeters: .1,
  });
  const width = columns * scale;
  const length = rows * scale;
  const area = width * length;
  const inferredRoomType = area > 13 ? "living" : area > 7 ? "bedroom" : "other";
  const inferredRoomName = inferredRoomType === "living" ? "Inferred living / dining area" : inferredRoomType === "bedroom" ? "Inferred bedroom area" : "Cropped plan area";
  if (!walls.length) walls.push(
    { id: "estimated-north", start: { x: 0, y: 0 }, end: { x: width, y: 0 }, heightMeters: 2.55, thicknessMeters: .1 },
    { id: "estimated-east", start: { x: width, y: 0 }, end: { x: width, y: length }, heightMeters: 2.55, thicknessMeters: .1 },
    { id: "estimated-south", start: { x: width, y: length }, end: { x: 0, y: length }, heightMeters: 2.55, thicknessMeters: .1 },
    { id: "estimated-west", start: { x: 0, y: length }, end: { x: 0, y: 0 }, heightMeters: 2.55, thicknessMeters: .1 },
  );
  const wallLength = (wall: typeof walls[number]) => Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  const outerWalls = walls
    .map((wall) => ({ wall, length: wallLength(wall) }))
    .filter(({ length }) => length > Math.min(width, length) * .35)
    .sort((a, b) => b.length - a.length);
  const windows = outerWalls.slice(0, 3).map(({ wall, length }, index) => ({
    id: `estimated-window-${index + 1}`,
    wallId: wall.id,
    widthMeters: Number(Math.min(1.8, Math.max(.8, length * .28)).toFixed(2)),
    heightMeters: 1.05,
    positionRatioOnWall: index === 0 ? .32 : index === 1 ? .68 : .5,
    sillHeightMeters: .9,
  }));
  const detectedDoorSymbol = detectDoorSymbol(image);
  const doorWall = outerWalls[outerWalls.length - 1]?.wall ?? walls[0];
  const doors = doorWall ? [{
    id: "estimated-entry-door",
    wallId: doorWall.id,
    widthMeters: .82,
    positionRatioOnWall: detectedDoorSymbol?.ratio ?? .5,
    opensTo: ["cropped-plan"],
    swing: detectedDoorSymbol?.swing ?? { hinge: "start" as const, direction: 1 as const },
  }] : [];
  const platforms = width > 2.4 && length > 2.4 ? [{
    id: "estimated-platform-1",
    roomId: "cropped-plan",
    position: { x: Number((width * .62).toFixed(2)), y: Number((length * .62).toFixed(2)) },
    dimensions: { widthMeters: Number((width * .26).toFixed(2)), lengthMeters: Number((length * .18).toFixed(2)), heightMeters: .18 },
  }] : [];

  return {
    ...base,
    projectId: `image-estimate-${Date.now()}`,
    property: { ...base.property, sourceType: "manual", confidence: .32 },
    rooms: [{ id: "cropped-plan", name: inferredRoomName, type: inferredRoomType, dimensions: { widthMeters: width, lengthMeters: length, heightMeters: 2.55 }, position: { x: 0, y: 0, z: 0 }, confidence: .3 }],
    walls, doors, windows, platforms,
    notes: [
      { message: detectedDoorSymbol ? "Estimated from cropped image using line detection. A hinged-door swing mark was detected and used for the entry door direction; verify visually." : "Estimated from cropped image using line detection. Windows, doors and platform are inferred hints and require visual confirmation.", severity: "warning" },
      { message: "Room label hint: if the cropped plan text shows Living/客廳/客厅, Bedroom/睡房/臥室/卧室, Kitchen/廚房/厨房 or Bath/浴室/廁所/厕所, rename and reclassify the room accordingly.", severity: "info" },
    ],
  };
}
