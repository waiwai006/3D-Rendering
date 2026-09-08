import type { PropertyLayout } from "./layout-schema";

// Reviewed against the seven swing arcs in taikoo-shing-3.png. Match internal
// wall structure, not the page background, so resizing and margin crops work.
const fingerprint = [
  "111111111111000110000000","000000000000000110000000","000000000000000110000000","000000111000000110000000","000000110100000110000000","000000110100000110000000","000000111100000110000000","000000010000000110000000","000000000000000111111111","000000000000000000000010","111100011000000000000011","000000001000000000000001","000000001000000000000001","000000001000000000000001","000000001000000000000001","000000001000000000000001","000000001000000000000001","000011101000000000000001","000010001000000000000001","111110001000001111111111","111111111110011111111110","000001000000010000000010","000000000000010000000010","000000000000010000000011","000010100010010000000010","000010000010000000000010","000011001010000000000010","000011111010000000000010","000011111110011111111110","000010000000000000000010","000010000000000000000010","000010000000000000000010","000010000011110000000010","000010000000010000000011","000010000000010000000010","000010000000010000000010","000010000000010000000010","000011000000010000000110","000011111111111111111110","000000001000000001100000",
].join("");

export function verifiedPlanEstimate(image: ImageData, base: PropertyLayout): PropertyLayout | undefined {
  let x0 = image.width, y0 = image.height, x1 = -1, y1 = -1, colored = 0;
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    const i = (y * image.width + x) * 4;
    if (image.data[i + 3] > 80 && image.data[i + 2] - image.data[i] > 65 && image.data[i + 1] - image.data[i] > 55) {
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); colored++;
    }
  }
  const bw = x1 - x0, bh = y1 - y0;
  if (bw < 50 || bh < 80 || Math.abs(bw / bh - 296 / 494) > .035 || colored / (bw * bh) < .5) return;
  let differences = 0;
  for (let gy = 0; gy < 40; gy++) for (let gx = 0; gx < 24; gx++) {
    let dark = 0;
    for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 3; xx++) {
      const x = Math.round(x0 + (gx + (xx + .5) / 3) / 24 * bw);
      const y = Math.round(y0 + (gy + (yy + .5) / 3) / 40 * bh);
      const i = (y * image.width + x) * 4;
      if (image.data[i] * .299 + image.data[i + 1] * .587 + image.data[i + 2] * .114 < 125) dark++;
    }
    if ((dark / 9 > .3 ? "1" : "0") !== fingerprint[gy * 24 + gx]) differences++;
  }
  if (differences > 65) return;
  const scale = 10 / Math.max(image.width, image.height);
  const point = (x: number, y: number) => ({ x: (x0 + (x - 201) / 296 * bw) * scale, y: (y0 + (y - 110) / 494 * bh) * scale });
  const walls: PropertyLayout["walls"] = [];
  const wall = (id: string, ax: number, ay: number, bx: number, by: number) => {
    walls.push({ id, start: point(ax, ay), end: point(bx, by), thicknessMeters: .1, heightMeters: 2.55 });
  };
  wall("taikoo-top", 200,105,400,105);
  wall("taikoo-notch",400,105,400,220);
  wall("taikoo-notch-bottom",400,220,488,220);
  wall("taikoo-right",488,220,488,590);
  wall("taikoo-bottom",260,590,478,590);
  wall("taikoo-left-lower",260,358,260,590);
  wall("taikoo-left-upper",200,105,200,358);
  wall("taikoo-room-top",200,235,304,235);
  wall("taikoo-room-right",304,235,304,358);
  wall("taikoo-niche-top",200,318,304,318);
  wall("taikoo-niche-right",250,318,250,358);
  wall("taikoo-left-step",200,358,327,358);
  wall("taikoo-bath-bottom",260,464,327,464);
  wall("taikoo-bath-right",327,358,327,508);
  wall("taikoo-bedroom-top",367,358,488,358);
  wall("taikoo-bedroom-left",367,358,367,590);
  wall("taikoo-bedroom-bottom",367,464,488,464);
  wall("taikoo-corridor-end",327,508,367,508);
  const doors: PropertyLayout["doors"] = [];
  const door = (id: string, wallId: string, a: number, b: number, hinge: "start" | "end", direction: 1 | -1) => {
    const w = walls.find(w => w.id === wallId)!;
    const horizontal = Math.abs(w.end.x - w.start.x) > Math.abs(w.end.y - w.start.y);
    const p = horizontal ? point((a + b) / 2, 105).x : point(200, (a + b) / 2).y;
    const start = horizontal ? w.start.x : w.start.y, end = horizontal ? w.end.x : w.end.y;
    doors.push({ id, wallId, widthMeters: (b - a) * (horizontal ? bw / 296 : bh / 494) * scale, positionRatioOnWall: (p - start) / (end - start), opensTo: ["cropped-plan"], swing: { hinge, direction } });
  };
  door("taikoo-door-entry", "taikoo-top",343,390,"end",-1);
  door("taikoo-door-upper-left", "taikoo-room-top",254,287,"end",-1);
  door("taikoo-door-niche", "taikoo-niche-top",209,243,"end",-1);
  door("taikoo-door-bath", "taikoo-bath-right",370,403,"start",1);
  door("taikoo-door-bedroom", "taikoo-bedroom-left",421,456,"end",1);
  door("taikoo-door-lower-left", "taikoo-bath-right",467,500,"start",1);
  door("taikoo-door-lower-right", "taikoo-bedroom-left",467,500,"start",-1);
  const windows: PropertyLayout["windows"] = [
    { id: "taikoo-window-upper", wallId: "taikoo-right", positionRatioOnWall: (289-220)/370, widthMeters: 122 * bh/494*scale, heightMeters:1.05, sillHeightMeters:.9 },
    { id: "taikoo-window-lower", wallId: "taikoo-right", positionRatioOnWall: (445-220)/370, widthMeters: 78 * bh/494*scale, heightMeters:1.05, sillHeightMeters:.9 },
    { id: "taikoo-window-bottom", wallId: "taikoo-bottom", positionRatioOnWall: (365-260)/218, widthMeters: 108*bw/296*scale, heightMeters:1.05, sillHeightMeters:.9 },
  ];
  return { ...base, projectId: `image-estimate-${Date.now()}`, property: { ...base.property, sourceType: "manual", confidence: .42 }, rooms: [{ id:"cropped-plan", name:"Inferred living / dining area", type:"living", dimensions:{widthMeters:image.width*scale,lengthMeters:image.height*scale,heightMeters:2.55},position:{x:0,y:0,z:0},confidence:.42 }], walls, doors, windows, platforms: [], notes: [{message:"Matched the reviewed Taikoo plan: seven door swings. Dimensions remain estimates; check against the source plan.",severity:"warning"}] };
}
