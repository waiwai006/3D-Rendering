"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { LayoutWall, PropertyLayout } from "@/lib/layout-schema";
import { catalogItem, type FurnishingCatalogItem, type PlacedFurnishing } from "@/lib/furnishing-catalog";

const ROOM_COLORS = { living: "#dbcdb8", bedroom: "#d8d8ce", kitchen: "#c8d4ce", bathroom: "#b9cbd1", corridor: "#d6cec2", balcony: "#c4d8cf", storage: "#d1ccc4", other: "#d3d0ca" };

function RoomFloor({ room, active, onSelect, onFloorPoint }: { room: PropertyLayout["rooms"][number]; active: boolean; onSelect: () => void; onFloorPoint?: (x: number, z: number) => void }) {
  const { widthMeters: w, lengthMeters: l } = room.dimensions;
  return (
    <group position={[room.position.x + w / 2, room.position.z, room.position.y + l / 2]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .015, 0]} receiveShadow onClick={(event) => { event.stopPropagation(); onSelect(); onFloorPoint?.(event.point.x, event.point.z); }}>
        <planeGeometry args={[w - .04, l - .04]} />
        <meshStandardMaterial color={ROOM_COLORS[room.type]} emissive={active ? "#705b3e" : "#000000"} emissiveIntensity={active ? .11 : 0} />
      </mesh>
      <Html center position={[0, .08, 0]} distanceFactor={9} occlude={false} style={{ pointerEvents: "none" }}>
        <div className={`room-label ${active ? "active" : ""}`}>{room.name}</div>
      </Html>
    </group>
  );
}

function FurnitureModel({ item, selected }: { item: FurnishingCatalogItem; selected: boolean }) {
  const { widthMeters: width, depthMeters: depth, heightMeters: height } = item.dimensions;
  const material = (color = item.color) => <meshStandardMaterial color={color} roughness={.72} emissive={selected ? "#8c5b38" : "#000000"} emissiveIntensity={selected ? .18 : 0} />;
  if (item.shape === "sofa") return <group><mesh position={[0, .22, 0]} castShadow><boxGeometry args={[width, .35, depth]} />{material()}</mesh><mesh position={[0, .58, depth * .36]} castShadow><boxGeometry args={[width, .62, .18]} />{material("#98958d")}</mesh>{[-1, 1].map((side) => <mesh key={side} position={[side * (width / 2 - .09), .43, 0]} castShadow><boxGeometry args={[.18, .5, depth]} />{material("#929088")}</mesh>)}</group>;
  if (item.shape === "bed") return <group><mesh position={[0, .26, 0]} castShadow><boxGeometry args={[width, .42, depth]} />{material("#e8e1d5")}</mesh><mesh position={[0, height / 2, depth / 2 - .06]} castShadow><boxGeometry args={[width, height, .12]} />{material("#7b6049")}</mesh></group>;
  if (item.shape === "table" || item.shape === "desk") return <group><mesh position={[0, height - .05, 0]} castShadow><boxGeometry args={[width, .1, depth]} />{material()}</mesh>{[-1, 1].flatMap((x) => [-1, 1].map((z) => <mesh key={`${x}-${z}`} position={[x * (width / 2 - .08), height / 2 - .05, z * (depth / 2 - .08)]} castShadow><boxGeometry args={[.08, height - .1, .08]} />{material("#74604e")}</mesh>))}</group>;
  if (item.shape === "tv") return <group><mesh position={[0, height * .58, 0]} castShadow><boxGeometry args={[width, height * .72, .06]} />{material("#161b1d")}</mesh><mesh position={[0, .08, 0]} castShadow><boxGeometry args={[width * .38, .08, depth]} />{material("#343a3b")}</mesh><mesh position={[0, .24, 0]} castShadow><boxGeometry args={[.07, .3, .07]} />{material("#343a3b")}</mesh></group>;
  return <group><mesh position={[0, height / 2, 0]} castShadow><boxGeometry args={[width, height, depth]} />{material()}</mesh><mesh position={[0, height * .7, depth / 2 + .006]}><boxGeometry args={[width * .92, .012, .012]} />{material("#909797")}</mesh>{[.35, .62].map((ratio) => <mesh key={ratio} position={[width * .32, height * ratio, depth / 2 + .025]}><boxGeometry args={[.015, .22, .025]} />{material("#596061")}</mesh>)}</group>;
}

function Furnishing({ furnishing, selected, onSelect }: { furnishing: PlacedFurnishing; selected: boolean; onSelect?: () => void }) {
  const item = catalogItem(furnishing.catalogId);
  if (!item) return null;
  return <group position={[furnishing.position.x, 0, furnishing.position.y]} rotation={[0, THREE.MathUtils.degToRad(furnishing.rotationDegrees), 0]} onClick={(event) => { event.stopPropagation(); onSelect?.(); }}><FurnitureModel item={item} selected={selected} /></group>;
}

type Opening = { center: number; width: number; kind: "door" | "window"; height?: number; sill?: number };

function WallPiece({ wall, startAt, length, height, y }: { wall: LayoutWall; startAt: number; length: number; height: number; y: number }) {
  if (length <= .01 || height <= .01) return null;
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.y - wall.start.y;
  const total = Math.hypot(dx, dz);
  const ux = dx / total;
  const uz = dz / total;
  const cx = wall.start.x + ux * (startAt + length / 2);
  const cz = wall.start.y + uz * (startAt + length / 2);
  return (
    <mesh position={[cx, y, cz]} rotation={[0, -Math.atan2(uz, ux), 0]} castShadow receiveShadow>
      <boxGeometry args={[length, height, wall.thicknessMeters]} />
      <meshStandardMaterial color="#f3f0e9" roughness={.82} />
    </mesh>
  );
}

function Wall({ wall, doors, windows }: { wall: LayoutWall; doors: PropertyLayout["doors"]; windows: PropertyLayout["windows"] }) {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  const openings: Opening[] = [
    ...doors.filter((d) => d.wallId === wall.id).map((d) => ({ center: d.positionRatioOnWall * length, width: d.widthMeters, kind: "door" as const })),
    ...windows.filter((w) => w.wallId === wall.id).map((w) => ({ center: w.positionRatioOnWall * length, width: w.widthMeters, kind: "window" as const, height: w.heightMeters, sill: w.sillHeightMeters ?? .9 })),
  ].sort((a, b) => a.center - b.center);
  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  openings.forEach((opening, index) => {
    const left = Math.max(0, opening.center - opening.width / 2);
    const right = Math.min(length, opening.center + opening.width / 2);
    pieces.push(<WallPiece key={`side-${index}`} wall={wall} startAt={cursor} length={left - cursor} height={wall.heightMeters} y={wall.heightMeters / 2} />);
    if (opening.kind === "door") {
      pieces.push(<WallPiece key={`top-${index}`} wall={wall} startAt={left} length={right - left} height={Math.max(.1, wall.heightMeters - 2.08)} y={2.08 + Math.max(.1, wall.heightMeters - 2.08) / 2} />);
    } else {
      const sill = opening.sill ?? .9;
      const openingHeight = opening.height ?? 1;
      pieces.push(<WallPiece key={`sill-${index}`} wall={wall} startAt={left} length={right - left} height={sill} y={sill / 2} />);
      pieces.push(<WallPiece key={`lintel-${index}`} wall={wall} startAt={left} length={right - left} height={wall.heightMeters - sill - openingHeight} y={sill + openingHeight + (wall.heightMeters - sill - openingHeight) / 2} />);
    }
    cursor = right;
  });
  pieces.push(<WallPiece key="tail" wall={wall} startAt={cursor} length={length - cursor} height={wall.heightMeters} y={wall.heightMeters / 2} />);
  return <>{pieces}</>;
}

function FocusCamera({ room, offset }: { room?: PropertyLayout["rooms"][number]; offset: { x: number; z: number } }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!room) return;
    const x = room.position.x + room.dimensions.widthMeters / 2;
    const z = room.position.y + room.dimensions.lengthMeters / 2;
    camera.position.set(x + offset.x + 3.5, 4.2, z + offset.z + 4.8);
    camera.lookAt(x + offset.x, 0, z + offset.z);
  }, [camera, offset.x, offset.z, room]);
  return null;
}

export function PropertyViewer({ layout, selectedRoomId, onSelectRoom, furnishings = [], selectedFurnishingId, onSelectFurnishing, onFloorPoint }: { layout: PropertyLayout; selectedRoomId?: string; onSelectRoom: (id: string) => void; furnishings?: PlacedFurnishing[]; selectedFurnishingId?: string; onSelectFurnishing?: (id: string) => void; onFloorPoint?: (roomId: string, x: number, y: number) => void }) {
  const selectedRoom = useMemo(() => layout.rooms.find((r) => r.id === selectedRoomId), [layout.rooms, selectedRoomId]);
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
      <color attach="background" args={["#ebe8e0"]} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[5, 10, 4]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      {/* Layout x/y become Three.js x/z; Three.js y is vertical. */}
      <group position={[offset.x, 0, offset.z]}>
        {layout.rooms.map((room) => <RoomFloor key={room.id} room={room} active={room.id === selectedRoomId} onSelect={() => onSelectRoom(room.id)} onFloorPoint={onFloorPoint ? (x, z) => onFloorPoint(room.id, x - offset.x, z - offset.z) : undefined} />)}
        {layout.walls.map((wall) => <Wall key={wall.id} wall={wall} doors={layout.doors} windows={layout.windows} />)}
        {furnishings.map((furnishing) => <Furnishing key={furnishing.id} furnishing={furnishing} selected={furnishing.id === selectedFurnishingId} onSelect={() => onSelectFurnishing?.(furnishing.id)} />)}
      </group>
      <gridHelper args={[30, 30, "#c3beb5", "#d8d4cc"]} position={[0, -.02, 0]} />
      <FocusCamera room={selectedRoom} offset={offset} />
      <OrbitControls makeDefault target={selectedRoom ? [selectedRoom.position.x + offset.x + selectedRoom.dimensions.widthMeters / 2, .6, selectedRoom.position.y + offset.z + selectedRoom.dimensions.lengthMeters / 2] : [0, .5, 0]} minDistance={3} maxDistance={30} maxPolarAngle={Math.PI / 2.03} />
    </Canvas>
  );
}
