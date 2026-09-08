import { NextResponse } from "next/server";

export const runtime = "nodejs";
const ALLOWED = new Set(["hk.centanet.com", "hkcdn.centanet.com", "hkfloorplan.centanet.com", "www.squarefoot.com.hk", "in1.squarefoot.com.hk", "www.28hse.com", "cdn.spacious.hk"]);

export async function GET(request: Request) {
  try {
    const value = new URL(request.url).searchParams.get("url");
    if (!value) return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
    const url = new URL(value);
    if (url.protocol !== "https:" || !ALLOWED.has(url.hostname)) return NextResponse.json({ error: "Image host is not allowed" }, { status: 403 });
    const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; HKPropertyDesign/0.3)" }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) return NextResponse.json({ error: "Image could not be loaded" }, { status: 502 });
    const type = response.headers.get("content-type") ?? "image/jpeg";
    if (!type.startsWith("image/")) return NextResponse.json({ error: "Source is not an image" }, { status: 415 });
    return new NextResponse(await response.arrayBuffer(), { headers: { "Content-Type": type, "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" } });
  } catch {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }
}
