import type { PropertyLayout } from "@/lib/layout-schema";

type Segment = { orientation: "h" | "v"; fixed: number; start: number; end: number; score: number };

export function buildEstimatedLayoutFromCrop(image: ImageData, base: PropertyLayout): PropertyLayout {
  const columns = 80;
  const rows = Math.max(40, Math.round(columns * image.height / image.width));
  const dark = Array.from({ length: rows }, () => Array(columns).fill(false));

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < columns; gx++) {
      const x0 = Math.floor(gx * image.width / columns);
      const x1 = Math.max(x0 + 1, Math.floor((gx + 1) * image.width / columns));
      const y0 = Math.floor(gy * image.height / rows);
      const y1 = Math.max(y0 + 1, Math.floor((gy + 1) * image.height / rows));
      let count = 0;
      let darkCount = 0;
      for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) {
        const index = (y * image.width + x) * 4;
        const luminance = image.data[index] * .299 + image.data[index + 1] * .587 + image.data[index + 2] * .114;
        if (image.data[index + 3] > 80 && luminance < 125) darkCount++;
        count++;
      }
      dark[gy][gx] = darkCount / Math.max(count, 1) > .22;
    }
  }

  const segments: Segment[] = [];
  for (let y = 0; y < rows; y++) {
    let start = -1;
    for (let x = 0; x <= columns; x++) {
      if (x < columns && dark[y][x]) { if (start < 0) start = x; }
      else if (start >= 0) { if (x - start >= 7) segments.push({ orientation: "h", fixed: y, start, end: x, score: x - start }); start = -1; }
    }
  }
  for (let x = 0; x < columns; x++) {
    let start = -1;
    for (let y = 0; y <= rows; y++) {
      if (y < rows && dark[y][x]) { if (start < 0) start = y; }
      else if (start >= 0) { if (y - start >= 7) segments.push({ orientation: "v", fixed: x, start, end: y, score: y - start }); start = -1; }
    }
  }

  const chosen: Segment[] = [];
  for (const segment of segments.sort((a, b) => b.score - a.score)) {
    const duplicate = chosen.some((other) => other.orientation === segment.orientation && Math.abs(other.fixed - segment.fixed) <= 2 && Math.abs(other.start - segment.start) <= 4 && Math.abs(other.end - segment.end) <= 4);
    if (!duplicate) chosen.push(segment);
    if (chosen.length >= 28) break;
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
  if (!walls.length) walls.push(
    { id: "estimated-north", start: { x: 0, y: 0 }, end: { x: width, y: 0 }, heightMeters: 2.55, thicknessMeters: .1 },
    { id: "estimated-east", start: { x: width, y: 0 }, end: { x: width, y: length }, heightMeters: 2.55, thicknessMeters: .1 },
    { id: "estimated-south", start: { x: width, y: length }, end: { x: 0, y: length }, heightMeters: 2.55, thicknessMeters: .1 },
    { id: "estimated-west", start: { x: 0, y: length }, end: { x: 0, y: 0 }, heightMeters: 2.55, thicknessMeters: .1 },
  );

  return {
    ...base,
    projectId: `image-estimate-${Date.now()}`,
    property: { ...base.property, sourceType: "manual", confidence: .32 },
    rooms: [{ id: "cropped-plan", name: "Cropped plan area", type: "other", dimensions: { widthMeters: width, lengthMeters: length, heightMeters: 2.55 }, position: { x: 0, y: 0, z: 0 }, confidence: .3 }],
    walls, doors: [], windows: [],
    notes: [{ message: "Estimated from cropped image using line detection. Scale, rooms, openings and wall types require user correction.", severity: "warning" }],
  };
}
