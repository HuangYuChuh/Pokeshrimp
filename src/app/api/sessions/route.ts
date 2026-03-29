import { NextResponse } from "next/server";
import { listSessions, createSession } from "@/lib/db";

export async function GET() {
  const sessions = await listSessions();
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const { title } = await req.json();
  const session = await createSession(title || "New Chat");
  return NextResponse.json(session, { status: 201 });
}
