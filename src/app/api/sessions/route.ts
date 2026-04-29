import { z } from "zod";
import { NextResponse } from "next/server";
import { listSessions, createSession } from "@/lib/db";

const CreateSessionSchema = z
  .object({
    title: z.string().max(200).optional(),
    id: z.string().uuid().optional(),
  })
  .strict();

export async function GET() {
  const sessions = await listSessions();
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { title, id } = parsed.data;
  const session = await createSession(title || "New Chat", id);
  return NextResponse.json(session, { status: 201 });
}
