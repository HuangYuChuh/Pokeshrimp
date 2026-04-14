import { z } from "zod";
import { approvalBus } from "./channel";
import { rateLimit } from "@/core/http/rate-limit";

const limiter = rateLimit({ interval: 60_000, limit: 60 });

const ApprovalBodySchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["allow-once", "always-allow", "deny"]),
});

/**
 * POST /api/approval
 *
 * The frontend calls this when the user clicks Allow Once / Always
 * Allow / Deny on an approval card. The request body must contain:
 *   { id: string, decision: "allow-once" | "always-allow" | "deny" }
 *
 * The ApprovalBus resolves the pending Promise in the
 * CommandApprovalMiddleware, which unblocks the tool execution.
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const { success } = limiter(ip);
  if (!success) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

  const raw = await req.json().catch(() => null);
  if (!raw) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = ApprovalBodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid payload", details: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { id, decision } = parsed.data;
  const found = approvalBus.respond(id, decision);

  if (!found) {
    return new Response(
      JSON.stringify({ error: "Approval request not found or already expired" }),
      { status: 410, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true, id, decision }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
