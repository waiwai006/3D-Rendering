"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronRight, ExternalLink, FileSearch, Home, Info, Loader2, MapPin, PenTool, RotateCcw, Save, ShieldCheck, Upload, X } from "lucide-react";
import { ManualFloorPlan } from "@/components/editor/ManualFloorPlan";
import { FloorPlanCropper, PlanZoomViewer } from "@/components/editor/PlanImageTools";
import { I18nBridge, type Language } from "@/components/I18nBridge";
import { PropertyViewer } from "@/components/viewer/PropertyViewer";
import { sampleLayout } from "@/data/sample-layout";
import { buildManualLayout, type DrawnRoom } from "@/lib/manual-layout";
import { buildEstimatedLayoutFromCrop } from "@/lib/image-floorplan";
import type { FloorPlanCandidate, PropertySearchResponse, SourceCoverage } from "@/lib/property-search";
import { isPropertyLayout, ROOM_LABELS, SOURCE_LABELS, validateLayout, type PropertyLayout, type RoomType } from "@/lib/layout-schema";

type Step = "details" | "layout" | "explore";
type StartMode = "address" | "upload" | "draw";
type AreaUnit = "sqft" | "sqm";
const STORAGE_KEY = "harbour-home-planner-project-v2";
const SQFT_PER_SQM = 10.7639;

function cloneSample(): PropertyLayout {
  return JSON.parse(JSON.stringify(sampleLayout)) as PropertyLayout;
}

function blankProject(): PropertyLayout {
  return {
    schemaVersion: "1.0",
    projectId: `project-${Date.now()}`,
    property: { name: "", address: "", sourceType: "manual", confidence: .2 },
    unit: {}, rooms: [], walls: [], doors: [], windows: [], notes: [],
  };
}

function Confidence({ value }: { value: number }) {
  const label = value >= .9 ? "High" : value >= .75 ? "Needs review" : "Low";
  return <span className="confidence-wrap"><span className={`confidence ${label === "High" ? "high" : label === "Low" ? "low" : "review"}`}>{Math.round(value * 100)}% · {label}</span><button className="confidence-info" aria-label="What does confidence mean?"><Info size={13} /><span role="tooltip">Confidence estimates how reliable the source match or inferred geometry is—not measurement accuracy. Low is below 75%, Needs review is 75–89%, and High is 90% or above.</span></button></span>;
}

export function Workspace() {
  const [step, setStep] = useState<Step>("details");
  const [language, setLanguage] = useState<Language>("en");
  const [mode, setMode] = useState<StartMode>("address");
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sqft");
  const [layout, setLayout] = useState<PropertyLayout>(blankProject);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [savedAt, setSavedAt] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [searchState, setSearchState] = useState<"idle" | "searching" | "done">("idle");
  const [candidates, setCandidates] = useState<FloorPlanCandidate[]>([]);
  const [searchWarnings, setSearchWarnings] = useState<string[]>([]);
  const [sourceCoverage, setSourceCoverage] = useState<SourceCoverage[]>([]);
  const [pendingCandidate, setPendingCandidate] = useState<FloorPlanCandidate>();
  const [planName, setPlanName] = useState<string>();
  const [planPreviewUrl, setPlanPreviewUrl] = useState<string>();
  const [referencePlanUrl, setReferencePlanUrl] = useState<string>();
  const localPlanUrl = useRef<string | undefined>(undefined);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed: unknown = JSON.parse(saved);
      if (isPropertyLayout(parsed) && validateLayout(parsed).length === 0) {
        setLayout(parsed);
        setSelectedRoomId(parsed.rooms[0]?.id ?? "");
        setNotice("Your saved browser project was restored.");
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setNotice("An incompatible saved project was cleared safely.");
      }
    } catch {
      setNotice("Saved data could not be read, so a fresh project was opened.");
    }
  }, []);

  useEffect(() => () => { if (localPlanUrl.current) URL.revokeObjectURL(localPlanUrl.current); }, []);

  const selectedRoom = useMemo(() => layout.rooms.find((room) => room.id === selectedRoomId) ?? layout.rooms[0], [layout.rooms, selectedRoomId]);
  const displayedArea = layout.unit.saleableAreaSqFt ? (areaUnit === "sqft" ? layout.unit.saleableAreaSqFt : layout.unit.saleableAreaSqFt / SQFT_PER_SQM) : "";

  const setProperty = (key: "name" | "address", value: string) => setLayout((current) => ({ ...current, property: { ...current.property, [key]: value } }));
  const setUnit = (key: "tower" | "block" | "floor" | "flat", value: string) => setLayout((current) => ({ ...current, unit: { ...current.unit, [key]: value } }));
  const setArea = (value: string) => {
    const number = Number(value);
    setLayout((current) => ({ ...current, unit: { ...current.unit, saleableAreaSqFt: number > 0 ? Number((areaUnit === "sqft" ? number : number * SQFT_PER_SQM).toFixed(2)) : undefined } }));
  };

  const updateRoom = (key: "name" | "type", value: string) => setLayout((current) => ({
    ...current,
    rooms: current.rooms.map((room) => room.id !== selectedRoom.id ? room : key === "name" ? { ...room, name: value } : { ...room, type: value as RoomType }),
  }));

  const searchPublicSources = async () => {
    if (!layout.property.name.trim() && !layout.property.address.trim()) {
      setNotice("Enter an estate name or address before searching public sources.");
      return;
    }
    setSearchState("searching");
    setCandidates([]);
    setSearchWarnings([]);
    setPendingCandidate(undefined);
    try {
      const response = await fetch("/api/property-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estate: layout.property.name, address: layout.property.address, ...layout.unit }),
      });
      const result = await response.json() as PropertySearchResponse & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Search failed");
      setCandidates(result.candidates);
      setSearchWarnings(result.warnings);
      setSourceCoverage(result.sourceCoverage ?? []);
    } catch (error) {
      setSearchWarnings([error instanceof Error ? error.message : "Search failed. Please upload or draw the floor plan."]);
    } finally {
      setSearchState("done");
    }
  };

  const confirmCandidate = (candidate: FloorPlanCandidate) => {
    setLayout((current) => ({ ...current, property: { ...current.property, sourceType: candidate.sourceType, sourceUrl: candidate.sourceUrl, confidence: candidate.confidence } }));
    setPlanName(candidate.title);
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(candidate.imageUrl)}`;
    setPlanPreviewUrl(proxyUrl);
    setReferencePlanUrl(proxyUrl);
    setPendingCandidate(undefined);
    setMode("upload");
    setNotice("Plan confirmed as a tracing reference. Trace its room boundaries, then verify dimensions before 3D generation.");
  };

  const analyzeCrop = (dataUrl: string, imageData: ImageData) => {
    const estimated = buildEstimatedLayoutFromCrop(imageData, layout);
    setLayout(estimated);
    setSelectedRoomId(estimated.rooms[0].id);
    setPlanPreviewUrl(dataUrl);
    setStep("layout");
    setNotice("A low-confidence 3D estimate was created from the selected image area. Correct its scale, walls and openings before relying on it.");
  };

  const handlePlanUpload = (file?: File) => {
    if (!file) return;
    if (localPlanUrl.current) URL.revokeObjectURL(localPlanUrl.current);
    setPlanName(file.name);
    const objectUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    localPlanUrl.current = objectUrl;
    setPlanPreviewUrl(objectUrl);
    setReferencePlanUrl(objectUrl);
    setMode("upload");
  };

  const useDrawnPlan = (rooms: DrawnRoom[]) => {
    const manual = buildManualLayout(rooms, layout);
    setLayout(manual);
    setSelectedRoomId(manual.rooms[0]?.id ?? "");
    setStep("layout");
    setNotice(planName ? `Traced layout created from ${planName}. Please verify every measurement.` : "Manual layout created. Please verify every measurement.");
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setNotice("Project saved in this browser.");
    } catch {
      setNotice("This browser could not save the project. Your current changes are still visible.");
    }
  };

  const reset = () => {
    const fresh = cloneSample();
    setLayout(fresh);
    setSelectedRoomId("living");
    setNotice("Demo layout restored.");
  };

  return (
    <main className="app-shell" id="top">
      <I18nBridge language={language} />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="FlatForm home"><span className="brand-mark"><Home size={18} /></span><span>FlatForm</span></a>
        <div className="top-actions"><div className="language-switch" aria-label="Language"><button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button><button className={language === "zh-Hant" ? "active" : ""} onClick={() => setLanguage("zh-Hant")}>繁</button><button className={language === "zh-Hans" ? "active" : ""} onClick={() => setLanguage("zh-Hans")}>简</button></div><span className="prototype-pill">MVP prototype</span><button className="button ghost" onClick={save}><Save size={16} /> Save project</button></div>
      </header>

      <nav className="stepper" aria-label="Project steps">
        {(["details", "layout", "explore"] as Step[]).map((item, index) => <button key={item} className={step === item ? "active" : ""} onClick={() => item === "details" || layout.rooms.length ? setStep(item) : undefined}><span>{index + 1}</span>{item === "details" ? "Find or create" : item === "layout" ? "Review layout" : "Explore in 3D"}</button>)}
      </nav>

      {notice && <button className="notice" onClick={() => setNotice(undefined)}>{notice}<span>Dismiss</span></button>}

      {step === "details" && (
        <section className="onboarding-page">
          <div className="onboarding-heading"><p className="eyebrow">Start from the best available evidence</p><h1>How would you like to create your floor plan?</h1><p>Use an address to look for a public plan, upload a plan you already have, or draw the flat manually.</p></div>
          <div className="choice-tabs" role="tablist">
            <button className={mode === "address" ? "active" : ""} onClick={() => setMode("address")}><MapPin size={19} /><span><strong>Property details</strong><small>Search public sources</small></span></button>
            <button className={mode === "upload" ? "active" : ""} onClick={() => setMode("upload")}><Upload size={19} /><span><strong>Upload floor plan</strong><small>Image or PDF</small></span></button>
            <button className={mode === "draw" ? "active" : ""} onClick={() => setMode("draw")}><PenTool size={19} /><span><strong>Draw manually</strong><small>No plan available</small></span></button>
          </div>

          {mode === "address" && <div className="card source-form">
            <div className="card-heading"><span className="icon-tile"><Building2 size={20} /></span><div><h2>Locate the exact property</h2><p>Estate or address is required for lookup. Tower, block, floor and flat are optional but improve matching.</p></div></div>
            <div className="form-grid"><label>Estate / development<input value={layout.property.name} onChange={(event) => setProperty("name", event.target.value)} placeholder="e.g. Mei Foo Sun Chuen / 美孚新邨" /></label><label>Address<input value={layout.property.address} onChange={(event) => setProperty("address", event.target.value)} placeholder="Street name and number" /></label><label>Tower<input value={layout.unit.tower ?? ""} onChange={(event) => setUnit("tower", event.target.value)} placeholder="Optional" /></label><label>Block<input value={layout.unit.block ?? ""} onChange={(event) => setUnit("block", event.target.value)} placeholder="Optional" /></label><label>Floor<input value={layout.unit.floor ?? ""} onChange={(event) => setUnit("floor", event.target.value)} placeholder="Optional" /></label><label>Flat / unit<input value={layout.unit.flat ?? ""} onChange={(event) => setUnit("flat", event.target.value)} placeholder="Optional" /></label></div>
            <div className="area-row"><label>Saleable area<div className="area-control"><input type="number" min="1" step="0.1" value={typeof displayedArea === "number" ? Number(displayedArea.toFixed(2)) : ""} onChange={(event) => setArea(event.target.value)} /><div className="unit-switch"><button className={areaUnit === "sqft" ? "active" : ""} onClick={() => setAreaUnit("sqft")} type="button">sq ft</button><button className={areaUnit === "sqm" ? "active" : ""} onClick={() => setAreaUnit("sqm")} type="button">m²</button></div></div></label></div>
            <button className="button primary wide" disabled={searchState === "searching"} onClick={searchPublicSources}>{searchState === "searching" ? <Loader2 className="spin" size={17} /> : <FileSearch size={17} />} {searchState === "searching" ? "Searching public sources..." : "Search and match floor plans"}</button>
            {searchState === "idle" && <div className="lookup-result"><ShieldCheck size={19} /><div><strong>Automatic source matching</strong><p>FlatForm searches accessible estate indexes and floor-plan metadata. Official SRPE remains the highest-authority source; agency plans are marked secondary.</p><div className="lookup-links"><a href="https://www.srpe.gov.hk/opip/" target="_blank" rel="noreferrer">SRPE official database</a><a href="https://www.bd.gov.hk/en/resources/online-tools/BRAVO-online-building-records/index.html" target="_blank" rel="noreferrer">Older buildings: BRAVO</a></div></div></div>}
            {searchState === "done" && <div className="search-results"><div className="results-heading"><div><strong>{candidates.length ? `${candidates.length} candidate plan${candidates.length === 1 ? "" : "s"} found` : "No matching plan found"}</strong><span>Review the image—estate-level results may contain several unit types.</span></div><button className="button ghost small" onClick={searchPublicSources}><RotateCcw size={14} /> Search again</button></div>{candidates.length > 0 && <div className="candidate-grid">{candidates.map((candidate) => <article className="candidate-card" key={candidate.id}><div className="candidate-image"><img src={candidate.imageUrl} alt={`${candidate.estateName} floor-plan candidate`} referrerPolicy="no-referrer" /></div><div className="candidate-body"><div className="candidate-meta"><span>{candidate.source}</span><Confidence value={candidate.confidence} /></div><h3>{candidate.title}</h3><p>Matched: {candidate.matchedFields.join(", ")}. Visual confirmation required.</p><div className="candidate-actions"><a href={candidate.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Source</a><button className="button primary small" onClick={() => setPendingCandidate(candidate)}>Review this plan</button></div></div></article>)}</div>}{searchWarnings.map((warning) => <p className="search-warning" key={warning}>{warning}</p>)}{sourceCoverage.length > 0 && <details className="source-coverage"><summary>Source coverage · {sourceCoverage.filter((source) => source.status === "searched").length} automatic, {sourceCoverage.length - sourceCoverage.filter((source) => source.status === "searched").length} reference sources</summary><div>{sourceCoverage.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.name}><span className={`coverage-status ${source.status}`}>{source.status === "searched" ? "Searched" : source.status === "limited" ? "Limited" : "Manual"}</span><strong>{source.name}</strong><small>{source.note}</small><ExternalLink size={13} /></a>)}</div></details>}<div className="fallback-row"><span>{candidates.length ? "None of these match?" : "Continue without a public match"}</span><button onClick={() => setMode("upload")}>Upload a plan</button><button onClick={() => setMode("draw")}>Draw it manually</button></div></div>}
            {pendingCandidate && <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm floor plan"><div className="confirm-dialog"><button className="dialog-close" aria-label="Close confirmation" onClick={() => setPendingCandidate(undefined)}><X size={18} /></button><p className="eyebrow">Confirm before 3D use</p><h2>Does this plan match your property?</h2><PlanZoomViewer src={pendingCandidate.imageUrl} alt={`${pendingCandidate.estateName} plan for confirmation`} /><div className="confirm-facts"><span><strong>Estate</strong>{pendingCandidate.estateName}</span><span><strong>Source</strong>{pendingCandidate.source} · secondary</span><span><strong>Matched</strong>{pendingCandidate.matchedFields.join(", ")}</span></div><p>Zoom in and check tower/block, flat, orientation and saleable area. Confirmation uses this image as a tracing reference; it does not make the source official.</p><div className="dialog-actions"><button className="button ghost" onClick={() => setPendingCandidate(undefined)}>No, choose another</button><button className="button primary" onClick={() => confirmCandidate(pendingCandidate)}><Check size={16} /> Yes, use this plan</button></div></div></div>}
          </div>}

          {mode === "upload" && <div className="card upload-workspace"><div className="card-heading"><span className="icon-tile cool"><Upload size={20} /></span><div><h2>Upload, crop or trace a floor plan</h2><p>The file stays in this browser. Image analysis produces an estimate, not construction geometry.</p></div></div><label className="drop-zone plan-upload"><Upload size={25} /><strong>{planName ?? "Choose a floor-plan image or PDF"}</strong><span>PNG, JPEG, WEBP or PDF</span><input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => handlePlanUpload(event.target.files?.[0])} /></label>{planName && !planPreviewUrl && <p className="upload-warning">PDF selected. Export the relevant page as an image for cropping, or draw on the blank grid below.</p>}{planPreviewUrl && <><FloorPlanCropper src={planPreviewUrl} onAnalyze={analyzeCrop} /><div className="tool-divider"><span>or trace rooms manually</span></div></>}<ManualFloorPlan overlayUrl={planPreviewUrl} onUse={useDrawnPlan} /></div>}

          {mode === "draw" && <div className="card upload-workspace"><div className="card-heading"><span className="icon-tile cool"><PenTool size={20} /></span><div><h2>Draw the floor plan manually</h2><p>Drag each room on the measured grid. You can rename and classify rooms on the next step.</p></div></div><ManualFloorPlan onUse={useDrawnPlan} /></div>}
        </section>
      )}

      {step === "layout" && selectedRoom && (
        <section className="workspace-page">
          <div className="workspace-heading"><div><p className="eyebrow">Review before generating</p><h1>Confirm the rooms and measurements</h1><p>Select a room to rename or classify it. Redraw if the measured boundaries are wrong.</p></div><div className="heading-actions"><button className="button ghost" onClick={() => setStep("details")}><PenTool size={16} /> Redraw</button><button className="button ghost" onClick={reset}><RotateCcw size={16} /> Use demo</button></div></div>
          <div className="source-banner"><div><ShieldCheck size={19} /><strong>{SOURCE_LABELS[layout.property.sourceType]}</strong><span>This layout requires user confirmation and is not construction-ready.</span></div><Confidence value={layout.property.confidence} /></div>
          {referencePlanUrl && <details className="reference-plan-panel"><summary>Original source floor plan</summary><p>Use this image to compare room labels, orientation and measurements while reviewing the estimate.</p><PlanZoomViewer src={referencePlanUrl} alt={`${planName ?? "Original"} floor plan`} /></details>}
          <div className="editor-grid">
            <aside className="card room-list"><div className="section-label">Rooms · {layout.rooms.length}</div>{layout.rooms.map((room) => <button key={room.id} className={room.id === selectedRoom.id ? "selected" : ""} onClick={() => setSelectedRoomId(room.id)}><span className={`room-dot ${room.type}`} /><span><strong>{room.name}</strong><small>{room.dimensions.widthMeters.toFixed(1)} × {room.dimensions.lengthMeters.toFixed(1)} m</small></span><ChevronRight size={16} /></button>)}</aside>
            <div className="card room-editor"><div className="card-heading"><div><p className="section-label">Selected room</p><h2>{selectedRoom.name}</h2></div><Confidence value={selectedRoom.confidence} /></div><label>Room name<input value={selectedRoom.name} onChange={(event) => updateRoom("name", event.target.value)} /></label><label>Room type<select value={selectedRoom.type} onChange={(event) => updateRoom("type", event.target.value)}>{Object.entries(ROOM_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="split-fields"><label>Width (m)<input readOnly value={selectedRoom.dimensions.widthMeters} /></label><label>Length (m)<input readOnly value={selectedRoom.dimensions.lengthMeters} /></label></div><p className="small-note">To change boundaries, return to the drawing step so floors and walls remain aligned.</p></div>
            <div className="card mini-preview"><PropertyViewer layout={layout} selectedRoomId={selectedRoom.id} onSelectRoom={setSelectedRoomId} /></div>
          </div>
          <div className="bottom-action"><span>{savedAt ? `Last saved at ${savedAt}` : "Changes are not saved yet"}</span><button className="button primary" onClick={() => setStep("explore")}>Generate 3D view <ChevronRight size={17} /></button></div>
        </section>
      )}

      {step === "explore" && selectedRoom && (
        <section className="viewer-page">
          <div className="viewer-toolbar"><div><p className="eyebrow">Interactive model</p><h1>{layout.property.name || "Untitled property"}</h1><p>{layout.property.address || "Address not added"} · {layout.unit.saleableAreaSqFt ? areaUnit === "sqft" ? `${Number(layout.unit.saleableAreaSqFt.toFixed(1))} sq ft` : `${Number((layout.unit.saleableAreaSqFt / SQFT_PER_SQM).toFixed(1))} m²` : "Area unknown"}</p></div><div className="viewer-actions"><button className="button ghost" onClick={() => setStep("layout")}>Edit layout</button><button className="button primary" onClick={save}><Save size={16} /> Save</button></div></div>
          <div className="source-banner compact"><div><ShieldCheck size={19} /><strong>{SOURCE_LABELS[layout.property.sourceType]}</strong><span>Planning-only approximation</span></div><Confidence value={layout.property.confidence} /></div>
          <div className="full-viewer"><PropertyViewer layout={layout} selectedRoomId={selectedRoom.id} onSelectRoom={setSelectedRoomId} /><div className="viewer-hint">Drag to orbit · Scroll to zoom · Select a room to focus</div><div className="room-chips">{layout.rooms.map((room) => <button key={room.id} className={room.id === selectedRoom.id ? "active" : ""} onClick={() => setSelectedRoomId(room.id)}>{room.name}</button>)}</div></div>
        </section>
      )}
    </main>
  );
}
