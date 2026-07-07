import { getStore } from "@netlify/blobs";
import { NextResponse } from "next/server";
import { auth0, auth0Configured } from "@/lib/auth0";
import { isPropertyLayout, validateLayout, type PropertyLayout } from "@/lib/layout-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CloudProject {
  layout: PropertyLayout;
  planName?: string;
  referencePlan?: string;
  updatedAt: string;
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

export async function GET() {
  const key = await userKey();
  if (!key) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const project = await store().get(key, { type: "json" }) as CloudProject | null;
  return NextResponse.json({ project });
}

export async function PUT(request: Request) {
  const key = await userKey();
  if (!key) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json() as Partial<CloudProject>;
  if (!isPropertyLayout(body.layout) || validateLayout(body.layout).length) return NextResponse.json({ error: "Invalid project layout." }, { status: 400 });
  if (body.referencePlan && body.referencePlan.length > 10_000_000) return NextResponse.json({ error: "Floor-plan image is too large for cloud save." }, { status: 413 });
  const project: CloudProject = { layout: body.layout, planName: body.planName, referencePlan: body.referencePlan, updatedAt: new Date().toISOString() };
  await store().setJSON(key, project);
  return NextResponse.json({ saved: true, updatedAt: project.updatedAt });
}
