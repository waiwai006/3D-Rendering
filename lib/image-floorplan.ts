import type { PropertyLayout } from "@/lib/layout-schema";

type Segment = { orientation: "h" | "v"; fixed: number; start: number; end: number; score: number };
type DetectedDoorSymbol = { xRatio: number; yRatio: number; swing: { hinge: "start" | "end"; direction: 1 | -1 }; confidence: number };
type DetectedWindowSymbol = { xRatio: number; yRatio: number; orientation: "h" | "v"; confidence: number };

function createImageProbe(image: ImageData) {
  const luminanceAt = (x: number, y: number) => {
    const clampedX = Math.max(0, Math.min(image.width - 1, Math.round(x)));
    const clampedY = Math.max(0, Math.min(image.height - 1, Math.round(y)));
    const index = (clampedY * image.width + clampedX) * 4;
    return image.data[index] * .299 + image.data[index + 1] * .587 + image.data[index + 2] * .114;
  };
  const isDark = (x: number, y: number, threshold = 145) => luminanceAt(x, y) < threshold;
  return { luminanceAt, isDark };
}

function detectDoorSymbols(image: ImageData): DetectedDoorSymbol[] {
  const { isDark, luminanceAt } = createImageProbe(image);
  const minSide = Math.min(image.width, image.height);
  const step = Math.max(3, Math.round(minSide * .012));
  const minRadius = Math.max(8, Math.round(minSide * .045));
  const maxRadius = Math.max(minRadius + 4, Math.round(minSide * .11));
  const margin = maxRadius + 4;
  const configs = [
    { sx: 1, sy: 1, swing: { hinge: "start" as const, direction: 1 as const } },
    { sx: -1, sy: 1, swing: { hinge: "end" as const, direction: -1 as const } },
    { sx: 1, sy: -1, swing: { hinge: "start" as const, direction: -1 as const } },
    { sx: -1, sy: -1, swing: { hinge: "end" as const, direction: 1 as const } },
  ];
  const candidates: Array<{ x: number; y: number; confidence: number; swing: DetectedDoorSymbol["swing"] }> = [];

  const sampleLineRatio = (x: number, y: number, dx: number, dy: number, length: number) => {
    let dark = 0;
    let total = 0;
    for (let distance = 0; distance <= length; distance += 2) {
      if (isDark(x + dx * distance, y + dy * distance, 140)) dark++;
      total++;
    }
    return dark / Math.max(1, total);
  };

  for (let y = margin; y < image.height - margin; y += step) {
    for (let x = margin; x < image.width - margin; x += step) {
      if (!isDark(x, y, 115)) continue;
      for (const config of configs) {
        const frameHorizontal = sampleLineRatio(x, y, config.sx, 0, Math.round(maxRadius * .55));
        const frameVertical = sampleLineRatio(x, y, 0, config.sy, Math.round(maxRadius * .55));
        if (frameHorizontal < .55 || frameVertical < .55) continue;

        let bestRadius = 0;
        let bestArcRatio = 0;
        for (let radius = minRadius; radius <= maxRadius; radius += 2) {
          let arcDark = 0;
          let arcTotal = 0;
          let interiorLight = 0;
          let interiorTotal = 0;
          for (let sample = 0; sample <= 10; sample++) {
            const angle = sample / 10 * Math.PI / 2;
            const px = x + config.sx * Math.cos(angle) * radius;
            const py = y + config.sy * Math.sin(angle) * radius;
            if (isDark(px, py, 145)) arcDark++;
            arcTotal++;

            const innerRadius = radius * .62;
            const ix = x + config.sx * Math.cos(angle) * innerRadius;
            const iy = y + config.sy * Math.sin(angle) * innerRadius;
            if (luminanceAt(ix, iy) > 165) interiorLight++;
            interiorTotal++;
          }
          const arcRatio = arcDark / Math.max(1, arcTotal);
          const interiorRatio = interiorLight / Math.max(1, interiorTotal);
          if (arcRatio > bestArcRatio && interiorRatio > .55) {
            bestArcRatio = arcRatio;
            bestRadius = radius;
          }
        }

        if (bestRadius === 0 || bestArcRatio < .6) continue;

        const outsideLight = luminanceAt(x - config.sx * bestRadius * .22, y - config.sy * bestRadius * .22);
        const insideLight = luminanceAt(x + config.sx * bestRadius * .55, y + config.sy * bestRadius * .55);
        if (insideLight <= outsideLight) continue;

        const confidence = Number(Math.min(.95, (bestArcRatio * .55 + frameHorizontal * .2 + frameVertical * .2 + Math.min(1, insideLight / 255) * .05)).toFixed(2));
        candidates.push({ x, y, confidence, swing: config.swing });
      }
    }
  }

  const chosen: typeof candidates = [];
  for (const candidate of candidates.sort((a, b) => b.confidence - a.confidence)) {
    const duplicate = chosen.some((other) => Math.hypot(candidate.x - other.x, candidate.y - other.y) < minRadius * .7);
    if (!duplicate) chosen.push(candidate);
    if (chosen.length >= 8) break;
  }
  return chosen.map((candidate) => ({ xRatio: Number((candidate.x / image.width).toFixed(3)), yRatio: Number((candidate.y / image.height).toFixed(3)), swing: candidate.swing, confidence: candidate.confidence }));
}

function nearestWallDoor(symbol: DetectedDoorSymbol, walls: PropertyLayout["walls"], width: number, length: number, index: number) {
  const x = symbol.xRatio * width;
  const y = symbol.yRatio * length;
  const scored = walls.map((wall) => {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const wallLength = Math.max(.001, Math.hypot(dx, dy));
    const projection = ((x - wall.start.x) * dx + (y - wall.start.y) * dy) / (wallLength * wallLength);
    const ratio = Math.min(.92, Math.max(.08, projection));
    const px = wall.start.x + dx * ratio;
    const py = wall.start.y + dy * ratio;
    return { wall, ratio, distance: Math.hypot(x - px, y - py), wallLength };
  }).filter((candidate) => candidate.wallLength > .85).sort((a, b) => a.distance - b.distance);
  const best = scored[0];
  if (!best || best.distance > Math.max(.55, Math.min(width, length) * .09)) return undefined;
  return {
    id: `estimated-door-${index + 1}`,
    wallId: best.wall.id,
    widthMeters: Number(Math.min(.92, Math.max(.72, best.wallLength * .14)).toFixed(2)),
    positionRatioOnWall: Number(best.ratio.toFixed(2)),
    opensTo: ["cropped-plan"],
    swing: symbol.swing,
  };
}

function detectWindowSymbols(image: ImageData): DetectedWindowSymbol[] {
  const results: DetectedWindowSymbol[] = [];
  const step = Math.max(8, Math.round(Math.min(image.width, image.height) * .03));
  const minDark = 120;
  const maxLight = 200;
  const { luminanceAt } = createImageProbe(image);
  const checkRect = (cx: number, cy: number, halfW: number, halfH: number, orientation: "h" | "v") => {
    let borderDark = 0;
    let borderTotal = 0;
    let centerLight = 0;
    let centerTotal = 0;
    for (let y = -halfH; y <= halfH; y += 2) {
      for (let x = -halfW; x <= halfW; x += 2) {
        const lum = luminanceAt(cx + x, cy + y);
        const onBorder = Math.abs(x) >= halfW - 2 || Math.abs(y) >= halfH - 2;
        if (onBorder) {
          borderTotal++;
          if (lum < minDark) borderDark++;
        } else {
          centerTotal++;
          if (lum > maxLight) centerLight++;
        }
      }
    }
    const borderRatio = borderDark / Math.max(1, borderTotal);
    const centerRatio = centerLight / Math.max(1, centerTotal);
    if (borderRatio > .52 && centerRatio > .48) {
      results.push({ xRatio: cx / image.width, yRatio: cy / image.height, orientation, confidence: Number(((borderRatio + centerRatio) / 2).toFixed(2)) });
    }
  };
  for (let cy = step; cy < image.height - step; cy += step) {
    for (let cx = step; cx < image.width - step; cx += step) {
      checkRect(cx, cy, Math.round(step * 1.8), Math.max(3, Math.round(step * .35)), "h");
      checkRect(cx, cy, Math.max(3, Math.round(step * .35)), Math.round(step * 1.8), "v");
    }
  }
  return results.filter((candidate, index, list) => index === list.findIndex((other) => Math.hypot(other.xRatio - candidate.xRatio, other.yRatio - candidate.yRatio) < .08 && other.orientation === candidate.orientation)).slice(0, 6);
}

function nearestWallWindow(symbol: DetectedWindowSymbol, walls: PropertyLayout["walls"], width: number, length: number, index: number) {
  const x = symbol.xRatio * width;
  const y = symbol.yRatio * length;
  const scored = walls.map((wall) => {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const wallLength = Math.max(.001, Math.hypot(dx, dy));
    const projection = ((x - wall.start.x) * dx + (y - wall.start.y) * dy) / (wallLength * wallLength);
    const ratio = Math.min(.9, Math.max(.1, projection));
    const px = wall.start.x + dx * ratio;
    const py = wall.start.y + dy * ratio;
    const wallOrientation = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
    const orientationPenalty = wallOrientation === symbol.orientation ? 0 : .7;
    return { wall, ratio, distance: Math.hypot(x - px, y - py) + orientationPenalty, wallLength };
  }).filter((candidate) => candidate.wallLength > .9).sort((a, b) => a.distance - b.distance);
  const best = scored[0];
  if (!best || best.distance > Math.max(.55, Math.min(width, length) * .09)) return undefined;
  return {
    id: `estimated-window-detected-${index + 1}`,
    wallId: best.wall.id,
    widthMeters: Number(Math.min(1.5, Math.max(.65, best.wallLength * .18)).toFixed(2)),
    heightMeters: 1.05,
    positionRatioOnWall: Number(best.ratio.toFixed(2)),
    sillHeightMeters: .9,
  };
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
  const fallbackWindows = outerWalls.slice(0, 1).map(({ wall, length }, index) => ({
    id: `estimated-window-${index + 1}`,
    wallId: wall.id,
    widthMeters: Number(Math.min(1.2, Math.max(.7, length * .2)).toFixed(2)),
    heightMeters: 1.05,
    positionRatioOnWall: .5,
    sillHeightMeters: .9,
  }));
  const detectedWindowSymbols = detectWindowSymbols(image);
  const inferredWindows = detectedWindowSymbols
    .map((symbol, index) => nearestWallWindow(symbol, walls, width, length, index))
    .filter((window): window is NonNullable<typeof window> => Boolean(window));
  const mergedWindows = (inferredWindows.length ? inferredWindows : fallbackWindows)
    .filter((window, index, list) => index === list.findIndex((other) => other.wallId === window.wallId && Math.abs(other.positionRatioOnWall - window.positionRatioOnWall) < .14));
  const detectedDoorSymbols = detectDoorSymbols(image);
  const inferredDoors = detectedDoorSymbols
    .map((symbol, index) => nearestWallDoor(symbol, walls, width, length, index))
    .filter((door): door is NonNullable<typeof door> => Boolean(door));
  const dedupedDoors = inferredDoors.filter((door, index, list) => index === list.findIndex((other) => other.wallId === door.wallId && Math.abs(other.positionRatioOnWall - door.positionRatioOnWall) < .12));
  const doorWall = outerWalls[outerWalls.length - 1]?.wall ?? walls[0];
  const doors = dedupedDoors.length ? dedupedDoors : doorWall ? [{
    id: "estimated-entry-door",
    wallId: doorWall.id,
    widthMeters: .82,
    positionRatioOnWall: .5,
    opensTo: ["cropped-plan"],
    swing: { hinge: "start" as const, direction: 1 as const },
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
    walls, doors, windows: mergedWindows, platforms,
    notes: [
      { message: detectedDoorSymbols.length || detectedWindowSymbols.length ? `Estimated from cropped image using line detection. ${detectedDoorSymbols.length} door swing mark${detectedDoorSymbols.length === 1 ? "" : "s"} and ${detectedWindowSymbols.length} window symbol${detectedWindowSymbols.length === 1 ? "" : "s"} were matched to nearby walls; verify visually.` : "Estimated from cropped image using line detection. Windows, doors and platform are inferred hints and require visual confirmation.", severity: "warning" },
      { message: "Room label hint: if the cropped plan text shows Living/客廳/客厅, Bedroom/睡房/臥室/卧室, Kitchen/廚房/厨房 or Bath/浴室/廁所/厕所, rename and reclassify the room accordingly.", severity: "info" },
    ],
  };
}
