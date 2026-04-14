"use client";

import { useMemo } from "react";
import { ApprovalCard, parseApprovalEvents } from "@/components/approval-card";

interface ApprovalCardsProps {
  data: unknown[];
}

export function ApprovalCards({ data }: ApprovalCardsProps) {
  const { requests, resolved } = useMemo(() => parseApprovalEvents(data), [data]);

  if (requests.size === 0) return null;

  return (
    <>
      {[...requests.values()].map((req) => (
        <ApprovalCard key={req.id} request={req} resolved={resolved.get(req.id)} />
      ))}
    </>
  );
}
