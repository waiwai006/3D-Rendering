"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Building2, Check, ChevronRight, Cloud, Copy, ExternalLink, FileSearch, Loader2, LogIn, LogOut, MapPin, Move, PackagePlus, PenTool, Plus, RotateCcw, RotateCw, Save, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { ManualFloorPlan } from "@/components/editor/ManualFloorPlan";
import { FloorPlanCropper, PlanZoomViewer } from "@/components/editor/PlanImageTools";
import { I18nBridge, type Language } from "@/components/I18nBridge";
import { PropertyViewer } from "@/components/viewer/PropertyViewer";
import { sampleLayout } from "@/data/sample-layout";
import { buildManualLayout, type DrawnRoom } from "@/lib/manual-layout";
import { buildEstimatedLayoutFromCrop } from "@/lib/image-floorplan";
import { FURNISHING_CATALOG, catalogItem } from "@/lib/furnishing-catalog";
import type { FloorPlanCandidate, PropertySearchResponse, SourceCoverage } from "@/lib/property-search";
import { isPropertyLayout, ROOM_LABELS, validateLayout, type LayoutWall, type PropertyLayout, type RoomType } from "@/lib/layout-schema";

type Step = "details" | "layout" | "explore";
type StartMode = "address" | "upload" | "draw";
type AreaUnit = "sqft" | "sqm";
type AccountUser = { name?: string; email?: string; picture?: string };
const STORAGE_KEY = "hk-property-design-active-project-v3";
const PROJECT_INDEX_KEY = "hk-property-design-project-index-v1";
const SQFT_PER_SQM = 10.7639;

type SavedProjectSummary = { id: string; name: string; planName?: string; updatedAt: string };

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

function projectStorageKey(id: string) {
  return `hk-property-design-project-${id}`;
}

function projectDisplayName(layout: PropertyLayout, planName?: string) {
  return layout.property.name || planName || `Floor plan ${new Date().toLocaleDateString()}`;
}

export function Workspace() {
  const [step, setStep] = useState<Step>("details");
  const [language, setLanguage] = useState<Language>("en");
  const [mode, setMode] = useState<StartMode>("address");
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sqft");
  const [layout, setLayout] = useState<PropertyLayout>(blankProject);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [savedAt, setSavedAt] = useState<string>();
  const [savedProjects, setSavedProjects] = useState<SavedProjectSummary[]>([]);
  const [loadProjectId, setLoadProjectId] = useState("");
  const [notice, setNotice] = useState<string>();
  const [searchState, setSearchState] = useState<"idle" | "searching" | "done">("idle");
  const [candidates, setCandidates] = useState<FloorPlanCandidate[]>([]);
  const [searchWarnings, setSearchWarnings] = useState<string[]>([]);
  const [sourceCoverage, setSourceCoverage] = useState<SourceCoverage[]>([]);
  const [pendingCandidate, setPendingCandidate] = useState<FloorPlanCandidate>();
  const [planName, setPlanName] = useState<string>();
  const [planPreviewUrl, setPlanPreviewUrl] = useState<string>();
  const [referencePlanUrl, setReferencePlanUrl] = useState<string>();
  const [pendingCatalogId, setPendingCatalogId] = useState<string>();
  const [selectedFurnishingId, setSelectedFurnishingId] = useState<string>();
  const [movingFurnishingId, setMovingFurnishingId] = useState<string>();
  const [selectedWallId, setSelectedWallId] = useState<string>();
  const [wallStart, setWallStart] = useState<{ x: number; y: number }>();
  const [wallMode, setWallMode] = useState(false);
  const [accountUser, setAccountUser] = useState<AccountUser | null>(null);
  const [authConfigured, setAuthConfigured] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);
  const localPlanUrl = useRef<string | undefined>(undefined);

  useEffect(() => {
    try {
      const index = JSON.parse(localStorage.getItem(PROJECT_INDEX_KEY) ?? "[]") as SavedProjectSummary[];
      if (Array.isArray(index)) setSavedProjects(index);
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

  useEffect(() => {
    let active = true;
    fetch("/api/session").then((response) => response.json()).then(async (session: { configured: boolean; user: AccountUser | null }) => {
      if (!active) return;
      setAuthConfigured(session.configured);
      setAccountUser(session.user);
      if (!session.user) return;
      const response = await fetch("/api/project");
      if (!response.ok || !active) return;
      const result = await response.json() as { project?: { layout?: unknown; planName?: string; referencePlan?: string } | null; projects?: { layout?: unknown; planName?: string; referencePlan?: string; updatedAt: string }[] };
      if (Array.isArray(result.projects)) {
        const cloudSummaries: SavedProjectSummary[] = [];
        for (const project of result.projects) {
          if (!project.layout || !isPropertyLayout(project.layout) || validateLayout(project.layout).length > 0) continue;
          localStorage.setItem(projectStorageKey(project.layout.projectId), JSON.stringify({ layout: project.layout, planName: project.planName, referencePlanUrl: project.referencePlan }));
          cloudSummaries.push({ id: project.layout.projectId, name: projectDisplayName(project.layout, project.planName), planName: project.planName, updatedAt: project.updatedAt });
        }
        if (cloudSummaries.length) {
          setSavedProjects((current) => {
            const merged = [...cloudSummaries, ...current.filter((local) => !cloudSummaries.some((cloud) => cloud.id === local.id))].slice(0, 30);
            localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(merged));
            return merged;
          });
        }
      }
      if (result.project?.layout && isPropertyLayout(result.project.layout) && validateLayout(result.project.layout).length === 0) {
        setLayout(result.project.layout);
        setSelectedRoomId(result.project.layout.rooms[0]?.id ?? "");
        setPlanName(result.project.planName);
        setReferencePlanUrl(result.project.referencePlan);
        setNotice("Your latest cloud project was restored.");
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

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

  const updateRoomDimension = (key: "widthMeters" | "lengthMeters", value: string) => {
    if (!selectedRoom) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setLayout((current) => ({
      ...current,
      rooms: current.rooms.map((room) => room.id === selectedRoom.id ? { ...room, dimensions: { ...room.dimensions, [key]: Number(parsed.toFixed(2)) } } : room),
    }));
  };

  const addWall = (edge: "top" | "right" | "bottom" | "left") => {
    if (!selectedRoom) return;
    const x = selectedRoom.position.x;
    const y = selectedRoom.position.y;
    const w = selectedRoom.dimensions.widthMeters;
    const l = selectedRoom.dimensions.lengthMeters;
    const edges = {
      top: [{ x, y }, { x: x + w, y }],
      right: [{ x: x + w, y }, { x: x + w, y: y + l }],
      bottom: [{ x, y: y + l }, { x: x + w, y: y + l }],
      left: [{ x, y }, { x, y: y + l }],
    } as const;
    const [start, end] = edges[edge];
    const wall: LayoutWall = { id: `wall-${Date.now()}-${edge}`, start, end, heightMeters: selectedRoom.dimensions.heightMeters, thicknessMeters: .12 };
    setLayout((current) => ({ ...current, walls: [...current.walls, wall] }));
    setSelectedWallId(wall.id);
  };

  const removeWall = (wallId: string) => {
    setLayout((current) => ({
      ...current,
      walls: current.walls.filter((wall) => wall.id !== wallId),
      doors: current.doors.filter((door) => door.wallId !== wallId),
      windows: current.windows.filter((window) => window.wallId !== wallId),
    }));
    setSelectedWallId(undefined);
  };

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
    setReferencePlanUrl(dataUrl);
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

  const save = async () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      const updatedAt = new Date().toISOString();
      const projectName = projectDisplayName(layout, planName);
      const projectId = layout.projectId;
      const summary: SavedProjectSummary = { id: projectId, name: projectName, planName, updatedAt };
      const nextProjects = [summary, ...savedProjects.filter((project) => project.id !== projectId)].slice(0, 25);
      localStorage.setItem(projectStorageKey(projectId), JSON.stringify({ layout, planName, referencePlanUrl }));
      localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(nextProjects));
      setSavedProjects(nextProjects);
      setLoadProjectId(projectId);
      setSavedAt(new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      if (!accountUser) {
        setNotice(authConfigured ? "Floor plan saved in this browser. Sign in to back it up to the cloud." : "Floor plan saved in this browser.");
        return;
      }
      setCloudSaving(true);
      let referencePlan = referencePlanUrl;
      if (referencePlan?.startsWith("blob:")) {
        const blob = await fetch(referencePlan).then((response) => response.blob());
        referencePlan = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
      }
      const response = await fetch("/api/project", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ layout, planName, referencePlan, projectName }) });
      if (!response.ok) throw new Error((await response.json() as { error?: string }).error ?? "Cloud save failed.");
      const result = await response.json() as { projects?: SavedProjectSummary[] };
      if (result.projects) setSavedProjects(result.projects);
      setNotice("Project saved securely to your account and this browser.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The project could not be saved. Your current changes are still visible.");
    } finally {
      setCloudSaving(false);
    }
  };

  const loadSavedProject = async () => {
    if (!loadProjectId) return;
    try {
      let saved = localStorage.getItem(projectStorageKey(loadProjectId));
      if (!saved && accountUser) {
        const response = await fetch(`/api/project?projectId=${encodeURIComponent(loadProjectId)}`);
        if (response.ok) {
          const result = await response.json() as { project?: { layout?: unknown; planName?: string; referencePlan?: string } | null };
          if (result.project) saved = JSON.stringify({ layout: result.project.layout, planName: result.project.planName, referencePlanUrl: result.project.referencePlan });
        }
      }
      if (!saved) {
        setNotice("That saved floor plan could not be found in this browser.");
        return;
      }
      const parsed = JSON.parse(saved) as { layout?: unknown; planName?: string; referencePlanUrl?: string };
      if (!parsed.layout || !isPropertyLayout(parsed.layout) || validateLayout(parsed.layout).length > 0) {
        setNotice("That saved floor plan is no longer compatible.");
        return;
      }
      setLayout(parsed.layout);
      setPlanName(parsed.planName);
      setReferencePlanUrl(parsed.referencePlanUrl);
      setPlanPreviewUrl(parsed.referencePlanUrl);
      setSelectedRoomId(parsed.layout.rooms[0]?.id ?? "");
      setStep(parsed.layout.rooms.length ? "layout" : "details");
      setNotice("Saved floor plan loaded.");
    } catch {
      setNotice("That saved floor plan could not be loaded.");
    }
  };

  const saveAsNewCopy = () => {
    const copy = { ...layout, projectId: `project-${Date.now()}` };
    setLayout(copy);
    setSavedAt(undefined);
    setLoadProjectId("");
    setNotice("New copy created. Press Save to store it as a separate floor plan.");
  };

  const reset = () => {
    const fresh = cloneSample();
    setLayout(fresh);
    setSelectedRoomId("living");
    setNotice("Demo layout restored.");
  };

  const placeFurnishing = (roomId: string, x: number, y: number) => {
    if (wallMode) {
      if (!wallStart) {
        setWallStart({ x, y });
        setNotice("Wall start set. Click another floor point to finish the wall.");
        return;
      }
      const wall: LayoutWall = { id: `wall-${Date.now()}`, start: wallStart, end: { x, y }, heightMeters: selectedRoom?.dimensions.heightMeters ?? 2.55, thicknessMeters: .12 };
      setLayout((current) => ({ ...current, walls: [...current.walls, wall] }));
      setSelectedWallId(wall.id);
      setWallStart(undefined);
      setWallMode(false);
      setNotice("Wall created. The preview has been updated.");
      return;
    }
    if (!pendingCatalogId && !movingFurnishingId) return;
    const id = `item-${Date.now()}`;
    setLayout((current) => {
      const room = current.rooms.find((candidate) => candidate.id === roomId);
      const movingItem = (current.furnishings ?? []).find((item) => item.id === movingFurnishingId);
      const selectedCatalogId = pendingCatalogId ?? movingItem?.catalogId;
      if (!room || !selectedCatalogId) return current;
      const catalog = catalogItem(selectedCatalogId);
      if (!catalog) return current;
      const halfWidth = Math.min(catalog.dimensions.widthMeters, room.dimensions.widthMeters) / 2;
      const halfDepth = Math.min(catalog.dimensions.depthMeters, room.dimensions.lengthMeters) / 2;
      const position = {
        x: Math.min(room.position.x + room.dimensions.widthMeters - halfWidth, Math.max(room.position.x + halfWidth, x)),
        y: Math.min(room.position.y + room.dimensions.lengthMeters - halfDepth, Math.max(room.position.y + halfDepth, y)),
      };
      if (movingItem) return { ...current, furnishings: (current.furnishings ?? []).map((item) => item.id === movingItem.id ? { ...item, roomId, position } : item) };
      return { ...current, furnishings: [...(current.furnishings ?? []), { id, catalogId: selectedCatalogId, roomId, position, rotationDegrees: 0 }] };
    });
    setSelectedFurnishingId(movingFurnishingId ?? id);
    setPendingCatalogId(undefined);
    setMovingFurnishingId(undefined);
    setNotice("Item placed to scale. Select it in the 3D view to rotate or remove it.");
  };

  const rotateFurnishing = () => {
    if (!selectedFurnishingId) return;
    setLayout((current) => ({ ...current, furnishings: (current.furnishings ?? []).map((item) => item.id === selectedFurnishingId ? { ...item, rotationDegrees: (item.rotationDegrees + 45) % 360 } : item) }));
  };

  const removeFurnishing = () => {
    if (!selectedFurnishingId) return;
    setLayout((current) => ({ ...current, furnishings: (current.furnishings ?? []).filter((item) => item.id !== selectedFurnishingId) }));
    setSelectedFurnishingId(undefined);
    setMovingFurnishingId(undefined);
  };

  return (
    <main className="app-shell" id="top">
      <I18nBridge language={language} />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="HK Property Design home"><span className="brand-mark"><Building2 size={18} /></span><span>HK Property Design</span></a>
        <div className="top-actions"><div className="language-switch" aria-label="Language"><button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button><button className={language === "zh-Hant" ? "active" : ""} onClick={() => setLanguage("zh-Hant")}>繁</button><button className={language === "zh-Hans" ? "active" : ""} onClick={() => setLanguage("zh-Hans")}>简</button></div>{accountUser ? <div className="account-chip"><Cloud size={15} /><span>{accountUser.name ?? accountUser.email ?? "Signed in"}</span><a href="/auth/logout" aria-label="Sign out"><LogOut size={14} /></a></div> : authConfigured ? <a className="button ghost" href="/auth/login"><LogIn size={16} /> Sign in</a> : <button className="button ghost" onClick={() => setNotice("Auth0 credentials are required before account login can be enabled.")}><LogIn size={16} /> Sign in</button>}<button className="button ghost" disabled={cloudSaving} onClick={save}>{cloudSaving ? <Loader2 className="spin" size={16} /> : <Save size={16} />} {accountUser ? "Save to cloud" : "Save floor plan"}</button><button className="button ghost" onClick={saveAsNewCopy}><Copy size={16} /> Save as new</button>{savedProjects.length > 0 && <div className="load-control"><select value={loadProjectId} onChange={(event) => setLoadProjectId(event.target.value)} aria-label="Saved floor plans"><option value="">Load saved plan...</option>{savedProjects.map((project) => <option key={project.id} value={project.id}>{project.name} · {new Date(project.updatedAt).toLocaleDateString()}</option>)}</select><button className="button ghost" disabled={!loadProjectId} onClick={loadSavedProject}>Load</button></div>}</div>
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
            <div className="search-examples"><span>Traditional Chinese examples</span>{["太古城", "美孚新邨", "黃埔花園"].map((example) => <button type="button" key={example} onClick={() => setProperty("name", example)}>{example}</button>)}</div>
            <div className="area-row"><label>Saleable area<div className="area-control"><input type="number" min="1" step="0.1" value={typeof displayedArea === "number" ? Number(displayedArea.toFixed(2)) : ""} onChange={(event) => setArea(event.target.value)} /><div className="unit-switch"><button className={areaUnit === "sqft" ? "active" : ""} onClick={() => setAreaUnit("sqft")} type="button">sq ft</button><button className={areaUnit === "sqm" ? "active" : ""} onClick={() => setAreaUnit("sqm")} type="button">m²</button></div></div></label></div>
            <button className="button primary wide" disabled={searchState === "searching"} onClick={searchPublicSources}>{searchState === "searching" ? <Loader2 className="spin" size={17} /> : <FileSearch size={17} />} {searchState === "searching" ? "Searching public sources..." : "Search and match floor plans"}</button>
            {searchState === "idle" && <div className="lookup-result"><ShieldCheck size={19} /><div><strong>Automatic source matching</strong><p>HK Property Design searches accessible estate indexes and floor-plan metadata. Official SRPE remains the highest-authority source; agency plans are marked secondary.</p><div className="lookup-links"><a href="https://www.srpe.gov.hk/opip/" target="_blank" rel="noreferrer">SRPE official database</a><a href="https://www.bd.gov.hk/en/resources/online-tools/BRAVO-online-building-records/index.html" target="_blank" rel="noreferrer">Older buildings: BRAVO</a></div></div></div>}
            {searchState === "done" && <div className="search-results">
              <div className="results-heading"><div><strong>{candidates.length ? `${candidates.length} candidate plan${candidates.length === 1 ? "" : "s"} found` : "No matching plan found"}</strong><span>Review the image—estate-level results may contain several unit types.</span></div><button className="button ghost small" onClick={searchPublicSources}><RotateCcw size={14} /> Search again</button></div>
              {candidates.length > 0 && <div className="candidate-grid">{candidates.map((candidate) => <article className="candidate-card" key={candidate.id}><div className="candidate-image"><img src={candidate.imageUrl} alt={`${candidate.estateName} floor-plan candidate`} referrerPolicy="no-referrer" /></div><div className="candidate-body"><div className="candidate-meta"><span>{candidate.source}</span></div><h3>{candidate.title}</h3><p>Matched: {candidate.matchedFields.join(", ")}. Visual confirmation required.</p><div className="candidate-actions"><a href={candidate.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Source</a><button className="button primary small" onClick={() => setPendingCandidate(candidate)}>Review this plan</button></div></div></article>)}</div>}
              {searchWarnings.map((warning) => <p className="search-warning" key={warning}>{warning}</p>)}
              {sourceCoverage.length > 0 && <details className="source-coverage"><summary>Source coverage · {sourceCoverage.filter((source) => source.status === "searched").length} automatic, {sourceCoverage.length - sourceCoverage.filter((source) => source.status === "searched").length} reference sources</summary><div>{sourceCoverage.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.name}><span className={`coverage-status ${source.status}`}>{source.status === "searched" ? "Searched" : source.status === "limited" ? "Limited" : "Manual"}</span><strong>{source.name}</strong><small>{source.note}</small><ExternalLink size={13} /></a>)}</div></details>}
              <div className="fallback-row"><span>{candidates.length ? "None of these match?" : "Continue without a public match"}</span><button onClick={() => setMode("upload")}>Upload a plan</button><button onClick={() => setMode("draw")}>Draw it manually</button></div>
            </div>}
            {pendingCandidate && <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm floor plan"><div className="confirm-dialog"><button className="dialog-close" aria-label="Close confirmation" onClick={() => setPendingCandidate(undefined)}><X size={18} /></button><p className="eyebrow">Confirm before 3D use</p><h2>Does this plan match your property?</h2><PlanZoomViewer src={pendingCandidate.imageUrl} alt={`${pendingCandidate.estateName} plan for confirmation`} /><div className="confirm-facts"><span><strong>Estate</strong>{pendingCandidate.estateName}</span><span><strong>Source</strong>{pendingCandidate.source} · secondary</span><span><strong>Matched</strong>{pendingCandidate.matchedFields.join(", ")}</span></div><p>Zoom in and check tower/block, flat, orientation and saleable area. Confirmation uses this image as a tracing reference; it does not make the source official.</p><div className="dialog-actions"><button className="button ghost" onClick={() => setPendingCandidate(undefined)}>No, choose another</button><button className="button primary" onClick={() => confirmCandidate(pendingCandidate)}><Check size={16} /> Yes, use this plan</button></div></div></div>}
          </div>}

          {mode === "upload" && <div className="card upload-workspace"><div className="card-heading"><span className="icon-tile cool"><Upload size={20} /></span><div><h2>Upload, crop or trace a floor plan</h2><p>The file stays in this browser. Image analysis produces an estimate, not construction geometry.</p></div></div><label className="drop-zone plan-upload"><Upload size={25} /><strong>{planName ?? "Choose a floor-plan image or PDF"}</strong><span>PNG, JPEG, WEBP or PDF</span><input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => handlePlanUpload(event.target.files?.[0])} /></label>{planName && !planPreviewUrl && <p className="upload-warning">PDF selected. Export the relevant page as an image for cropping, or draw on the blank grid below.</p>}{planPreviewUrl && <><FloorPlanCropper src={planPreviewUrl} onAnalyze={analyzeCrop} /><div className="tool-divider"><span>or trace rooms manually</span></div></>}<ManualFloorPlan overlayUrl={planPreviewUrl} onUse={useDrawnPlan} /></div>}

          {mode === "draw" && <div className="card upload-workspace"><div className="card-heading"><span className="icon-tile cool"><PenTool size={20} /></span><div><h2>Draw the floor plan manually</h2><p>Drag each room on the measured grid. You can rename and classify rooms on the next step.</p></div></div><ManualFloorPlan onUse={useDrawnPlan} /></div>}
        </section>
      )}

      {step === "layout" && selectedRoom && (
        <section className="workspace-page">
          <div className="workspace-heading"><div><p className="eyebrow">Review before generating</p><h1>Confirm the rooms and measurements</h1><p>Select a room to rename, classify or resize it. The preview updates immediately.</p></div><div className="heading-actions"><button className="button ghost" onClick={() => setStep("details")}><ArrowLeft size={16} /> Back</button><button className="button ghost" onClick={() => setStep("details")}><PenTool size={16} /> Redraw</button><button className="button ghost" onClick={reset}><RotateCcw size={16} /> Use demo</button></div></div>
          {referencePlanUrl && <details className="reference-plan-panel" open><summary>Selected cropped floor plan</summary><p>This shows the cropped or selected plan image used to create the current layout.</p><PlanZoomViewer src={referencePlanUrl} alt={`${planName ?? "Selected"} floor plan`} /></details>}
          <div className="editor-grid">
            <aside className="card room-list"><div className="section-label">Rooms · {layout.rooms.length}</div>{layout.rooms.map((room) => <button key={room.id} className={room.id === selectedRoom.id ? "selected" : ""} onClick={() => setSelectedRoomId(room.id)}><span className={`room-dot ${room.type}`} /><span><strong>{room.name}</strong><small>{room.dimensions.widthMeters.toFixed(1)} × {room.dimensions.lengthMeters.toFixed(1)} m</small></span><ChevronRight size={16} /></button>)}</aside>
            <div className="card room-editor"><div className="card-heading"><div><p className="section-label">Selected room</p><h2>{selectedRoom.name}</h2></div></div><label>Room name<input value={selectedRoom.name} onChange={(event) => updateRoom("name", event.target.value)} /></label><label>Room type<select value={selectedRoom.type} onChange={(event) => updateRoom("type", event.target.value)}>{Object.entries(ROOM_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="split-fields"><label>Width (m)<input type="number" min=".1" step=".1" value={selectedRoom.dimensions.widthMeters} onChange={(event) => updateRoomDimension("widthMeters", event.target.value)} /></label><label>Length (m)<input type="number" min=".1" step=".1" value={selectedRoom.dimensions.lengthMeters} onChange={(event) => updateRoomDimension("lengthMeters", event.target.value)} /></label></div><div className="wall-tools"><div><strong>Walls</strong><span>Select a room edge to add a wall, or remove an existing wall.</span></div><div className="edge-buttons"><button className="button ghost small" onClick={() => addWall("top")}><Plus size={14} /> Top</button><button className="button ghost small" onClick={() => addWall("right")}><Plus size={14} /> Right</button><button className="button ghost small" onClick={() => addWall("bottom")}><Plus size={14} /> Bottom</button><button className="button ghost small" onClick={() => addWall("left")}><Plus size={14} /> Left</button></div><select value={selectedWallId ?? ""} onChange={(event) => setSelectedWallId(event.target.value || undefined)}><option value="">Select wall to remove...</option>{layout.walls.map((wall) => <option key={wall.id} value={wall.id}>{wall.id}</option>)}</select><button className="button ghost small danger" disabled={!selectedWallId} onClick={() => selectedWallId && removeWall(selectedWallId)}><Trash2 size={14} /> Remove wall</button></div><p className="small-note">Room size changes and wall edits update the preview immediately.</p></div>
            <div className="card mini-preview"><PropertyViewer layout={layout} selectedRoomId={selectedRoom.id} onSelectRoom={setSelectedRoomId} /></div>
          </div>
          <div className="bottom-action"><span>{savedAt ? `Last saved at ${savedAt}` : "Changes are not saved yet"}</span><button className="button primary" onClick={() => setStep("explore")}>Generate 3D view <ChevronRight size={17} /></button></div>
        </section>
      )}

      {step === "explore" && selectedRoom && (
        <section className="viewer-page">
          <div className="viewer-toolbar"><div><p className="eyebrow">Interactive model</p><h1>{layout.property.name || "Untitled property"}</h1><p>{layout.property.address || "Address not added"} · {layout.unit.saleableAreaSqFt ? areaUnit === "sqft" ? `${Number(layout.unit.saleableAreaSqFt.toFixed(1))} sq ft` : `${Number((layout.unit.saleableAreaSqFt / SQFT_PER_SQM).toFixed(1))} m²` : "Area unknown"}</p></div><div className="viewer-actions"><button className="button ghost" onClick={() => setStep("layout")}><ArrowLeft size={16} /> Back</button><button className="button ghost" onClick={() => setStep("layout")}>Edit layout</button><button className="button primary" onClick={save}><Save size={16} /> Save</button></div></div>
          <div className="design-studio">
            <aside className="furnishing-panel card"><div><p className="section-label">Place real-size items</p><h2>Furniture & electronics</h2><p>Choose an item, then click a room floor to place it.</p></div><div className="catalog-groups">{(["furniture", "electronics"] as const).map((category) => <section key={category}><h3>{category === "furniture" ? "IKEA furniture baselines" : "Common electronics"}</h3>{FURNISHING_CATALOG.filter((item) => item.category === category).map((item) => <button key={item.id} className={pendingCatalogId === item.id ? "selected" : ""} onClick={() => { setWallMode(false); setMovingFurnishingId(undefined); setPendingCatalogId(pendingCatalogId === item.id ? undefined : item.id); }}><PackagePlus size={17} /><span><strong>{item.name}</strong><small>{item.dimensions.widthMeters.toFixed(2)} × {item.dimensions.depthMeters.toFixed(2)} × {item.dimensions.heightMeters.toFixed(2)} m</small></span></button>)}</section>)}</div>{(pendingCatalogId || movingFurnishingId) && <div className="placement-prompt"><strong>{pendingCatalogId ? catalogItem(pendingCatalogId)?.name : "Move selected item"}</strong><span>Click the desired position on a room floor.</span></div>}{selectedFurnishingId && <div className="item-actions"><button className="button ghost small" onClick={() => { setWallMode(false); setPendingCatalogId(undefined); setMovingFurnishingId(selectedFurnishingId); }}><Move size={15} /> Move</button><button className="button ghost small" onClick={rotateFurnishing}><RotateCw size={15} /> Rotate 45°</button><button className="button ghost small danger" onClick={removeFurnishing}><Trash2 size={15} /> Remove</button></div>}<div className="wall-tools"><div><strong>3D walls</strong><span>Click two floor points to create a wall. Click an existing wall to select and remove it.</span></div><button className={`button ghost small ${wallMode ? "active" : ""}`} onClick={() => { setPendingCatalogId(undefined); setMovingFurnishingId(undefined); setWallStart(undefined); setWallMode(!wallMode); }}><Plus size={14} /> {wallMode ? "Cancel wall" : "Create wall"}</button>{wallMode && <p className="small-note">{wallStart ? "Now click the wall end point." : "Click the wall start point on any room floor."}</p>}<button className="button ghost small danger" disabled={!selectedWallId} onClick={() => selectedWallId && removeWall(selectedWallId)}><Trash2 size={14} /> Remove selected wall</button></div><details className="catalog-sources"><summary>Dimension sources</summary>{FURNISHING_CATALOG.map((item) => <a key={item.id} href={item.sourceUrl} target="_blank" rel="noreferrer"><strong>{item.name}</strong><small>{item.note}</small></a>)}</details></aside>
            <div className="full-viewer"><PropertyViewer layout={layout} selectedRoomId={selectedRoom.id} onSelectRoom={setSelectedRoomId} furnishings={layout.furnishings} selectedFurnishingId={selectedFurnishingId} onSelectFurnishing={setSelectedFurnishingId} onFloorPoint={placeFurnishing} selectedWallId={selectedWallId} onSelectWall={setSelectedWallId} /><div className="viewer-hint">{wallMode ? "Click two floor points to create a wall" : "Drag to orbit · Scroll to zoom · Click a floor to place an item"}</div><div className="room-chips">{layout.rooms.map((room) => <button key={room.id} className={room.id === selectedRoom.id ? "active" : ""} onClick={() => setSelectedRoomId(room.id)}>{room.name}</button>)}</div></div>
          </div>
        </section>
      )}
    </main>
  );
}
