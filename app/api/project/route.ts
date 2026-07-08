import { getStore } from "@netlify/blobs";
import { NextResponse } from "next/server";
import { auth0, auth0Configured } from "@/lib/auth0";
import { isPropertyLayout, validateLayout, type PropertyLayout } from "@/lib/layout-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CloudProject {
  layout: PropertyLayout;
  projectName?: string;
  planName?: string;
  referencePlan?: string;
  updatedAt: string;
}

interface CloudProjectLibrary {
  projects: CloudProject[];
}

async function userKey() {
  if (!auth0Configured || !auth0) return null;
  const session = await auth0.getSession();
  const subject = session?.user.sub;
  return subject ? Buffer.from(subject).toString("base64url") : null;
}

function store() {
  return getStore("flatform-user-projects", { consistency: "strong" });
}

const summary = (project: CloudProject) => ({
  id: project.layout.projectId,
  name: project.projectName ?? project.layout.property.name ?? project.planName ?? "Saved floor plan",
  planName: project.planName,
  updatedAt: project.updatedAt,
});

export async function GET(request: Request) {
  const key = await userKey();
  if (!key) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const saved = await store().get(key, { type: "json" }) as CloudProject | CloudProjectLibrary | null;
  const projects = saved && "projects" in saved ? saved.projects : saved ? [saved] : [];
  const sorted = projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (projectId) return NextResponse.json({ project: sorted.find((project) => project.layout.projectId === projectId) ?? null, projects: sorted.map(summary) });
  return NextResponse.json({ project: sorted[0] ?? null, activeProject: sorted[0] ?? null, projects: sorted.map(summary) });
}

export async function PUT(request: Request) {
  const key = await userKey();
  if (!key) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json() as Partial<CloudProject>;
  if (!isPropertyLayout(body.layout) || validateLayout(body.layout).length) return NextResponse.json({ error: "Invalid project layout." }, { status: 400 });
  if (body.referencePlan && body.referencePlan.length > 10_000_000) return NextResponse.json({ error: "Floor-plan image is too large for cloud save." }, { status: 413 });
  const project: CloudProject = { layout: body.layout, projectName: body.projectName, planName: body.planName, referencePlan: body.referencePlan, updatedAt: new Date().toISOString() };
  const saved = await store().get(key, { type: "json" }) as CloudProject | CloudProjectLibrary | null;
  const projects = saved && "projects" in saved ? saved.projects : saved ? [saved] : [];
  const next = [project, ...projects.filter((savedProject) => savedProject.layout.projectId !== project.layout.projectId)]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 30);
  await store().setJSON(key, { projects: next });
  return NextResponse.json({ saved: true, updatedAt: project.updatedAt, projects: next.map(summary) });
}

export async function DELETE(request: Request) {
  const key = await userKey();
  if (!key) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required." }, { status: 400 });
  const saved = await store().get(key, { type: "json" }) as CloudProject | CloudProjectLibrary | null;
  const projects = saved && "projects" in saved ? saved.projects : saved ? [saved] : [];
  const next = projects.filter((project) => project.layout.projectId !== projectId);
  await store().setJSON(key, { projects: next });
  return NextResponse.json({ deleted: true, projects: next.map(summary) });
}
