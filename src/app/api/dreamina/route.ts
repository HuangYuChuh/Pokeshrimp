import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { z } from "zod";

/* -----------------------------------------------------------------------
 * /api/dreamina — thin wrapper around the dreamina CLI binary.
 * GET  → check connection status + credits
 * POST → login (headless), checklogin, logout
 * ----------------------------------------------------------------------- */

const ENV_PATH = `${process.env.HOME}/.local/bin:${process.env.PATH}`;

function run(cmd: string): { ok: true; stdout: string } | { ok: false; stderr: string } {
  try {
    const stdout = execSync(cmd, { env: { ...process.env, PATH: ENV_PATH }, timeout: 15_000 })
      .toString()
      .trim();
    return { ok: true, stdout };
  } catch (e) {
    const stderr =
      e instanceof Error
        ? ((e as { stderr?: Buffer }).stderr?.toString().trim() ?? e.message)
        : String(e);
    return { ok: false, stderr };
  }
}

/* --- GET: status check ------------------------------------------------- */

export async function GET() {
  const which = run("command -v dreamina");
  if (!which.ok) {
    return NextResponse.json({ status: "not-installed" });
  }

  const credit = run("dreamina user_credit");
  if (!credit.ok) {
    return NextResponse.json({ status: "not-connected" });
  }

  // Parse credit output — looks for number patterns
  const match = credit.stdout.match(/(\d+)/);
  const credits = match ? parseInt(match[1], 10) : null;

  return NextResponse.json({ status: "connected", credits });
}

/* --- POST: login / checklogin / logout --------------------------------- */

/* Strict hex pattern — device_code from Dreamina is always a 32-char hex string */
const DEVICE_CODE_RE = /^[0-9a-f]{32}$/;

const PostSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("login") }),
  z.object({ action: z.literal("checklogin"), device_code: z.string().regex(DEVICE_CODE_RE) }),
  z.object({ action: z.literal("logout") }),
]);

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { action } = parsed.data;

  if (action === "login") {
    const result = run("dreamina login --headless");
    if (!result.ok) {
      return NextResponse.json({ error: "Login initialization failed" }, { status: 500 });
    }

    // Parse: verification_uri, user_code, device_code
    const uri = result.stdout.match(/verification_uri:\s*(.+)/)?.[1]?.trim();
    const userCode = result.stdout.match(/user_code:\s*(.+)/)?.[1]?.trim();
    const deviceCode = result.stdout.match(/device_code:\s*(.+)/)?.[1]?.trim();

    if (!uri || !userCode || !deviceCode) {
      return NextResponse.json({ error: "Failed to parse login output" }, { status: 500 });
    }

    return NextResponse.json({
      verification_uri: uri,
      user_code: userCode,
      device_code: deviceCode,
    });
  }

  if (action === "checklogin") {
    const { device_code } = parsed.data;
    const result = run(`dreamina login checklogin --device_code=${device_code}`);

    if (!result.ok) {
      // Still waiting or failed
      if (result.stderr.includes("pending") || result.stderr.includes("authorization_pending")) {
        return NextResponse.json({ status: "pending" });
      }
      return NextResponse.json({ status: "failed" });
    }

    return NextResponse.json({ status: "connected" });
  }

  if (action === "logout") {
    run("dreamina logout");
    return NextResponse.json({ status: "disconnected" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
