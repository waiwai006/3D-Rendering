import { NextResponse } from "next/server";
import { auth0, auth0Configured } from "@/lib/auth0";

export async function GET() {
  if (!auth0Configured || !auth0) return NextResponse.json({ configured: false, user: null });
  const session = await auth0.getSession();
  const user = session?.user ? { name: session.user.name, email: session.user.email, picture: session.user.picture } : null;
  return NextResponse.json({ configured: true, user });
}
