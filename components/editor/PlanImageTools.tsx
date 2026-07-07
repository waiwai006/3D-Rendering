"use client";

import { useEffect, useRef, useState } from "react";
import { Crop, Hand, Minus, Plus, ScanLine } from "lucide-react";

export function PlanZoomViewer({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(1);
  return <div className="plan-zoom"><div className="zoom-toolbar"><button onClick={() => setZoom((value) => Math.max(1, value - .25))} aria-label="Zoom out"><Minus size={16} /></button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((value) => Math.min(4, value + .25))} aria-label="Zoom in"><Plus size={16} /></button></div><div className="zoom-viewport"><img src={src} alt={alt} style={{ width: `${zoom * 100}%` }} referrerPolicy="no-referrer" /></div></div>;
}

type Point = { x: number; y: number };
type Rect = Point & { width: number; height: number };
type Tool = "pan" | "crop";

export function FloorPlanCropper({ src, onAnalyze, onAnalyzeError, labels }: { src: string; onAnalyze: (dataUrl: string, imageData: ImageData) => void; onAnalyzeError?: (message: string) => void; labels?: { instruction?: string; action?: string; pan?: string; crop?: string } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const loadTokenRef = useRef(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [tool, setTool] = useState<Tool>("pan");
  const [start, setStart] = useState<Point>();
  const [panStart, setPanStart] = useState<{ pointer: Point; offset: Point }>();
  const [selection, setSelection] = useState<Rect>();
  const [ready, setReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f4f4ef";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const draw = () => {
    const canvas = canvasRef.current; const image = imageRef.current;
    if (!canvas || !image) { clearCanvas(); return; }
    const context = canvas.getContext("2d"); if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f4f4ef"; context.fillRect(0, 0, canvas.width, canvas.height);
    const fit = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * zoom;
    const width = image.naturalWidth * fit; const height = image.naturalHeight * fit;
    context.drawImage(image, (canvas.width - width) / 2 + offset.x, (canvas.height - height) / 2 + offset.y, width, height);
    if (selection) { context.fillStyle = "rgba(189,114,84,.16)"; context.strokeStyle = "#bd7254"; context.lineWidth = 3; context.setLineDash([8, 5]); context.fillRect(selection.x, selection.y, selection.width, selection.height); context.strokeRect(selection.x, selection.y, selection.width, selection.height); context.setLineDash([]); }
  };

  useEffect(() => {
    const token = loadTokenRef.current + 1;
    loadTokenRef.current = token;
    imageRef.current = null;
    setReady(false);
    setSelection(undefined);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setTool("pan");
    setStart(undefined);
    setPanStart(undefined);
    setAnalyzing(false);
    clearCanvas();
    const image = new Image(); image.crossOrigin = "anonymous";
    image.onload = () => {
      if (loadTokenRef.current !== token) return;
      imageRef.current = image;
      setReady(true);
      requestAnimationFrame(draw);
    };
    image.onerror = () => {
      if (loadTokenRef.current !== token) return;
      imageRef.current = null;
      setReady(false);
      setAnalyzing(false);
      clearCanvas();
      onAnalyzeError?.("The selected floor-plan image could not be loaded. Please choose another candidate, upload the plan, or draw it manually.");
    };
    image.src = src;
    return () => {
      if (loadTokenRef.current === token) loadTokenRef.current++;
      image.onload = null;
      image.onerror = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);
  useEffect(draw, [zoom, offset, selection, ready]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * event.currentTarget.width / bounds.width, y: (event.clientY - bounds.top) * event.currentTarget.height / bounds.height };
  };
  const changeZoom = (next: number) => { setZoom(next); setSelection(undefined); };
  const analyze = () => {
    const canvas = canvasRef.current; const image = imageRef.current; if (!canvas || !image || !selection) return;
    setAnalyzing(true);
    const token = loadTokenRef.current;
    const watchdog = window.setTimeout(() => setAnalyzing(false), 12000);
    window.requestAnimationFrame(() => window.setTimeout(() => {
      let handedOff = false;
      try {
        if (loadTokenRef.current !== token) return;
        const fit = Math.min(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight) * zoom;
        const dx = (canvas.width - image.naturalWidth * fit) / 2 + offset.x; const dy = (canvas.height - image.naturalHeight * fit) / 2 + offset.y;
        const sx = Math.max(0, (selection.x - dx) / fit); const sy = Math.max(0, (selection.y - dy) / fit);
        const sw = Math.min(image.naturalWidth - sx, selection.width / fit); const sh = Math.min(image.naturalHeight - sy, selection.height / fit);
        if (sw <= 0 || sh <= 0) throw new Error("Select an area inside the floor plan before creating the 3D estimate.");
        const maxPixels = 20_000;
        const scale = Math.min(1, Math.sqrt(maxPixels / Math.max(1, sw * sh)));
        const output = document.createElement("canvas"); output.width = Math.max(1, Math.round(sw * scale)); output.height = Math.max(1, Math.round(sh * scale));
        const context = output.getContext("2d", { willReadFrequently: true }); if (!context) throw new Error("The browser could not prepare the selected area for analysis.");
        context.drawImage(image, sx, sy, sw, sh, 0, 0, output.width, output.height);
        const dataUrl = output.toDataURL("image/png");
        const imageData = context.getImageData(0, 0, output.width, output.height);
        handedOff = true;
        setAnalyzing(false);
        window.clearTimeout(watchdog);
        window.setTimeout(() => {
          try {
            onAnalyze(dataUrl, imageData);
          } catch (error) {
            onAnalyzeError?.(error instanceof Error ? error.message : "The selected area could not be converted into a 3D estimate.");
          }
        }, 0);
      } catch (error) {
        onAnalyzeError?.(error instanceof Error ? error.message : "The selected area could not be converted into a 3D estimate.");
      } finally {
        window.clearTimeout(watchdog);
        if (!handedOff) setAnalyzing(false);
      }
    }, 0));
  };

  return <><div className="crop-tool"><div className="zoom-toolbar"><span><Crop size={15} /> {ready ? labels?.instruction ?? "Move the plan, then crop the unit area" : "Loading floor plan..."}</span><div className="crop-mode-switch"><button className={tool === "pan" ? "active" : ""} onClick={() => setTool("pan")}><Hand size={15} /> {labels?.pan ?? "Pan"}</button><button className={tool === "crop" ? "active" : ""} onClick={() => setTool("crop")}><Crop size={15} /> {labels?.crop ?? "Crop"}</button></div><button onClick={() => changeZoom(Math.max(1, zoom - .25))} aria-label="Zoom out"><Minus size={16} /></button><strong>{Math.round(zoom * 100)}%</strong><button onClick={() => changeZoom(Math.min(3, zoom + .25))} aria-label="Zoom in"><Plus size={16} /></button></div><canvas className={`${tool}-mode${panStart ? " dragging" : ""}`} ref={canvasRef} width={760} height={460} onPointerDown={(event) => { if (!ready || analyzing) return; event.currentTarget.setPointerCapture(event.pointerId); const p = point(event); if (tool === "pan") setPanStart({ pointer: p, offset }); else { setStart(p); setSelection({ ...p, width: 0, height: 0 }); } }} onPointerMove={(event) => { if (!ready || analyzing) return; const end = point(event); if (tool === "pan" && panStart) setOffset({ x: panStart.offset.x + end.x - panStart.pointer.x, y: panStart.offset.y + end.y - panStart.pointer.y }); else if (tool === "crop" && start) setSelection({ x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) }); }} onPointerUp={() => { setStart(undefined); setPanStart(undefined); }} onPointerCancel={() => { setStart(undefined); setPanStart(undefined); }} /></div><div className="crop-action-row"><button className="button primary" disabled={!ready || analyzing || !selection || selection.width < 20 || selection.height < 20} onClick={analyze}><ScanLine size={17} /> {analyzing ? "Creating 3D estimate..." : labels?.action ?? "Create estimated 3D from selected area"}</button></div></>;
}
