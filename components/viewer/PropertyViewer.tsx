"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { LayoutWall, PropertyLayout } from "@/lib/layout-schema";
import { catalogItem, type FurnishingCatalogItem, type PlacedFurnishing } from "@/lib/furnishing-catalog";
import { decorStyleById, type DecorStyle } from "@/lib/decor-styles";

const ROOM_COLORS = { living: "#dbcdb8", bedroom: "#d8d8ce", kitchen: "#c8d4ce", bathroom: "#b9cbd1", corridor: "#d6cec2", balcony: "#c4d8cf", storage: "#d1ccc4", other: "#d3d0ca" };

function tone(color: string, amount = 0) {
  const base = new THREE.Color(color);
  const target = amount >= 0 ? new THREE.Color("#ffffff") : new THREE.Color("#000000");
  return `#${base.lerp(target, Math.min(Math.abs(amount), 1)).getHexString()}`;
}

function FloorPattern({ room, style }: { room: PropertyLayout["rooms"][number]; style: DecorStyle }) {
  const { widthMeters: w, lengthMeters: l } = room.dimensions;
  const pieces: React.ReactNode[] = [];
  if (style.render.floorPattern === "light-wood" || style.render.floorPattern === "mid-wood" || style.render.floorPattern === "dark-wood" || style.render.floorPattern === "soft-cream") {
    const plankColor = tone(style.palette.floor, style.render.floorPattern === "dark-wood" ? -.1 : .08);
    const plankCount = Math.max(4, Math.floor(w / .35));
    for (let index = 0; index < plankCount; index += 1) {
      const x = -w / 2 + (index + .5) * (w / plankCount);
      pieces.push(<mesh key={`plank-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, .0185, 0]}><planeGeometry args={[w / plankCount - .015, l - .04]} /><meshStandardMaterial color={plankColor} roughness={.92} /></mesh>);
    }
  } else if (style.render.floorPattern === "stone-tile") {
    const tileColor = tone(style.palette.floor, .06);
    const groutColor = tone(style.palette.floor, -.22);
    const cols = Math.max(2, Math.floor(w / .9));
    const rows = Math.max(2, Math.floor(l / .9));
    for (let c = 0; c < cols; c += 1) {
      for (let r = 0; r < rows; r += 1) {
        pieces.push(<mesh key={`tile-${c}-${r}`} rotation={[-Math.PI / 2, 0, 0]} position={[-w / 2 + (c + .5) * (w / cols), .0185, -l / 2 + (r + .5) * (l / rows)]}><planeGeometry args={[w / cols - .03, l / rows - .03]} /><meshStandardMaterial color={(c + r) % 2 === 0 ? tileColor : tone(tileColor, -.04)} roughness={.78} /></mesh>);
      }
    }
    pieces.push(<gridHelper key="tile-grid" args={[Math.max(w, l), Math.max(cols, rows), groutColor, groutColor]} position={[0, .02, 0]} />);
  } else if (style.render.floorPattern === "polished-concrete") {
    pieces.push(<mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .0185, 0]}><planeGeometry args={[w - .05, l - .05]} /><meshStandardMaterial color={tone(style.palette.floor, -.06)} roughness={.98} /></mesh>);
    for (let index = 1; index < 4; index += 1) {
      pieces.push(<mesh key={`seam-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, .019, -l / 2 + (l * index) / 4]}><planeGeometry args={[w - .05, .02]} /><meshStandardMaterial color={tone(style.palette.floor, -.2)} roughness={1} /></mesh>);
    }
  }
  return <>{pieces}</>;
}

function CeilingLights({ room, style }: { room: PropertyLayout["rooms"][number]; style: DecorStyle }) {
  const { widthMeters: w, lengthMeters: l, heightMeters: h } = room.dimensions;
  if (style.render.lighting === "track-black") {
    return <group position={[room.position.x + w / 2, h - .18, room.position.y + l / 2]}>
      <mesh castShadow><boxGeometry args={[Math.max(.8, w * .7), .05, .06]} /><meshStandardMaterial color="#202426" metalness={.45} roughness={.5} /></mesh>
      {[-.28, 0, .28].map((ratio) => <mesh key={ratio} position={[ratio * w, -.08, 0]} castShadow><cylinderGeometry args={[.04, .04, .18, 18]} /><meshStandardMaterial color="#202426" metalness={.45} roughness={.5} emissive="#ffd9b2" emissiveIntensity={.16} /></mesh>)}
    </group>;
  }
  if (style.render.lighting === "cove-warm") {
    return <group position={[room.position.x + w / 2, h - .08, room.position.y + l / 2]}>
      <mesh><boxGeometry args={[w * .82, .03, .05]} /><meshStandardMaterial color="#f6d3aa" emissive="#f6d3aa" emissiveIntensity={.65} /></mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[l * .82, .03, .05]} /><meshStandardMaterial color="#f6d3aa" emissive="#f6d3aa" emissiveIntensity={.65} /></mesh>
    </group>;
  }
  if (style.render.lighting === "linear-smart") {
    return <group position={[room.position.x + w / 2, h - .12, room.position.y + l / 2]}>
      <mesh><boxGeometry args={[Math.max(.9, w * .72), .03, .08]} /><meshStandardMaterial color="#dcecf2" emissive="#dcecf2" emissiveIntensity={.8} /></mesh>
      <mesh rotation={[0, Math.PI / 2, 0]} position={[0, -.03, 0]}><boxGeometry args={[Math.max(.9, l * .42), .02, .06]} /><meshStandardMaterial color="#c5ebff" emissive="#c5ebff" emissiveIntensity={.7} /></mesh>
    </group>;
  }
  if (style.render.lighting === "paper-pendant") {
    return <group position={[room.position.x + w / 2, h - .35, room.position.y + l / 2]}>
      <mesh castShadow><sphereGeometry args={[.24, 18, 18]} /><meshStandardMaterial color="#f7efe2" emissive="#f7efe2" emissiveIntensity={.35} roughness={.95} /></mesh>
      <mesh position={[0, .23, 0]}><boxGeometry args={[.015, .26, .015]} /><meshStandardMaterial color="#a59688" /></mesh>
    </group>;
  }
  const positions = [
    [-w * .22, h - .14, -l * .22],
    [w * .22, h - .14, -l * .22],
    [-w * .22, h - .14, l * .22],
    [w * .22, h - .14, l * .22],
  ] as const;
  return <group position={[room.position.x + w / 2, 0, room.position.y + l / 2]}>
    {positions.map(([x, y, z], index) => <mesh key={index} position={[x, y, z]}><cylinderGeometry args={[.11, .11, .03, 24]} /><meshStandardMaterial color="#fff4d8" emissive="#fff4d8" emissiveIntensity={.72} /></mesh>)}
  </group>;
}

function AccentFeature({ room, style }: { room: PropertyLayout["rooms"][number]; style: DecorStyle }) {
  const { widthMeters: w, lengthMeters: l, heightMeters: h } = room.dimensions;
  if (room.type === "kitchen") {
    if (style.render.kitchenCue === "open-island") {
      return <group position={[room.position.x + w / 2, 0, room.position.y + l / 2]}>
        <mesh position={[0, .46, 0]} castShadow receiveShadow><boxGeometry args={[Math.min(1.35, w * .4), .92, Math.min(.68, l * .24)]} /><meshStandardMaterial color={tone(style.palette.accent, .12)} roughness={.65} /></mesh>
        <mesh position={[0, .95, 0]} castShadow><boxGeometry args={[Math.min(1.45, w * .44), .06, Math.min(.78, l * .28)]} /><meshStandardMaterial color={tone(style.palette.wall, .18)} roughness={.42} metalness={.08} /></mesh>
      </group>;
    }
    if (style.render.kitchenCue === "metal-shelf") {
      return <group position={[room.position.x + w - .32, .85, room.position.y + l / 2]}>
        {[0, .42, .84].map((y) => <mesh key={y} position={[0, y, 0]} castShadow><boxGeometry args={[.08, .02, Math.max(.7, l * .55)]} /><meshStandardMaterial color="#22282a" metalness={.42} roughness={.55} /></mesh>)}
        {[-.45, .45].map((z) => <mesh key={z} position={[0, .42, z]} castShadow><boxGeometry args={[.08, .84, .02]} /><meshStandardMaterial color="#22282a" metalness={.42} roughness={.55} /></mesh>)}
      </group>;
    }
    if (style.render.kitchenCue === "hotel-pantry") {
      return <mesh position={[room.position.x + w - .2, h / 2, room.position.y + l / 2]} castShadow receiveShadow><boxGeometry args={[.22, h - .1, Math.max(.9, l * .55)]} /><meshStandardMaterial color={tone(style.palette.accent, -.18)} roughness={.75} /></mesh>;
    }
  }
  if (room.type === "living" || room.type === "bedroom") {
    if (style.render.wallFinish === "panelled") {
      return <group position={[room.position.x + w / 2, 0, room.position.y + .08]}>
        {[...Array(Math.max(4, Math.floor(w / .28))).keys()].map((index) => <mesh key={index} position={[-w / 2 + .12 + index * .24, h / 2, 0]}><boxGeometry args={[.08, h - .2, .04]} /><meshStandardMaterial color={tone(style.palette.accent, -.12)} roughness={.8} /></mesh>)}
      </group>;
    }
    if (style.render.wallFinish === "concrete") {
      return <mesh position={[room.position.x + w / 2, h / 2, room.position.y + .04]}><boxGeometry args={[w * .75, h - .2, .03]} /><meshStandardMaterial color={tone(style.palette.wall, -.08)} roughness={.98} /></mesh>;
    }
  }
  return null;
}

function RoomFloor({ room, active, floorColor, style, onSelect, onFloorPoint, onFloorHover, onFloorDragStart, onFloorDragEnd }: { room: PropertyLayout["rooms"][number]; active: boolean; floorColor?: string; style: DecorStyle; onSelect: () => void; onFloorPoint?: (x: number, z: number) => void; onFloorHover?: (x: number, z: number) => void; onFloorDragStart?: (x: number, z: number) => void; onFloorDragEnd?: (x: number, z: number) => void }) {
  const { widthMeters: w, lengthMeters: l } = room.dimensions;
  const pointerStart = useRef<{ x: number; z: number } | undefined>(undefined);
  const suppressClick = useRef(false);
  return (
    <group position={[room.position.x + w / 2, room.position.z, room.position.y + l / 2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .015, 0]} receiveShadow onPointerDown={(event) => { event.stopPropagation(); onSelect(); pointerStart.current = { x: event.point.x, z: event.point.z }; suppressClick.current = false; onFloorDragStart?.(event.point.x, event.point.z); }} onPointerMove={(event) => { event.stopPropagation(); onFloorHover?.(event.point.x, event.point.z); }} onPointerUp={(event) => { event.stopPropagation(); const start = pointerStart.current; pointerStart.current = undefined; if (!start) return; const distance = Math.hypot(event.point.x - start.x, event.point.z - start.z); if (distance > .25) { suppressClick.current = true; onFloorDragEnd?.(event.point.x, event.point.z); return; } suppressClick.current = true; onFloorPoint?.(event.point.x, event.point.z); }} onClick={(event) => { event.stopPropagation(); onSelect(); if (suppressClick.current) { suppressClick.current = false; return; } onFloorPoint?.(event.point.x, event.point.z); }}>
        <planeGeometry args={[w - .04, l - .04]} />
        <meshStandardMaterial color={floorColor ?? ROOM_COLORS[room.type]} emissive={active ? "#705b3e" : "#000000"} emissiveIntensity={active ? .11 : 0} />
      </mesh>
      <FloorPattern room={room} style={style} />
      <CeilingLights room={room} style={style} />
      <AccentFeature room={room} style={style} />
      <Html center position={[0, .08, 0]} distanceFactor={9} occlude={false} style={{ pointerEvents: "none" }}>
        <div className={`room-label ${active ? "active" : ""}`}>{room.name}</div>
      </Html>
    </group>
  );
}

function styledMaterialColor(item: FurnishingCatalogItem, styleId?: string, fallback = item.color) {
  const woodLight = ["japanese-muji", "nordic-scandinavian", "korean-minimal", "cream-style", "storage-practical"];
  const woodDark = ["luxury-hotel"];
  const steel = ["industrial", "smart-home-minimalist", "modern-minimalist"];
  const luxe = ["modern-luxury"];
  if (item.category === "electronics") {
    if (styleId === "industrial" || styleId === "smart-home-minimalist") return "#2f3638";
    if (styleId === "modern-luxury" || styleId === "luxury-hotel") return "#d8d2c6";
    return item.shape === "tv" ? "#171b1d" : "#e9ece8";
  }
  if (woodLight.includes(styleId ?? "")) return ["wardrobe", "bookcase", "cabinet", "table", "desk"].includes(item.shape) ? "#d8c19d" : fallback;
  if (woodDark.includes(styleId ?? "")) return ["wardrobe", "bookcase", "cabinet", "table", "desk", "bed"].includes(item.shape) ? "#6e5038" : "#8a7a68";
  if (steel.includes(styleId ?? "")) return ["wardrobe", "bookcase", "cabinet", "table", "desk"].includes(item.shape) ? "#60666a" : fallback;
  if (luxe.includes(styleId ?? "")) return ["wardrobe", "bookcase", "cabinet", "table", "desk"].includes(item.shape) ? "#c6b8a6" : fallback;
  return fallback;
}

function FurnitureModel({ item, selected, styleId, opacity = 1 }: { item: FurnishingCatalogItem; selected: boolean; styleId?: string; opacity?: number }) {
  const { widthMeters: width, depthMeters: depth, heightMeters: height } = item.dimensions;
  const material = (color = styledMaterialColor(item, styleId)) => <meshStandardMaterial color={color} roughness={.72} emissive={selected ? "#8c5b38" : "#000000"} emissiveIntensity={selected ? .18 : 0} metalness={styleId === "industrial" || styleId === "modern-luxury" ? .18 : 0} transparent={opacity < 1} opacity={opacity} />;
  if (item.shape === "sofa") return <group><mesh position={[0, .2, 0]} castShadow><boxGeometry args={[width, .32, depth]} />{material()}</mesh><mesh position={[0, .55, depth * .38]} castShadow><boxGeometry args={[width, .62, .18]} />{material("#888981")}</mesh>{[-1, 1].map((side) => <mesh key={side} position={[side * (width / 2 - .09), .4, 0]} castShadow><boxGeometry args={[.18, .46, depth]} />{material("#7f817a")}</mesh>)}{[-.28, .28].map((x) => <mesh key={x} position={[x * width, .43, -depth * .12]} castShadow><boxGeometry args={[width * .38, .16, depth * .42]} />{material("#b8b4aa")}</mesh>)}</group>;
  if (item.shape === "bed") return <group><mesh position={[0, .2, 0]} castShadow><boxGeometry args={[width, .32, depth]} />{material("#d8d0c3")}</mesh><mesh position={[0, .44, -.05]} castShadow><boxGeometry args={[width * .92, .13, depth * .78]} />{material("#f0eadf")}</mesh><mesh position={[0, height / 2, depth / 2 - .06]} castShadow><boxGeometry args={[width, height, .12]} />{material("#7b6049")}</mesh>{[-.23, .23].map((x) => <mesh key={x} position={[x * width, .56, depth * .28]} castShadow><boxGeometry args={[width * .34, .09, depth * .18]} />{material("#fff7ec")}</mesh>)}</group>;
  if (item.shape === "chair") return <group><mesh position={[0, .33, 0]} castShadow><boxGeometry args={[width * .72, .22, depth * .65]} />{material()}</mesh><mesh position={[0, .72, depth * .24]} castShadow><boxGeometry args={[width * .72, .7, .12]} />{material("#927858")}</mesh>{[-1, 1].flatMap((x) => [-1, 1].map((z) => <mesh key={`${x}-${z}`} position={[x * width * .26, .18, z * depth * .22]} castShadow><boxGeometry args={[.06, .36, .06]} />{material("#6b5541")}</mesh>))}<mesh position={[0, .46, -.05]} castShadow><boxGeometry args={[width * .58, .08, depth * .45]} />{material("#d8c3a0")}</mesh></group>;
  if (item.shape === "table" || item.shape === "desk") return <group><mesh position={[0, height - .05, 0]} castShadow><boxGeometry args={[width, .1, depth]} />{material()}</mesh>{[-1, 1].flatMap((x) => [-1, 1].map((z) => <mesh key={`${x}-${z}`} position={[x * (width / 2 - .08), height / 2 - .05, z * (depth / 2 - .08)]} castShadow><boxGeometry args={[.08, height - .1, .08]} />{material("#74604e")}</mesh>))}{item.shape === "desk" && <mesh position={[0, height + .035, depth * .18]} castShadow><boxGeometry args={[width * .32, .07, .08]} />{material("#d9dde0")}</mesh>}</group>;
  if (item.shape === "wardrobe" || item.shape === "bookcase" || item.shape === "cabinet") return <group><mesh position={[0, height / 2, 0]} castShadow><boxGeometry args={[width, height, depth]} />{material()}</mesh><mesh position={[0, height * .5, depth / 2 + .012]}><boxGeometry args={[.018, height * .82, .024]} />{material("#b8b2a6")}</mesh>{[.35, .65].map((x) => <mesh key={x} position={[(x - .5) * width, height * .5, depth / 2 + .026]}><boxGeometry args={[.025, height * .48, .018]} />{material("#8b887f")}</mesh>)}{item.shape === "bookcase" && [.25, .5, .75].map((ratio) => <mesh key={ratio} position={[0, height * ratio, depth / 2 + .018]}><boxGeometry args={[width * .9, .018, .02]} />{material("#c9c1b4")}</mesh>)}</group>;
  if (item.shape === "tv") return <group><mesh position={[0, height * .58, 0]} castShadow><boxGeometry args={[width, height * .72, .06]} />{material("#111416")}</mesh><mesh position={[0, height * .58, -.035]}><boxGeometry args={[width * .92, height * .58, .012]} />{material("#252f36")}</mesh><mesh position={[0, .08, 0]} castShadow><boxGeometry args={[width * .38, .08, depth]} />{material("#343a3b")}</mesh><mesh position={[0, .24, 0]} castShadow><boxGeometry args={[.07, .3, .07]} />{material("#343a3b")}</mesh></group>;
  if (item.shape === "fridge") return <group><mesh position={[0, height / 2, 0]} castShadow><boxGeometry args={[width, height, depth]} />{material()}</mesh><mesh position={[0, height * .58, depth / 2 + .018]}><boxGeometry args={[width * .92, .022, .025]} />{material("#aeb8ba")}</mesh><mesh position={[width * .32, height * .58, depth / 2 + .028]}><boxGeometry args={[.026, height * .45, .025]} />{material("#798486")}</mesh></group>;
  if (item.shape === "washer") return <group><mesh position={[0, height / 2, 0]} castShadow><boxGeometry args={[width, height, depth]} />{material()}</mesh><mesh position={[0, height * .55, depth / 2 + .024]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.16, .16, .03, 32]} />{material("#8a969b")}</mesh><mesh position={[0, height * .55, depth / 2 + .043]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.11, .11, .012, 32]} />{material("#dbe3e6")}</mesh><mesh position={[width * .25, height * .82, depth / 2 + .026]}><boxGeometry args={[.16, .07, .025]} />{material("#b9c3c7")}</mesh></group>;
  if (item.shape === "microwave") return <group><mesh position={[0, height / 2, 0]} castShadow><boxGeometry args={[width, height, depth]} />{material()}</mesh><mesh position={[-width * .1, height * .55, depth / 2 + .02]}><boxGeometry args={[width * .55, height * .55, .025]} />{material("#14191a")}</mesh><mesh position={[width * .32, height * .55, depth / 2 + .024]}><boxGeometry args={[.07, height * .5, .024]} />{material("#7b8588")}</mesh></group>;
  if (item.shape === "aircon") return <group><mesh position={[0, height / 2, 0]} castShadow><boxGeometry args={[width, height, depth]} />{material()}</mesh>{[-.18, 0, .18].map((x) => <mesh key={x} position={[x * width, height * .42, depth / 2 + .018]}><boxGeometry args={[width * .22, .035, .025]} />{material("#9aa8ab")}</mesh>)}</group>;
  return <group><mesh position={[0, height / 2, 0]} castShadow><boxGeometry args={[width, height, depth]} />{material()}</mesh><mesh position={[0, height * .7, depth / 2 + .006]}><boxGeometry args={[width * .92, .012, .012]} />{material("#909797")}</mesh>{[.35, .62].map((ratio) => <mesh key={ratio} position={[width * .32, height * ratio, depth / 2 + .025]}><boxGeometry args={[.015, .22, .025]} />{material("#596061")}</mesh>)}</group>;
}

function Furnishing({ furnishing, selected, styleId, previewPosition, ghost, onSelect, onDragMove }: { furnishing: PlacedFurnishing; selected: boolean; styleId?: string; previewPosition?: { x: number; y: number }; ghost?: boolean; onSelect?: () => void; onDragMove?: (id: string, delta: { x: number; y: number }) => void }) {
  const item = catalogItem(furnishing.catalogId);
  const dragStart = useRef<{ x: number; z: number } | undefined>(undefined);
  if (!item) return null;
  const mountHeight = item.shape === "aircon" ? 1.85 : 0;
  const position = previewPosition ?? furnishing.position;
  if (ghost) return <group position={[position.x, mountHeight, position.y]} rotation={[0, THREE.MathUtils.degToRad(furnishing.rotationDegrees), 0]} raycast={() => null}><FurnitureModel item={item} selected={selected} styleId={styleId} opacity={.45} /></group>;
  return <group position={[position.x, mountHeight, position.y]} rotation={[0, THREE.MathUtils.degToRad(furnishing.rotationDegrees), 0]} onPointerDown={(event) => { event.stopPropagation(); onSelect?.(); dragStart.current = { x: event.point.x, z: event.point.z }; }} onPointerUp={(event) => { event.stopPropagation(); const start = dragStart.current; dragStart.current = undefined; if (!start) return; const delta = { x: event.point.x - start.x, y: event.point.z - start.z }; if (Math.hypot(delta.x, delta.y) > .08) onDragMove?.(furnishing.id, delta); }} onClick={(event) => { event.stopPropagation(); onSelect?.(); }}><FurnitureModel item={item} selected={selected} styleId={styleId} opacity={1} /></group>;
}

type Opening = { center: number; width: number; kind: "door" | "window"; height?: number; sill?: number; swing?: { hinge: "start" | "end"; direction: 1 | -1 } };

function DoorSwing({ wall, opening }: { wall: LayoutWall; opening: Opening }) {
  const swingParts = useMemo(() => {
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.y - wall.start.y;
    const total = Math.max(.001, Math.hypot(dx, dz));
    const ux = dx / total;
    const uz = dz / total;
    const swing = opening.swing ?? { hinge: "start" as const, direction: 1 as const };
    const hingeDistance = opening.center + (swing.hinge === "start" ? -opening.width / 2 : opening.width / 2);
    const hx = wall.start.x + ux * hingeDistance;
    const hz = wall.start.y + uz * hingeDistance;
    const baseAngle = Math.atan2(uz, ux) + (swing.hinge === "start" ? 0 : Math.PI);
    const normalAngle = baseAngle + swing.direction * Math.PI / 2;
    const arc = [];
    let previous = new THREE.Vector3(hx + Math.cos(baseAngle) * opening.width, .055, hz + Math.sin(baseAngle) * opening.width);
    for (let i = 1; i <= 16; i++) {
      const angle = baseAngle + swing.direction * (Math.PI / 2) * (i / 16);
      const current = new THREE.Vector3(hx + Math.cos(angle) * opening.width, .055, hz + Math.sin(angle) * opening.width);
      const midpoint = previous.clone().add(current).multiplyScalar(.5);
      arc.push({ key: `arc-${i}`, position: midpoint, length: previous.distanceTo(current), rotation: -Math.atan2(current.z - previous.z, current.x - previous.x) });
      previous = current;
    }
    const leafEnd = new THREE.Vector3(hx + Math.cos(normalAngle) * opening.width, .075, hz + Math.sin(normalAngle) * opening.width);
    const hinge = new THREE.Vector3(hx, .075, hz);
    const leafMidpoint = hinge.clone().add(leafEnd).multiplyScalar(.5);
    return { arc, leaf: { position: leafMidpoint, length: hinge.distanceTo(leafEnd), rotation: -Math.atan2(leafEnd.z - hinge.z, leafEnd.x - hinge.x) } };
  }, [opening, wall]);
  return (
    <>
      {swingParts.arc.map((part) => <mesh key={part.key} position={part.position} rotation={[0, part.rotation, 0]}><boxGeometry args={[part.length, .025, .025]} /><meshStandardMaterial color="#9a6c45" /></mesh>)}
      <mesh position={swingParts.leaf.position} rotation={[0, swingParts.leaf.rotation, 0]}><boxGeometry args={[swingParts.leaf.length, .035, .035]} /><meshStandardMaterial color="#7a4d2e" /></mesh>
    </>
  );
}

function WallPiece({ wall, startAt, length, height, y, color, selected, onSelect, onPointerDown, onPointerUp }: { wall: LayoutWall; startAt: number; length: number; height: number; y: number; color?: string; selected?: boolean; onSelect?: () => void; onPointerDown?: (x: number, z: number) => void; onPointerUp?: (x: number, z: number) => void }) {
  if (length <= .01 || height <= .01) return null;
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.y - wall.start.y;
  const total = Math.hypot(dx, dz);
  const ux = dx / total;
  const uz = dz / total;
  const cx = wall.start.x + ux * (startAt + length / 2);
  const cz = wall.start.y + uz * (startAt + length / 2);
  return (
    <mesh position={[cx, y, cz]} rotation={[0, -Math.atan2(uz, ux), 0]} castShadow receiveShadow onPointerDown={(event) => { event.stopPropagation(); onSelect?.(); onPointerDown?.(event.point.x, event.point.z); }} onPointerUp={(event) => { event.stopPropagation(); onPointerUp?.(event.point.x, event.point.z); }} onClick={(event) => { event.stopPropagation(); onSelect?.(); }}>
      <boxGeometry args={[length, height, wall.thicknessMeters]} />
      <meshStandardMaterial color={selected ? "#c98758" : color ?? "#f3f0e9"} roughness={.82} emissive={selected ? "#6d341c" : "#000000"} emissiveIntensity={selected ? .16 : 0} />
    </mesh>
  );
}

function Wall({ wall, doors, windows, color, selected, onSelect, onDragMove }: { wall: LayoutWall; doors: PropertyLayout["doors"]; windows: PropertyLayout["windows"]; color?: string; selected?: boolean; onSelect?: () => void; onDragMove?: (wallId: string, delta: { x: number; y: number }) => void }) {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  const dragStart = useRef<{ x: number; z: number } | undefined>(undefined);
  const startDrag = (x: number, z: number) => { dragStart.current = { x, z }; };
  const endDrag = (x: number, z: number) => {
    const start = dragStart.current;
    dragStart.current = undefined;
    if (!start) return;
    const delta = { x: x - start.x, y: z - start.z };
    if (Math.hypot(delta.x, delta.y) > .08) onDragMove?.(wall.id, delta);
  };
  const openings: Opening[] = [
    ...doors.filter((d) => d.wallId === wall.id).map((d) => ({ center: d.positionRatioOnWall * length, width: d.widthMeters, kind: "door" as const, swing: d.swing })),
    ...windows.filter((w) => w.wallId === wall.id).map((w) => ({ center: w.positionRatioOnWall * length, width: w.widthMeters, kind: "window" as const, height: w.heightMeters, sill: w.sillHeightMeters ?? .9 })),
  ].sort((a, b) => a.center - b.center);
  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  openings.forEach((opening, index) => {
    const left = Math.max(0, opening.center - opening.width / 2);
    const right = Math.min(length, opening.center + opening.width / 2);
    pieces.push(<WallPiece key={`side-${index}`} wall={wall} startAt={cursor} length={left - cursor} height={wall.heightMeters} y={wall.heightMeters / 2} color={color} selected={selected} onSelect={onSelect} onPointerDown={startDrag} onPointerUp={endDrag} />);
    if (opening.kind === "door") {
      pieces.push(<WallPiece key={`top-${index}`} wall={wall} startAt={left} length={right - left} height={Math.max(.1, wall.heightMeters - 2.08)} y={2.08 + Math.max(.1, wall.heightMeters - 2.08) / 2} color={color} selected={selected} onSelect={onSelect} onPointerDown={startDrag} onPointerUp={endDrag} />);
      pieces.push(<DoorSwing key={`swing-${index}`} wall={wall} opening={opening} />);
    } else {
      const sill = opening.sill ?? .9;
      const openingHeight = opening.height ?? 1;
      pieces.push(<WallPiece key={`sill-${index}`} wall={wall} startAt={left} length={right - left} height={sill} y={sill / 2} color={color} selected={selected} onSelect={onSelect} onPointerDown={startDrag} onPointerUp={endDrag} />);
      pieces.push(<WallPiece key={`lintel-${index}`} wall={wall} startAt={left} length={right - left} height={wall.heightMeters - sill - openingHeight} y={sill + openingHeight + (wall.heightMeters - sill - openingHeight) / 2} color={color} selected={selected} onSelect={onSelect} onPointerDown={startDrag} onPointerUp={endDrag} />);
    }
    cursor = right;
  });
  pieces.push(<WallPiece key="tail" wall={wall} startAt={cursor} length={length - cursor} height={wall.heightMeters} y={wall.heightMeters / 2} color={color} selected={selected} onSelect={onSelect} onPointerDown={startDrag} onPointerUp={endDrag} />);
  const marker = (opening: Opening, index: number) => {
    const dx = wall.end.x - wall.start.x; const dz = wall.end.y - wall.start.y; const total = Math.hypot(dx, dz); const ux = dx / total; const uz = dz / total;
    const cx = wall.start.x + ux * opening.center; const cz = wall.start.y + uz * opening.center;
    const y = opening.kind === "door" ? 1.02 : (opening.sill ?? .9) + (opening.height ?? 1) / 2;
    const h = opening.kind === "door" ? 2.04 : opening.height ?? 1;
    return <mesh key={`marker-${index}`} position={[cx, y, cz]} rotation={[0, -Math.atan2(uz, ux), 0]} onClick={(event) => { event.stopPropagation(); onSelect?.(); }}><boxGeometry args={[opening.width, h, .025]} /><meshStandardMaterial color={opening.kind === "door" ? "#9a6c45" : "#8ec7dc"} transparent opacity={opening.kind === "door" ? .72 : .48} roughness={.28} /></mesh>;
  };
  return <>{pieces}{openings.map(marker)}</>;
}

function Platform({ platform, color }: { platform: NonNullable<PropertyLayout["platforms"]>[number]; color?: string }) {
  return <mesh position={[platform.position.x + platform.dimensions.widthMeters / 2, platform.dimensions.heightMeters / 2, platform.position.y + platform.dimensions.lengthMeters / 2]} receiveShadow castShadow>
    <boxGeometry args={[platform.dimensions.widthMeters, platform.dimensions.heightMeters, platform.dimensions.lengthMeters]} />
    <meshStandardMaterial color={color ?? "#c9b79b"} roughness={.82} />
  </mesh>;
}

function FocusCamera({ room, offset }: { room?: PropertyLayout["rooms"][number]; offset: { x: number; z: number } }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!room) return;
    const x = room.position.x + room.dimensions.widthMeters / 2;
    const z = room.position.y + room.dimensions.lengthMeters / 2;
    // Image estimates represent the entire flat as one room. Fit that extent
    // rather than using a fixed bedroom-sized camera distance that hides doors.
    const extent = Math.max(room.dimensions.widthMeters, room.dimensions.lengthMeters, 4);
    camera.position.set(x + offset.x + extent * .45, extent * 1.65, z + offset.z + extent * .85);
    camera.lookAt(x + offset.x, 0, z + offset.z);
  }, [camera, offset.x, offset.z, room]);
  return null;
}

export function PropertyViewer({ layout, selectedRoomId, onSelectRoom, furnishings = [], selectedFurnishingId, movingFurnishingId, movingFurnishingPreview, onSelectFurnishing, onFurnishingMove, onFloorPoint, onFloorHover, onWallDraw, selectedWallId, onSelectWall, onWallMove }: { layout: PropertyLayout; selectedRoomId?: string; onSelectRoom: (id: string) => void; furnishings?: PlacedFurnishing[]; selectedFurnishingId?: string; movingFurnishingId?: string; movingFurnishingPreview?: { x: number; y: number }; onSelectFurnishing?: (id: string) => void; onFurnishingMove?: (id: string, delta: { x: number; y: number }) => void; onFloorPoint?: (roomId: string, x: number, y: number) => void; onFloorHover?: (roomId: string, x: number, y: number) => void; onWallDraw?: (roomId: string, start: { x: number; y: number }, end: { x: number; y: number }) => void; selectedWallId?: string; onSelectWall?: (id: string) => void; onWallMove?: (wallId: string, delta: { x: number; y: number }) => void }) {
  const selectedRoom = useMemo(() => layout.rooms.find((r) => r.id === selectedRoomId), [layout.rooms, selectedRoomId]);
  const wallDragRef = useRef<{ roomId: string; x: number; y: number } | undefined>(undefined);
  const style = decorStyleById(layout.decorStyleId);
  const offset = useMemo(() => {
    const points = layout.walls.flatMap((wall) => [wall.start, wall.end]);
    if (!points.length) return { x: 0, z: 0 };
    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minZ = Math.min(...points.map((point) => point.y));
    const maxZ = Math.max(...points.map((point) => point.y));
    return { x: -(minX + maxX) / 2, z: -(minZ + maxZ) / 2 };
  }, [layout.walls]);
  return (
    <Canvas shadows dpr={[1, 1.6]} camera={{ position: [11, 9, 11], fov: 43 }} gl={{ antialias: true }}>
      <color attach="background" args={[style.palette.background]} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[5, 10, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      {/* Layout x/y become Three.js x/z; Three.js y is vertical. */}
      <group position={[offset.x, 0, offset.z]}>
        {layout.rooms.map((room) => <RoomFloor key={room.id} room={room} active={room.id === selectedRoomId} floorColor={style.palette.floor} style={style} onSelect={() => onSelectRoom(room.id)} onFloorPoint={onFloorPoint ? (x, z) => onFloorPoint(room.id, x - offset.x, z - offset.z) : undefined} onFloorHover={onFloorHover ? (x, z) => onFloorHover(room.id, x - offset.x, z - offset.z) : undefined} onFloorDragStart={onWallDraw ? (x, z) => { wallDragRef.current = { roomId: room.id, x: x - offset.x, y: z - offset.z }; } : undefined} onFloorDragEnd={onWallDraw ? (x, z) => { const start = wallDragRef.current; const end = { x: x - offset.x, y: z - offset.z }; if (start && start.roomId === room.id && Math.hypot(end.x - start.x, end.y - start.y) > .25) onWallDraw(room.id, { x: start.x, y: start.y }, end); wallDragRef.current = undefined; } : undefined} />)}
        {(layout.platforms ?? []).map((platform) => <Platform key={platform.id} platform={platform} color={style.palette.platform} />)}
        {layout.walls.map((wall) => <Wall key={wall.id} wall={wall} doors={layout.doors} windows={layout.windows} color={style.palette.wall} selected={wall.id === selectedWallId} onSelect={() => onSelectWall?.(wall.id)} onDragMove={(wallId, delta) => onWallMove?.(wallId, delta)} />)}
        {furnishings.map((furnishing) => <Furnishing key={furnishing.id} furnishing={furnishing} selected={furnishing.id === selectedFurnishingId} styleId={style.id} previewPosition={furnishing.id === movingFurnishingId ? movingFurnishingPreview : undefined} ghost={furnishing.id === movingFurnishingId && Boolean(movingFurnishingPreview)} onSelect={() => onSelectFurnishing?.(furnishing.id)} onDragMove={onFurnishingMove} />)}
      </group>
      <gridHelper args={[30, 30, "#c3beb5", "#d8d4cc"]} position={[0, -.02, 0]} />
      <FocusCamera room={selectedRoom} offset={offset} />
      <OrbitControls makeDefault target={selectedRoom ? [selectedRoom.position.x + offset.x + selectedRoom.dimensions.widthMeters / 2, .6, selectedRoom.position.y + offset.z + selectedRoom.dimensions.lengthMeters / 2] : [0, .5, 0]} minDistance={3} maxDistance={30} maxPolarAngle={Math.PI / 2.03} />
    </Canvas>
  );
}
