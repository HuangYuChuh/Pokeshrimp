import { NextResponse } from "next/server";
import { DesignfileEngine } from "@/core/designfile/engine";

export async function GET() {
  const engine = new DesignfileEngine(process.cwd());

  if (!engine.isLoaded) {
    return NextResponse.json(
      { error: "No designfile.yaml found" },
      { status: 404 },
    );
  }

  const overview = engine.getOverview();
  return NextResponse.json(overview);
}
