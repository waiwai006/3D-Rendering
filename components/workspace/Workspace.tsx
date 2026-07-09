"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Building2, Check, ChevronRight, Cloud, Copy, ExternalLink, FileSearch, Heart, Loader2, LogIn, LogOut, MapPin, Moon, PackagePlus, PenTool, Plus, RotateCcw, RotateCw, Save, ShieldCheck, Sun, Trash2, Upload, X } from "lucide-react";
import { ManualFloorPlan } from "@/components/editor/ManualFloorPlan";
import { FloorPlanCropper, PlanZoomViewer } from "@/components/editor/PlanImageTools";
import { I18nBridge, type Language } from "@/components/I18nBridge";
import { PropertyViewer } from "@/components/viewer/PropertyViewer";
import { sampleLayout } from "@/data/sample-layout";
import { buildManualLayout, type DrawnRoom } from "@/lib/manual-layout";
import { buildEstimatedLayoutFromCrop } from "@/lib/image-floorplan";
import { FURNISHING_CATALOG, catalogItem, type FurnishingRoomCategory } from "@/lib/furnishing-catalog";
import { DECOR_STYLES, decorStyleById } from "@/lib/decor-styles";
import { curatedFloorPlanCandidates } from "@/lib/curated-floorplans";
import type { FloorPlanCandidate, PropertySearchResponse, SourceCoverage } from "@/lib/property-search";
import { isPropertyLayout, ROOM_LABELS, validateLayout, type LayoutWall, type PropertyLayout, type RoomType } from "@/lib/layout-schema";

type Step = "details" | "layout" | "explore";
type StartMode = "address" | "upload" | "draw";
type AccountUser = { name?: string; email?: string; picture?: string };
type ThemeMode = "classic" | "dark" | "girlish";
const STORAGE_KEY = "hk-property-design-active-project-v3";
const PROJECT_INDEX_KEY = "hk-property-design-project-index-v1";
const THEME_KEY = "hk-property-design-theme-v1";
const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
const STATIC_SOURCE_COVERAGE: SourceCoverage[] = [
  { name: "Curated Centaline fallback", url: "https://hk.centanet.com/findproperty/en/list/buy", status: "searched", note: "Static GitHub Pages mode can show bundled public fallback matches for common estates." },
  { name: "Upload / draw", url: "#top", status: "manual", note: "Full 3D editing, cropping, local save/load and design styling run in this browser." },
  { name: "Live crawler / Auth0 / cloud save", url: "https://hkpropertydesign.netlify.app", status: "limited", note: "Requires a server host such as Netlify; kept as backup when credits/token access are available." },
];
const ROOM_CATEGORY_LABELS: Record<FurnishingRoomCategory, Record<Language, string>> = {
  living: { en: "Living room", "zh-Hant": "客廳", "zh-Hans": "客厅" },
  bedroom: { en: "Bedroom", "zh-Hant": "睡房", "zh-Hans": "卧室" },
  kitchen: { en: "Kitchen", "zh-Hant": "廚房", "zh-Hans": "厨房" },
  bathroom: { en: "Bathroom / laundry", "zh-Hant": "浴室 / 洗衣區", "zh-Hans": "浴室 / 洗衣区" },
  work: { en: "Study / work", "zh-Hant": "書房 / 工作區", "zh-Hans": "书房 / 工作区" },
  storage: { en: "Storage", "zh-Hant": "儲物", "zh-Hans": "储物" },
};

type SavedProjectSummary = { id: string; name: string; planName?: string; updatedAt: string };
type PersistedProject = { layout?: unknown; planName?: string; projectName?: string; referencePlanUrl?: string };

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

async function persistReferencePlan(referencePlanUrl?: string) {
  if (!referencePlanUrl) return undefined;
  if (!referencePlanUrl.startsWith("blob:")) return referencePlanUrl;
  const blob = await fetch(referencePlanUrl).then((response) => response.blob());
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function Workspace() {
  const [step, setStep] = useState<Step>("details");
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<ThemeMode>("classic");
  const [mode, setMode] = useState<StartMode>("address");
  const [layout, setLayout] = useState<PropertyLayout>(blankProject);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [savedAt, setSavedAt] = useState<string>();
  const [projectName, setProjectName] = useState("");
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
  const [cropperRevision, setCropperRevision] = useState(0);
  const [pendingCatalogId, setPendingCatalogId] = useState<string>();
  const [selectedFurnishingId, setSelectedFurnishingId] = useState<string>();
  const [selectedWallId, setSelectedWallId] = useState<string>();
  const [movingFurnishingId, setMovingFurnishingId] = useState<string>();
  const [movingFurnishingPreview, setMovingFurnishingPreview] = useState<{ roomId: string; x: number; y: number }>();
  const [movingWallId, setMovingWallId] = useState<string>();
  const [wallStart, setWallStart] = useState<{ roomId: string; x: number; y: number }>();
  const [wallMode, setWallMode] = useState(false);
  const [accountUser, setAccountUser] = useState<AccountUser | null>(null);
  const [authConfigured, setAuthConfigured] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);
  const activeProjectForStorage = async (nextLayout: PropertyLayout, nextPlanName?: string, nextProjectName?: string, nextReferencePlanUrl?: string): Promise<PersistedProject> => ({
    layout: nextLayout,
    planName: nextPlanName,
    projectName: nextProjectName ?? projectDisplayName(nextLayout, nextPlanName),
    referencePlanUrl: await persistReferencePlan(nextReferencePlanUrl),
  });

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === "classic" || savedTheme === "dark" || savedTheme === "girlish") setTheme(savedTheme);
      const index = JSON.parse(localStorage.getItem(PROJECT_INDEX_KEY) ?? "[]") as SavedProjectSummary[];
      if (Array.isArray(index)) setSavedProjects(index);
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as PersistedProject | PropertyLayout;
      const restored = isPropertyLayout(parsed)
        ? { layout: parsed, planName: undefined, projectName: projectDisplayName(parsed), referencePlanUrl: undefined }
        : parsed;
      if (restored?.layout && isPropertyLayout(restored.layout) && validateLayout(restored.layout).length === 0) {
        setLayout(restored.layout);
        setSelectedRoomId(restored.layout.rooms[0]?.id ?? "");
        setPlanName(restored.planName);
        setProjectName(restored.projectName ?? projectDisplayName(restored.layout, restored.planName));
        if (restored.referencePlanUrl && !restored.referencePlanUrl.startsWith("blob:")) {
          setReferencePlanUrl(restored.referencePlanUrl);
          setPlanPreviewUrl(restored.referencePlanUrl);
        }
        setNotice("Your saved browser project was restored.");
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setNotice("An incompatible saved project was cleared safely.");
      }
    } catch {
      setNotice("Saved data could not be read, so a fresh project was opened.");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      return;
    }
  }, [theme]);

  useEffect(() => {
    if (STATIC_EXPORT) {
      setAuthConfigured(false);
      setAccountUser(null);
      return;
    }
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
          const restoredName = projectDisplayName(project.layout, project.planName);
          localStorage.setItem(projectStorageKey(project.layout.projectId), JSON.stringify({ layout: project.layout, planName: project.planName, projectName: restoredName, referencePlanUrl: project.referencePlan }));
          cloudSummaries.push({ id: project.layout.projectId, name: restoredName, planName: project.planName, updatedAt: project.updatedAt });
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
        setProjectName(projectDisplayName(result.project.layout, result.project.planName));
        setNotice("Your latest cloud project was restored.");
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const selectedRoom = useMemo(() => layout.rooms.find((room) => room.id === selectedRoomId) ?? layout.rooms[0], [layout.rooms, selectedRoomId]);
  const selectedDecorStyle = decorStyleById(layout.decorStyleId);
  const remotePlanPreview = Boolean(planPreviewUrl?.startsWith("http://") || planPreviewUrl?.startsWith("https://"));
  const selectedWall = useMemo(() => layout.walls.find((wall) => wall.id === selectedWallId), [layout.walls, selectedWallId]);
  const selectedWallDoors = useMemo(() => selectedWall ? layout.doors.filter((door) => door.wallId === selectedWall.id) : [], [layout.doors, selectedWall]);
  const selectedWallWindows = useMemo(() => selectedWall ? layout.windows.filter((window) => window.wallId === selectedWall.id) : [], [layout.windows, selectedWall]);
  const openingItems = useMemo(() => ([
    ...layout.doors.map((door, index) => ({ id: door.id, kind: "door" as const, wallId: door.wallId, label: `Door ${index + 1}` })),
    ...layout.windows.map((window, index) => ({ id: window.id, kind: "window" as const, wallId: window.wallId, label: `Window ${index + 1}` })),
  ]), [layout.doors, layout.windows]);
  const displayCatalogName = (item?: ReturnType<typeof catalogItem>) => item ? (language === "en" ? item.name : item.chineseName) : "";
  const displayRoomCategory = (category: FurnishingRoomCategory) => ROOM_CATEGORY_LABELS[category][language];
  const clampFurnishingPlacement = (roomId: string, x: number, y: number, catalogId?: string) => {
    const room = layout.rooms.find((candidate) => candidate.id === roomId);
    const catalog = catalogId ? catalogItem(catalogId) : undefined;
    if (!room || !catalog) return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) };
    const halfWidth = Math.min(catalog.dimensions.widthMeters, room.dimensions.widthMeters) / 2;
    const halfDepth = Math.min(catalog.dimensions.depthMeters, room.dimensions.lengthMeters) / 2;
    return {
      x: Number(Math.min(room.position.x + room.dimensions.widthMeters - halfWidth, Math.max(room.position.x + halfWidth, x)).toFixed(2)),
      y: Number(Math.min(room.position.y + room.dimensions.lengthMeters - halfDepth, Math.max(room.position.y + halfDepth, y)).toFixed(2)),
    };
  };

  const setProperty = (key: "name" | "address", value: string) => setLayout((current) => ({ ...current, property: { ...current.property, [key]: value } }));
  const setUnit = (key: "tower" | "block" | "floor" | "flat", value: string) => setLayout((current) => ({ ...current, unit: { ...current.unit, [key]: value } }));
  const setDecorStyle = (styleId: string) => {
    setLayout((current) => ({ ...current, decorStyleId: styleId }));
    setNotice(`${decorStyleById(styleId).name} style applied. The preview now updates materials, lighting and built-in flat details in addition to furniture cues.`);
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

  const moveWall = (wallId: string, delta: { x: number; y: number }) => {
    setLayout((current) => ({
      ...current,
      walls: current.walls.map((wall) => wall.id === wallId ? {
        ...wall,
        start: { x: Number((wall.start.x + delta.x).toFixed(2)), y: Number((wall.start.y + delta.y).toFixed(2)) },
        end: { x: Number((wall.end.x + delta.x).toFixed(2)), y: Number((wall.end.y + delta.y).toFixed(2)) },
      } : wall),
    }));
    setSelectedWallId(wallId);
  };

  const moveWallTo = (wallId: string, x: number, y: number) => {
    const wall = layout.walls.find((candidate) => candidate.id === wallId);
    if (!wall) return;
    const center = { x: (wall.start.x + wall.end.x) / 2, y: (wall.start.y + wall.end.y) / 2 };
    moveWall(wallId, { x: x - center.x, y: y - center.y });
    setMovingWallId(undefined);
    setNotice("Wall moved. You can also drag it directly in the 3D view.");
  };

  const rotateWall = (deltaDegrees: number) => {
    if (!selectedWall) return;
    const angle = deltaDegrees * Math.PI / 180;
    const center = { x: (selectedWall.start.x + selectedWall.end.x) / 2, y: (selectedWall.start.y + selectedWall.end.y) / 2 };
    const rotate = (point: { x: number; y: number }) => {
      const x = point.x - center.x;
      const y = point.y - center.y;
      return {
        x: Number((center.x + x * Math.cos(angle) - y * Math.sin(angle)).toFixed(2)),
        y: Number((center.y + x * Math.sin(angle) + y * Math.cos(angle)).toFixed(2)),
      };
    };
    setLayout((current) => ({ ...current, walls: current.walls.map((wall) => wall.id === selectedWall.id ? { ...wall, start: rotate(wall.start), end: rotate(wall.end) } : wall) }));
  };
  const addOpening = (kind: "door" | "window") => {
    if (!selectedWall) {
      setNotice("Select a wall in the 3D preview first, then add a door or window.");
      return;
    }
    const length = Math.hypot(selectedWall.end.x - selectedWall.start.x, selectedWall.end.y - selectedWall.start.y);
    if (length < .8) {
      setNotice("That wall is too short for an opening.");
      return;
    }
    if (kind === "door") {
      setLayout((current) => ({ ...current, doors: [...current.doors, { id: `door-${Date.now()}`, wallId: selectedWall.id, widthMeters: Math.min(.9, length * .65), positionRatioOnWall: .5, opensTo: selectedRoom ? [selectedRoom.id] : [] }] }));
      setNotice("Door added to the selected wall. Click the wall again if you want to remove or add more openings.");
      return;
    }
    setLayout((current) => ({ ...current, windows: [...current.windows, { id: `window-${Date.now()}`, wallId: selectedWall.id, widthMeters: Math.min(1.4, length * .55), heightMeters: 1.05, positionRatioOnWall: .5, sillHeightMeters: .9 }] }));
    setNotice("Window added to the selected wall.");
  };

  const removeOpening = (kind: "door" | "window", openingId: string) => {
    if (kind === "door") {
      setLayout((current) => ({ ...current, doors: current.doors.filter((door) => door.id !== openingId) }));
      setNotice("Door removed from the selected wall.");
      return;
    }
    setLayout((current) => ({ ...current, windows: current.windows.filter((window) => window.id !== openingId) }));
    setNotice("Window removed from the selected wall.");
  };

  const drawWall = (_roomId: string, start: { x: number; y: number }, end: { x: number; y: number }) => {
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    if (length < .25) {
      setNotice("Drag a longer line to create a wall.");
      return;
    }
    const wall: LayoutWall = { id: `wall-${Date.now()}`, start, end, heightMeters: selectedRoom?.dimensions.heightMeters ?? 2.55, thicknessMeters: .12 };
    setLayout((current) => ({ ...current, walls: [...current.walls, wall] }));
    setSelectedWallId(wall.id);
    setWallMode(false);
    setWallStart(undefined);
    setNotice("Wall created from your drag. Click it any time to select and remove it.");
  };

  const handleWallPoint = (roomId: string, x: number, y: number) => {
    if (!wallStart || wallStart.roomId !== roomId) {
      setWallStart({ roomId, x, y });
      setNotice("Wall start set. Click another point or drag across the floor to finish the wall.");
      return;
    }
    drawWall(roomId, { x: wallStart.x, y: wallStart.y }, { x, y });
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
    setPlanName(undefined);
    setPlanPreviewUrl(undefined);
    setReferencePlanUrl(undefined);
    setCropperRevision((value) => value + 1);
    if (STATIC_EXPORT) {
      const fallbackCandidates = curatedFloorPlanCandidates({ estate: layout.property.name, address: layout.property.address, ...layout.unit });
      setCandidates(fallbackCandidates);
      setSourceCoverage(STATIC_SOURCE_COVERAGE);
      setSearchWarnings(fallbackCandidates.length ? [
        "GitHub Pages is static, so live agency crawling is unavailable here. Bundled public fallback matches are shown for supported estates.",
        "If no candidate is exact, upload or draw the plan and continue to 3D.",
      ] : [
        "GitHub Pages is static, so live public-source crawling is unavailable here. Try Taikoo Shing, South Horizons or LOHAS Park, or upload/draw the plan.",
      ]);
      setSearchState("done");
      return;
    }
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
    setPlanPreviewUrl(undefined);
    setReferencePlanUrl(undefined);
    setCropperRevision((value) => value + 1);
    const useDirectImage = STATIC_EXPORT || candidate.id.startsWith("centaline-curated");
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(candidate.imageUrl)}&candidate=${encodeURIComponent(candidate.id)}&v=${Date.now()}`;
    const previewUrl = useDirectImage ? candidate.imageUrl : proxyUrl;
    window.setTimeout(() => {
      setPlanPreviewUrl(previewUrl);
      setReferencePlanUrl(previewUrl);
      setCropperRevision((value) => value + 1);
    }, 0);
    setPendingCandidate(undefined);
    setMode("upload");
    setNotice(useDirectImage ? "Plan confirmed. This public fallback is shown as a visual tracing reference; upload the image if browser security blocks automatic crop analysis." : "Plan confirmed as a tracing reference. Trace its room boundaries, then verify dimensions before 3D generation.");
  };

  const analyzeCrop = (dataUrl: string, imageData: ImageData) => {
    try {
      const estimated = buildEstimatedLayoutFromCrop(imageData, layout);
      setLayout(estimated);
      setSelectedRoomId(estimated.rooms[0].id);
      setPlanPreviewUrl(dataUrl);
      setReferencePlanUrl(dataUrl);
      setCropperRevision((value) => value + 1);
      setStep("layout");
      setNotice("A low-confidence 3D estimate was created from the selected image area. Correct its scale, walls and openings before relying on it.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The selected area could not be converted into a 3D estimate.");
    }
  };

  const handlePlanUpload = (file?: File) => {
    if (!file) return;
    setPlanName(file.name);
    if (!file.type.startsWith("image/")) {
      setPlanPreviewUrl(undefined);
      setReferencePlanUrl(undefined);
      setCropperRevision((value) => value + 1);
      setMode("upload");
      setNotice("PDF preview is not available in this browser build yet. Please upload an image copy of the floor plan or draw it manually.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : undefined;
      setPlanPreviewUrl(result);
      setReferencePlanUrl(result);
      setCropperRevision((value) => value + 1);
      setMode("upload");
    };
    reader.onerror = () => setNotice("The selected floor-plan image could not be opened in this browser.");
    reader.readAsDataURL(file);
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
      const updatedAt = new Date().toISOString();
      const projectNameToSave = projectName.trim() || projectDisplayName(layout, planName);
      const projectId = layout.projectId;
      const summary: SavedProjectSummary = { id: projectId, name: projectNameToSave, planName, updatedAt };
      const nextProjects = [summary, ...savedProjects.filter((project) => project.id !== projectId)].slice(0, 25);
      const persisted = await activeProjectForStorage(layout, planName, projectNameToSave, referencePlanUrl);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
      localStorage.setItem(projectStorageKey(projectId), JSON.stringify(persisted));
      localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(nextProjects));
      setSavedProjects(nextProjects);
      setLoadProjectId(projectId);
      setSavedAt(new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      if (!accountUser) {
        setNotice(authConfigured ? "Floor plan saved in this browser. Sign in to back it up to the cloud." : "Floor plan saved in this browser.");
        return;
      }
      setCloudSaving(true);
      const referencePlan = persisted.referencePlanUrl;
      const response = await fetch("/api/project", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ layout, planName, referencePlan, projectName: projectNameToSave }) });
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
      const parsed = JSON.parse(saved) as { layout?: unknown; planName?: string; projectName?: string; referencePlanUrl?: string };
      if (!parsed.layout || !isPropertyLayout(parsed.layout) || validateLayout(parsed.layout).length > 0) {
        setNotice("That saved floor plan is no longer compatible.");
        return;
      }
      setLayout(parsed.layout);
      setPlanName(parsed.planName);
      setProjectName(parsed.projectName ?? projectDisplayName(parsed.layout, parsed.planName));
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
    setProjectName(projectName ? `${projectName} copy` : "");
    setNotice("New copy created. Press Save to store it as a separate floor plan.");
  };

  const deleteSavedProject = async () => {
    const projectId = loadProjectId || layout.projectId;
    const nextProjects = savedProjects.filter((project) => project.id !== projectId);
    localStorage.removeItem(projectStorageKey(projectId));
    localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(nextProjects));
    if (layout.projectId === projectId) localStorage.removeItem(STORAGE_KEY);
    setSavedProjects(nextProjects);
    setLoadProjectId("");
    if (accountUser) {
      try {
        const response = await fetch(`/api/project?projectId=${encodeURIComponent(projectId)}`, { method: "DELETE" });
        if (response.ok) {
          const result = await response.json() as { projects?: SavedProjectSummary[] };
          if (result.projects) setSavedProjects(result.projects);
        }
      } catch { /* Local deletion still succeeds. */ }
    }
    setNotice("Saved floor plan deleted.");
  };

  const reset = () => {
    const fresh = cloneSample();
    setLayout(fresh);
    setSelectedRoomId("living");
    setNotice("Demo layout restored.");
  };

  const placeFurnishing = (roomId: string, x: number, y: number) => {
    if (movingFurnishingId) {
      const movingItem = (layout.furnishings ?? []).find((item) => item.id === movingFurnishingId);
      const nextPosition = clampFurnishingPlacement(roomId, x, y, movingItem?.catalogId);
      setLayout((current) => ({
        ...current,
        furnishings: (current.furnishings ?? []).map((item) => item.id === movingFurnishingId ? { ...item, roomId, position: nextPosition } : item),
      }));
      setSelectedFurnishingId(movingFurnishingId);
      setMovingFurnishingId(undefined);
      setMovingFurnishingPreview(undefined);
      setNotice("Item moved. You can also drag it directly in the 3D view.");
      return;
    }
    if (movingWallId) {
      moveWallTo(movingWallId, x, y);
      return;
    }
    if (!pendingCatalogId) return;
    const id = `item-${Date.now()}`;
    setLayout((current) => {
      const room = current.rooms.find((candidate) => candidate.id === roomId);
      if (!room || !pendingCatalogId) return current;
      const catalog = catalogItem(pendingCatalogId);
      if (!catalog) return current;
      const position = clampFurnishingPlacement(roomId, x, y, pendingCatalogId);
      return { ...current, furnishings: [...(current.furnishings ?? []), { id, catalogId: pendingCatalogId, roomId, position, rotationDegrees: 0 }] };
    });
    setSelectedFurnishingId(id);
    setPendingCatalogId(undefined);
    setNotice("Item placed to scale. Select it in the 3D view to move, rotate or remove it.");
  };

  const moveFurnishing = (id: string, delta: { x: number; y: number }) => {
    setLayout((current) => ({
      ...current,
      furnishings: (current.furnishings ?? []).map((item) => item.id === id ? { ...item, position: { x: Number((item.position.x + delta.x).toFixed(2)), y: Number((item.position.y + delta.y).toFixed(2)) } } : item),
    }));
    setSelectedFurnishingId(id);
  };

  const rotateFurnishing = (delta = 45) => {
    if (!selectedFurnishingId) return;
    setLayout((current) => ({ ...current, furnishings: (current.furnishings ?? []).map((item) => item.id === selectedFurnishingId ? { ...item, rotationDegrees: (item.rotationDegrees + delta + 360) % 360 } : item) }));
  };

  const removeFurnishing = () => {
    if (!selectedFurnishingId) return;
    setLayout((current) => ({ ...current, furnishings: (current.furnishings ?? []).filter((item) => item.id !== selectedFurnishingId) }));
    setSelectedFurnishingId(undefined);
  };

  const applyStyledStarterSet = () => {
    const starterByRoom: Partial<Record<RoomType, string[]>> = {
      living: ["ikea-kivik-2-seat", "ikea-besta-tv-bench", "fortress-55-tv", "ikea-lack-coffee-table"],
      bedroom: ["ikea-malm-double", "ikea-pax-wardrobe", "fortress-43-tv"],
      kitchen: ["fortress-slim-fridge", "fortress-microwave"],
      bathroom: ["fortress-front-load-washer"],
      storage: ["ikea-kallax-shelf"],
      other: ["ikea-kallax-shelf"],
    };
    setLayout((current) => {
      const newItems = current.rooms.flatMap((room) => {
        const catalogIds = starterByRoom[room.type] ?? [];
        return catalogIds.slice(0, room.type === "living" ? 4 : 2).flatMap((catalogId, index) => {
          const item = catalogItem(catalogId);
          if (!item) return [];
          const columns = Math.min(catalogIds.length, 2);
          const row = Math.floor(index / columns);
          const column = index % columns;
          const xRatio = columns === 1 ? .5 : column === 0 ? .28 : .72;
          const yRatio = row === 0 ? .28 : .68;
          return [{
            id: `starter-${Date.now()}-${room.id}-${catalogId}`,
            catalogId,
            roomId: room.id,
            position: {
              x: Number((room.position.x + room.dimensions.widthMeters * xRatio).toFixed(2)),
              y: Number((room.position.y + room.dimensions.lengthMeters * yRatio).toFixed(2)),
            },
            rotationDegrees: item.shape === "tv" || item.shape === "cabinet" || item.shape === "wardrobe" ? 0 : room.dimensions.widthMeters > room.dimensions.lengthMeters ? 0 : 90,
          }];
        });
      });
      const protectedExisting = (current.furnishings ?? []).filter((item) => !newItems.some((candidate) => candidate.roomId === item.roomId && candidate.catalogId === item.catalogId));
      return { ...current, furnishings: [...protectedExisting, ...newItems] };
    });
    setPendingCatalogId(undefined);
    setNotice(`${selectedDecorStyle.name} starter furniture and electronics placed. Select any item to move, rotate or remove.`);
  };

  const removeStarterSet = () => {
    setLayout((current) => ({ ...current, furnishings: (current.furnishings ?? []).filter((item) => !item.id.startsWith("starter-")) }));
    setSelectedFurnishingId(undefined);
    setNotice("Styled starter set removed. Manually placed furniture remains.");
  };

  const startMoveFurnishing = () => {
    if (!selectedFurnishingId) return;
    const item = (layout.furnishings ?? []).find((candidate) => candidate.id === selectedFurnishingId);
    setMovingFurnishingId(selectedFurnishingId);
    setMovingFurnishingPreview(item ? { roomId: item.roomId, x: item.position.x, y: item.position.y } : undefined);
    setMovingWallId(undefined);
    setPendingCatalogId(undefined);
    setWallMode(false);
    setNotice("Move mode on. The item now follows your cursor on the floor. Click to place it.");
  };

  const startMoveWall = () => {
    if (!selectedWallId) return;
    setMovingWallId(selectedWallId);
    setMovingFurnishingId(undefined);
    setMovingFurnishingPreview(undefined);
    setPendingCatalogId(undefined);
    setWallMode(false);
    setNotice("Move mode on. Click the destination for the wall centre, or simply drag the wall.");
  };

  const previewFurnishingPlacement = (roomId: string, x: number, y: number) => {
    if (!movingFurnishingId) return;
    const movingItem = (layout.furnishings ?? []).find((item) => item.id === movingFurnishingId);
    const nextPosition = clampFurnishingPlacement(roomId, x, y, movingItem?.catalogId);
    setMovingFurnishingPreview({ roomId, ...nextPosition });
  };

  return (
    <main className="app-shell" id="top">
      <I18nBridge language={language} />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="HK Property Design home"><span className="brand-mark"><Building2 size={18} /></span><span>HK Property Design</span></a>
        <div className="top-actions"><div className="language-switch" aria-label="Language"><button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button><button className={language === "zh-Hant" ? "active" : ""} onClick={() => setLanguage("zh-Hant")}>繁</button><button className={language === "zh-Hans" ? "active" : ""} onClick={() => setLanguage("zh-Hans")}>简</button></div><div className="theme-switch" aria-label="Theme"><button className={theme === "classic" ? "active" : ""} onClick={() => setTheme("classic")} title="Classic theme"><Sun size={14} /></button><button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")} title="Dark mode"><Moon size={14} /></button><button className={theme === "girlish" ? "active" : ""} onClick={() => setTheme("girlish")} title="Girlish mode"><Heart size={14} /></button></div>{accountUser ? <div className="account-chip"><Cloud size={15} /><span>{accountUser.name ?? accountUser.email ?? "Signed in"}</span><a href="/auth/logout" aria-label="Sign out"><LogOut size={14} /></a></div> : authConfigured ? <a className="button ghost" href="/auth/login"><LogIn size={16} /> Sign in</a> : <button className="button ghost" onClick={() => setNotice("Auth0 credentials are required before account login can be enabled.")}><LogIn size={16} /> Sign in</button>}<input className="save-name-input" value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Name this floor plan" aria-label="Saved floor plan name" /><button className="button ghost" disabled={cloudSaving} onClick={save}>{cloudSaving ? <Loader2 className="spin" size={16} /> : <Save size={16} />} {accountUser ? "Save to cloud" : "Save floor plan"}</button><button className="button ghost" onClick={saveAsNewCopy}><Copy size={16} /> Save as new</button>{savedProjects.length > 0 && <div className="load-control"><select value={loadProjectId} onChange={(event) => setLoadProjectId(event.target.value)} aria-label="Saved floor plans"><option value="">Load saved plan...</option>{savedProjects.map((project) => <option key={project.id} value={project.id}>{project.name} · {new Date(project.updatedAt).toLocaleDateString()}</option>)}</select><button className="button ghost" disabled={!loadProjectId} onClick={loadSavedProject}>Load</button><button className="button ghost danger" disabled={!loadProjectId && !savedProjects.some((project) => project.id === layout.projectId)} onClick={deleteSavedProject}><Trash2 size={14} /> Del</button></div>}</div>
      </header>

      <nav className="stepper" aria-label="Project steps">
        {(["details", "layout", "explore"] as Step[]).map((item, index) => <button key={item} className={step === item ? "active" : ""} onClick={() => item === "details" || layout.rooms.length ? setStep(item) : undefined}><span>{index + 1}</span>{item === "details" ? "Find or create" : item === "layout" ? "Review layout" : "Explore in 3D"}</button>)}
      </nav>

      {notice && <button className="notice" onClick={() => setNotice(undefined)}>{notice}<span>Dismiss</span></button>}

      {step === "details" && (
        <section className="onboarding-page">
          <div className="onboarding-heading"><h1>How would you like to create your floor plan?</h1><p>Use an address to look for a public plan, upload a plan you already have, or draw the flat manually.</p></div>
          <div className="choice-tabs" role="tablist">
            <button className={mode === "address" ? "active" : ""} onClick={() => setMode("address")}><MapPin size={19} /><span><strong>Property details</strong><small>Search public sources</small></span></button>
            <button className={mode === "upload" ? "active" : ""} onClick={() => setMode("upload")}><Upload size={19} /><span><strong>Upload floor plan</strong><small>Image or PDF</small></span></button>
            <button className={mode === "draw" ? "active" : ""} onClick={() => setMode("draw")}><PenTool size={19} /><span><strong>Draw manually</strong><small>No plan available</small></span></button>
          </div>

          {mode === "address" && <div className="card source-form">
            <div className="card-heading"><span className="icon-tile"><Building2 size={20} /></span><div><h2>Locate the exact property</h2><p>Estate or address is required for lookup. Tower, block, floor and flat are optional but improve matching.</p></div></div>
            <div className="form-grid"><label>Estate / development<input value={layout.property.name} onChange={(event) => setProperty("name", event.target.value)} placeholder="e.g. Mei Foo Sun Chuen / 美孚新邨" /></label><label>Address<input value={layout.property.address} onChange={(event) => setProperty("address", event.target.value)} placeholder="Street name and number" /></label><label>Tower<input value={layout.unit.tower ?? ""} onChange={(event) => setUnit("tower", event.target.value)} placeholder="Optional" /></label><label>Block<input value={layout.unit.block ?? ""} onChange={(event) => setUnit("block", event.target.value)} placeholder="Optional" /></label><label>Floor<input value={layout.unit.floor ?? ""} onChange={(event) => setUnit("floor", event.target.value)} placeholder="Optional" /></label><label>Flat / unit<input value={layout.unit.flat ?? ""} onChange={(event) => setUnit("flat", event.target.value)} placeholder="Optional" /></label></div>
            <div className="search-examples"><span>Traditional Chinese examples</span>{["太古城", "美孚新邨", "黃埔花園"].map((example) => <button type="button" key={example} onClick={() => setProperty("name", example)}>{example}</button>)}</div>
            <button className="button primary wide" disabled={searchState === "searching"} onClick={searchPublicSources}>{searchState === "searching" ? <Loader2 className="spin" size={17} /> : <FileSearch size={17} />} {searchState === "searching" ? "Searching public sources..." : "Search and match floor plans"}</button>
            {searchState === "idle" && <div className="lookup-result"><ShieldCheck size={19} /><div><strong>Automatic source matching</strong><p>HK Property Design searches accessible estate indexes and floor-plan metadata. Official SRPE remains the highest-authority source; agency plans are marked secondary.</p><div className="lookup-links"><a href="https://www.srpe.gov.hk/opip/" target="_blank" rel="noreferrer">SRPE official database</a><a href="https://www.bd.gov.hk/en/resources/online-tools/BRAVO-online-building-records/index.html" target="_blank" rel="noreferrer">Older buildings: BRAVO</a></div></div></div>}
            {searchState === "done" && <div className="search-results">
              <div className="results-heading"><div><strong>{candidates.length ? `${candidates.length} candidate plan${candidates.length === 1 ? "" : "s"} found` : "No matching plan found"}</strong><span>{language === "en" ? "Review the image—estate-level results may contain several unit types." : language === "zh-Hant" ? "請檢視圖片，屋苑級結果可能包含多種單位類型。" : "请检查图片，小区级结果可能包含多种户型。"}</span></div><button className="button ghost small" onClick={searchPublicSources}><RotateCcw size={14} /> Search again</button></div>
              {candidates.length > 0 && <div className="candidate-grid">{candidates.map((candidate) => <article className="candidate-card" key={candidate.id}><div className="candidate-image"><img src={candidate.imageUrl} alt={`${candidate.estateName} floor-plan candidate`} referrerPolicy="no-referrer" /></div><div className="candidate-body"><div className="candidate-meta"><span>{candidate.source}</span></div><h3>{candidate.title}</h3><p>Matched: {candidate.matchedFields.join(", ")}. Visual confirmation required.</p><div className="candidate-actions"><a href={candidate.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Source</a><button className="button primary small" onClick={() => setPendingCandidate(candidate)}>Review this plan</button></div></div></article>)}</div>}
              {searchWarnings.map((warning) => <p className="search-warning" key={warning}>{warning}</p>)}
              {sourceCoverage.length > 0 && <details className="source-coverage"><summary>{language === "en" ? "Source coverage" : language === "zh-Hant" ? "來源覆蓋" : "来源覆盖"} · {sourceCoverage.filter((source) => source.status === "searched").length} {language === "en" ? "automatic" : language === "zh-Hant" ? "自動" : "自动"}, {sourceCoverage.length - sourceCoverage.filter((source) => source.status === "searched").length} {language === "en" ? "reference sources" : language === "zh-Hant" ? "參考來源" : "参考来源"}</summary><div>{sourceCoverage.map((source) => <a href={source.url} target="_blank" rel="noreferrer" key={source.name}><span className={`coverage-status ${source.status}`}>{source.status === "searched" ? (language === "en" ? "Searched" : language === "zh-Hant" ? "已搜尋" : "已搜索") : source.status === "limited" ? (language === "en" ? "Limited" : language === "zh-Hant" ? "有限" : "有限") : (language === "en" ? "Manual" : language === "zh-Hant" ? "手動" : "手动")}</span><strong>{source.name}</strong><small>{source.note}</small><ExternalLink size={13} /></a>)}</div></details>}
              <div className="fallback-row"><span>{candidates.length ? "None of these match?" : "Continue without a public match"}</span><button onClick={() => setMode("upload")}>Upload a plan</button><button onClick={() => setMode("draw")}>Draw it manually</button></div>
            </div>}
            {pendingCandidate && <div className="confirm-overlay" role="dialog" aria-modal="true" aria-label="Confirm floor plan"><div className="confirm-dialog"><button className="dialog-close" aria-label="Close confirmation" onClick={() => setPendingCandidate(undefined)}><X size={18} /></button><p className="eyebrow">Confirm before 3D use</p><h2>Does this plan match your property?</h2><PlanZoomViewer src={pendingCandidate.imageUrl} alt={`${pendingCandidate.estateName} plan for confirmation`} /><div className="confirm-facts"><span><strong>Estate</strong>{pendingCandidate.estateName}</span><span><strong>Source</strong>{`${pendingCandidate.source} · ${language === "en" ? "secondary" : language === "zh-Hant" ? "次要來源" : "次要来源"}`}</span><span><strong>Matched</strong>{pendingCandidate.matchedFields.join(", ")}</span></div><p>Zoom in and check tower/block, flat and orientation. Confirmation uses this image as a tracing reference; it does not make the source official.</p><div className="dialog-actions"><button className="button ghost" onClick={() => setPendingCandidate(undefined)}>No, choose another</button><button className="button primary" onClick={() => confirmCandidate(pendingCandidate)}><Check size={16} /> Yes, use this plan</button></div></div></div>}
          </div>}

          {mode === "upload" && <div className="card upload-workspace"><div className="card-heading"><span className="icon-tile cool"><Upload size={20} /></span><div><h2>Upload, crop or trace a floor plan</h2><p>The file stays in this browser. Image analysis produces an estimate, not construction geometry.</p></div></div><label className="drop-zone plan-upload"><Upload size={25} /><strong>{planName ?? "Choose a floor-plan image or PDF"}</strong><span>PNG, JPEG, WEBP or PDF</span><input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => handlePlanUpload(event.target.files?.[0])} /></label>{planName && !planPreviewUrl && <p className="upload-warning">Loading selected floor plan...</p>}{planPreviewUrl && <><PlanZoomViewer src={planPreviewUrl} alt={`${planName ?? "Selected"} floor plan`} />{remotePlanPreview && <p className="upload-warning">This public fallback is loaded directly from the agency source. Pan/Crop is available below; if the browser blocks automatic image analysis, upload a saved copy or trace it manually.</p>}<FloorPlanCropper key={`crop-${cropperRevision}-${planPreviewUrl}`} src={planPreviewUrl} onAnalyze={analyzeCrop} onAnalyzeError={setNotice} /><div className="tool-divider"><span>or trace rooms manually</span></div></>}<ManualFloorPlan key={`manual-${cropperRevision}-${planPreviewUrl ?? "blank"}`} overlayUrl={planPreviewUrl} onUse={useDrawnPlan} /></div>}

          {mode === "draw" && <div className="card upload-workspace"><div className="card-heading"><span className="icon-tile cool"><PenTool size={20} /></span><div><h2>Draw the floor plan manually</h2><p>Drag each room on the measured grid. You can rename and classify rooms on the next step.</p></div></div><ManualFloorPlan onUse={useDrawnPlan} /></div>}
        </section>
      )}

      {step === "layout" && selectedRoom && (
        <section className="workspace-page">
          <div className="workspace-heading"><div><p className="eyebrow">Review before generating</p><h1>Confirm the rooms and measurements</h1><p>Select a room to rename, classify or resize it. The preview updates immediately.</p></div><div className="heading-actions"><button className="button ghost" onClick={() => setStep("details")}><ArrowLeft size={16} /> Back</button><button className="button ghost" onClick={() => setStep("details")}><PenTool size={16} /> Redraw</button><button className="button ghost" onClick={reset}><RotateCcw size={16} /> Use demo</button></div></div>
          {referencePlanUrl && <details className="reference-plan-panel" open><summary>Selected cropped floor plan</summary><p>This shows the cropped or selected plan image used to create the current layout.</p><PlanZoomViewer src={referencePlanUrl} alt={`${planName ?? "Selected"} floor plan`} initialZoom={.5} /></details>}
          <div className="editor-grid">
            <aside className="card room-list"><div className="section-label">Rooms · {layout.rooms.length}</div>{layout.rooms.map((room) => <button key={room.id} className={room.id === selectedRoom.id ? "selected" : ""} onClick={() => setSelectedRoomId(room.id)}><span className={`room-dot ${room.type}`} /><span><strong>{room.name}</strong><small>{room.dimensions.widthMeters.toFixed(1)} × {room.dimensions.lengthMeters.toFixed(1)} m</small></span><ChevronRight size={16} /></button>)}</aside>
            <div className="card room-editor"><div className="card-heading"><div><p className="section-label">Selected room</p><h2>{selectedRoom.name}</h2></div></div><label>Room name<input value={selectedRoom.name} onChange={(event) => updateRoom("name", event.target.value)} /></label><label>Room type<select value={selectedRoom.type} onChange={(event) => updateRoom("type", event.target.value)}>{Object.entries(ROOM_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><div className="split-fields"><label>Width (m)<input type="number" min=".1" step=".1" value={selectedRoom.dimensions.widthMeters} onChange={(event) => updateRoomDimension("widthMeters", event.target.value)} /></label><label>Length (m)<input type="number" min=".1" step=".1" value={selectedRoom.dimensions.lengthMeters} onChange={(event) => updateRoomDimension("lengthMeters", event.target.value)} /></label></div><div className="wall-tools"><div><strong>3D walls, doors & windows</strong><span>Click an existing wall to select it. Turn on Create wall, then drag on the floor to draw a new wall.</span></div><button className={`button ghost small ${wallMode ? "active" : ""}`} onClick={() => { setPendingCatalogId(undefined); setWallStart(undefined); setWallMode(!wallMode); }}><Plus size={14} /> {wallMode ? "Cancel wall" : "Create wall"}</button>{wallMode && <p className="small-note">{wallStart ? "Wall start set. Click another point to finish." : "Click once to start, click again to finish, or drag on the preview floor."}</p>}<select value={selectedWallId ?? ""} onChange={(event) => setSelectedWallId(event.target.value || undefined)}><option value="">Select a wall...</option>{layout.walls.map((wall) => <option key={wall.id} value={wall.id}>{wall.id}</option>)}</select><div className="edge-buttons"><button className="button ghost small" disabled={!selectedWallId} onClick={() => addOpening("door")}><Plus size={14} /> Add door</button><button className="button ghost small" disabled={!selectedWallId} onClick={() => addOpening("window")}><Plus size={14} /> Add window</button></div>{selectedWallId && (selectedWallDoors.length > 0 || selectedWallWindows.length > 0) && <div className="opening-list">{selectedWallDoors.map((door, index) => <div key={door.id} className="opening-row"><span>{`Door ${index + 1}`}</span><button className="button ghost small danger" onClick={() => removeOpening("door", door.id)}><Trash2 size={14} /> Remove</button></div>)}{selectedWallWindows.map((window, index) => <div key={window.id} className="opening-row"><span>{`Window ${index + 1}`}</span><button className="button ghost small danger" onClick={() => removeOpening("window", window.id)}><Trash2 size={14} /> Remove</button></div>)}</div>}<button className="button ghost small danger" disabled={!selectedWallId} onClick={() => selectedWallId && removeWall(selectedWallId)}><Trash2 size={14} /> Remove selected wall</button></div><p className="small-note">Room size changes, wall selection and openings update the preview immediately.</p></div>
            <div className="card mini-preview"><PropertyViewer layout={layout} selectedRoomId={selectedRoom.id} onSelectRoom={setSelectedRoomId} onFloorPoint={wallMode ? handleWallPoint : undefined} onWallDraw={wallMode ? drawWall : undefined} selectedWallId={selectedWallId} onSelectWall={(id) => { setSelectedFurnishingId(undefined); setSelectedWallId(id); }} onWallMove={moveWall} /></div>
          </div>
          <div className="bottom-action"><span>{savedAt ? `Last saved at ${savedAt}` : "Changes are not saved yet"}</span><button className="button primary" onClick={() => setStep("explore")}>Generate 3D view <ChevronRight size={17} /></button></div>
        </section>
      )}

      {step === "explore" && selectedRoom && (
        <section className="viewer-page">
          <div className="viewer-toolbar"><div><p className="eyebrow">Interactive model</p><h1>{layout.property.name || "Untitled property"}</h1><p>{layout.property.address || "Address not added"}</p></div><div className="viewer-actions"><button className="button ghost" onClick={() => setStep("layout")}><ArrowLeft size={16} /> Back</button><button className="button ghost" onClick={() => setStep("layout")}>Edit layout</button><button className="button primary" onClick={save}><Save size={16} /> Save</button></div></div>
          <div className="design-studio">
            <aside className="furnishing-panel card"><div><p className="section-label">Place real-size items</p><h2>Furniture & electronics</h2><p>Choose an item, then click a room floor to place it. Use Move then click a destination, or drag selected furniture/walls directly in the 3D view.</p></div><div className="style-agent-panel"><label>Decor style<select value={selectedDecorStyle.id} onChange={(event) => setDecorStyle(event.target.value)}>{DECOR_STYLES.map((style) => <option key={style.id} value={style.id}>{style.name} · {style.chineseName}</option>)}</select></label><div className="style-detail-grid"><div><strong>Wall finish</strong><span>{selectedDecorStyle.details.wallFinish}</span></div><div><strong>Floor finish</strong><span>{selectedDecorStyle.details.floorFinish}</span></div><div><strong>Lighting</strong><span>{selectedDecorStyle.details.lighting}</span></div><div><strong>Kitchen cue</strong><span>{selectedDecorStyle.details.kitchenCue}</span></div><div><strong>Storage cue</strong><span>{selectedDecorStyle.details.storageCue}</span></div></div><div className="style-signatures"><strong>Signature touches</strong><div>{selectedDecorStyle.details.signatureTouches.map((touch) => <span key={touch}>{touch}</span>)}</div></div><details className="style-reference-board"><summary>10 photo references</summary><div>{selectedDecorStyle.referencePhotoSearches.map((reference) => <a key={reference.label} href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a>)}</div><p className="small-note">These open live public image-search references for this style, so you can compare real rooms, lighting and built-ins while designing.</p></details><button className="button ghost small wide" onClick={applyStyledStarterSet}><PackagePlus size={15} /> Place styled starter set</button><button className="button ghost small wide danger" onClick={removeStarterSet}><Trash2 size={15} /> Remove starter set</button><p className="small-note">Adds common prototype items such as sofa, TV, storage, bed, wardrobe, fridge, microwave and washer where matching rooms exist.</p></div>{openingItems.length > 0 && <div className="opening-list all-openings"><strong>Door/Windows</strong>{openingItems.map((opening) => <div key={opening.id} className="opening-row"><button className={`opening-link${selectedWallId === opening.wallId ? " active" : ""}`} onClick={() => setSelectedWallId(opening.wallId)}>{opening.label} · {opening.wallId}</button><button className="button ghost small danger" onClick={() => removeOpening(opening.kind, opening.id)}><Trash2 size={14} /> Remove</button></div>)}</div>}<div className="catalog-groups">{(["furniture", "electronics"] as const).map((category) => <section key={category}><h3>{category === "furniture" ? "IKEA furniture baselines" : "Common electronics"}</h3>{FURNISHING_CATALOG.filter((item) => item.category === category).map((item) => <button key={item.id} className={pendingCatalogId === item.id ? "selected" : ""} onClick={() => { setWallMode(false); setMovingFurnishingId(undefined); setMovingWallId(undefined); setPendingCatalogId(pendingCatalogId === item.id ? undefined : item.id); }}><PackagePlus size={17} /><span><strong>{displayCatalogName(item)}</strong><small>{displayRoomCategory(item.roomCategory)} · {item.dimensions.widthMeters.toFixed(2)} × {item.dimensions.depthMeters.toFixed(2)} × {item.dimensions.heightMeters.toFixed(2)} m</small></span></button>)}</section>)}</div>{pendingCatalogId && <div className="placement-prompt"><strong>{displayCatalogName(catalogItem(pendingCatalogId))}</strong><span>Click the desired position on a room floor.</span></div>}{movingFurnishingId && <div className="placement-prompt"><strong>Move selected item</strong><span>Click the new room-floor position.</span></div>}{movingWallId && <div className="placement-prompt"><strong>Move selected wall</strong><span>Click the destination for the wall centre.</span></div>}<div className="wall-tools"><div><strong>3D walls, doors & windows</strong><span>Click an existing wall to select it. Turn on Create wall, then drag on the floor to draw a new wall. Selected walls can also be dragged directly.</span></div><button className={`button ghost small ${wallMode ? "active" : ""}`} onClick={() => { setPendingCatalogId(undefined); setMovingFurnishingId(undefined); setMovingWallId(undefined); setWallStart(undefined); setWallMode(!wallMode); }}><Plus size={14} /> {wallMode ? "Cancel wall" : "Create wall"}</button>{wallMode && <p className="small-note">Click once to start, click again to finish, or drag across any room floor.</p>}<div className="edge-buttons"><button className="button ghost small" disabled={!selectedWallId} onClick={() => addOpening("door")}><Plus size={14} /> Add door</button><button className="button ghost small" disabled={!selectedWallId} onClick={() => addOpening("window")}><Plus size={14} /> Add window</button></div></div><details className="catalog-sources"><summary>Dimension sources</summary>{FURNISHING_CATALOG.map((item) => <a key={item.id} href={item.sourceUrl} target="_blank" rel="noreferrer"><strong>{displayCatalogName(item)}</strong><small>{item.note}</small></a>)}</details></aside>
            <div className="full-viewer"><PropertyViewer layout={layout} selectedRoomId={selectedRoom.id} onSelectRoom={setSelectedRoomId} furnishings={layout.furnishings} selectedFurnishingId={selectedFurnishingId} movingFurnishingId={movingFurnishingId} movingFurnishingPreview={movingFurnishingPreview ? { x: movingFurnishingPreview.x, y: movingFurnishingPreview.y } : undefined} onSelectFurnishing={(id) => { setSelectedWallId(undefined); setMovingWallId(undefined); setSelectedFurnishingId(id); }} onFurnishingMove={moveFurnishing} onFloorPoint={wallMode ? handleWallPoint : placeFurnishing} onFloorHover={movingFurnishingId ? previewFurnishingPlacement : undefined} onWallDraw={wallMode ? drawWall : undefined} selectedWallId={selectedWallId} onSelectWall={(id) => { setSelectedFurnishingId(undefined); setMovingFurnishingId(undefined); setMovingFurnishingPreview(undefined); setSelectedWallId(id); }} onWallMove={moveWall} /><div className="viewer-hint">{wallMode ? (wallStart ? "Wall start set · Click another point or drag to finish" : "Click once to start, click again to finish · Or drag on the floor") : movingFurnishingId || movingWallId ? "Move mode · Hover to preview, then click the destination on a room floor" : "Drag to orbit · Scroll to zoom · Click an item or wall to select · Drag selected items/walls to move"}</div><div className="room-chips">{layout.rooms.map((room) => <button key={room.id} className={room.id === selectedRoom.id ? "active" : ""} onClick={() => setSelectedRoomId(room.id)}>{room.name}</button>)}</div>{selectedFurnishingId && <div className="selection-toolbar"><span>Furniture</span><button className={`button ghost small ${movingFurnishingId ? "active" : ""}`} onClick={startMoveFurnishing}>Move</button><button className="button ghost small" onClick={() => rotateFurnishing(-15)}><RotateCcw size={14} /> -15°</button><button className="button ghost small" onClick={() => rotateFurnishing(15)}><RotateCw size={14} /> +15°</button><button className="button ghost small danger" onClick={removeFurnishing}><Trash2 size={14} /> Remove</button></div>}{selectedWallId && !selectedFurnishingId && <div className="selection-toolbar"><span>Wall / opening</span><button className={`button ghost small ${movingWallId ? "active" : ""}`} onClick={startMoveWall}>Move</button><button className="button ghost small" onClick={() => rotateWall(-15)}><RotateCcw size={14} /> -15°</button><button className="button ghost small" onClick={() => rotateWall(15)}><RotateCw size={14} /> +15°</button><button className="button ghost small danger" onClick={() => removeWall(selectedWallId)}><Trash2 size={14} /> Remove</button></div>}</div>
          </div>
        </section>
      )}
    </main>
  );
}
