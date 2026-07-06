"use client";

import { useRef, useState } from "react";
import { Check, RotateCcw, Undo2 } from "lucide-react";
import type { DrawnRoom } from "@/lib/manual-layout";

const WIDTH = 600;
const HEIGHT = 400;
const SCALE = 40;

type Point = { x: number; y: number };

export function ManualFloorPlan({ overlayUrl, onUse }: { overlayUrl?: string; onUse: (rooms: DrawnRoom[]) => void }) {
  const [rooms, setRooms] = useState<DrawnRoom[]>([]);
  const [start, setStart] = useState<Point>();
  const [cursor, setCursor] = useState<Point>();
  const svgRef = useRef<SVGSVGElement>(null);

  const point = (event: React.PointerEvent<SVGSVGElement>): Point => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(WIDTH, (event.clientX - bounds.left) * WIDTH / bounds.width)),
      y: Math.max(0, Math.min(HEIGHT, (event.clientY - bounds.top) * HEIGHT / bounds.height)),
    };
  };

  const finish = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!start) return;
    const end = point(event);
    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x) / SCALE;
    const length = Math.abs(end.y - start.y) / SCALE;
    if (width >= .5 && length >= .5) {
      const index = rooms.length + 1;
      setRooms((current) => [...current, {
        id: `drawn-room-${Date.now()}`,
        name: index === 1 ? "Living / dining" : `Room ${index}`,
        type: index === 1 ? "living" : "bedroom",
        x: Number((left / SCALE).toFixed(2)),
        y: Number((top / SCALE).toFixed(2)),
        width: Number(width.toFixed(2)),
        length: Number(length.toFixed(2)),
      }]);
    }
    setStart(undefined);
    setCursor(undefined);
  };

  const draft = start && cursor ? {
    x: Math.min(start.x, cursor.x), y: Math.min(start.y, cursor.y),
    width: Math.abs(cursor.x - start.x), height: Math.abs(cursor.y - start.y),
  } : undefined;

  return (
    <div className="manual-plan">
      <div className="draw-toolbar">
        <div><strong>Draw room rectangles</strong><span>Drag on the grid. Each square is 0.5 m.</span></div>
        <div><button className="button ghost small" disabled={!rooms.length} onClick={() => setRooms((current) => current.slice(0, -1))}><Undo2 size={15} /> Undo</button><button className="button ghost small" disabled={!rooms.length} onClick={() => setRooms([])}><RotateCcw size={15} /> Clear</button></div>
      </div>
      <svg ref={svgRef} className="plan-canvas" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); const p = point(event); setStart(p); setCursor(p); }} onPointerMove={(event) => start && setCursor(point(event))} onPointerUp={finish} onPointerCancel={() => { setStart(undefined); setCursor(undefined); }}>
        <defs><pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#d9ddd7" strokeWidth="1" /></pattern><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="url(#smallGrid)" /><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#bac4bc" strokeWidth="1.2" /></pattern></defs>
        <rect width={WIDTH} height={HEIGHT} fill="#fafaf7" />
        {overlayUrl && <image href={overlayUrl} width={WIDTH} height={HEIGHT} opacity=".32" preserveAspectRatio="xMidYMid meet" />}
        <rect width={WIDTH} height={HEIGHT} fill="url(#grid)" />
        {rooms.map((room) => <g key={room.id}><rect x={room.x * SCALE} y={room.y * SCALE} width={room.width * SCALE} height={room.length * SCALE} rx="3" fill="rgba(86,116,99,.22)" stroke="#40584b" strokeWidth="3" /><text x={room.x * SCALE + 8} y={room.y * SCALE + 20} className="svg-label">{room.name}</text><text x={room.x * SCALE + 8} y={room.y * SCALE + 36} className="svg-size">{room.width.toFixed(1)} x {room.length.toFixed(1)} m</text></g>)}
        {draft && <rect {...draft} fill="rgba(189,114,84,.22)" stroke="#bd7254" strokeWidth="2" strokeDasharray="6 4" />}
      </svg>
      <div className="draw-footer"><span>{rooms.length ? `${rooms.length} room${rooms.length === 1 ? "" : "s"} drawn` : "Drag to draw your first room"}</span><button className="button primary" disabled={!rooms.length} onClick={() => onUse(rooms)}><Check size={16} /> Use this floor plan</button></div>
    </div>
  );
}
