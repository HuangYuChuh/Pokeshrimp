import { approvalBus } from "./channel";
import type { ApprovalDecision } from "@/core/permission/approval";

const VALID_DECISIONS = new Set<ApprovalDecision>([
  "allow-once",
  "always-allow",
  "deny",
]);

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
  let body: { id?: string; decision?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { id, decision } = body;

  if (!id || typeof id !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid 'id'" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!decision || !VALID_DECISIONS.has(decision as ApprovalDecision)) {
    return new Response(
      JSON.stringify({
        error: `Invalid decision. Must be one of: ${[...VALID_DECISIONS].join(", ")}`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const found = approvalBus.respond(id, decision as ApprovalDecision);

  if (!found) {
    return new Response(
      JSON.stringify({ error: "Approval request not found or already expired" }),
      { status: 410, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, id, decision }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
