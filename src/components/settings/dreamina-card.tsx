"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, CardContent, Chip } from "@/design-system/components";
import { Icon } from "@iconify/react";
import { useT } from "@/lib/i18n";

/* -----------------------------------------------------------------------
 * DreaminaCard
 * Settings card for connecting / disconnecting the Dreamina CLI.
 * Three states: not-installed → not-connected → connected.
 * ----------------------------------------------------------------------- */

type Status = "loading" | "not-installed" | "not-connected" | "connecting" | "connected";

interface AuthInfo {
  verification_uri: string;
  user_code: string;
  device_code: string;
}

export function DreaminaCard() {
  const t = useT();
  const [status, setStatus] = useState<Status>("loading");
  const [credits, setCredits] = useState<number | null>(null);
  const [auth, setAuth] = useState<AuthInfo | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  /* --- Check status on mount ----------------------------------------- */

  const checkStatus = useCallback(() => {
    fetch("/api/dreamina")
      .then((r) => r.json())
      .then((data) => {
        setStatus(data.status === "connected" ? "connected" : data.status);
        if (data.credits != null) setCredits(data.credits);
      })
      .catch(() => setStatus("not-installed"));
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  /* --- Cleanup poll on unmount --------------------------------------- */

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  /* --- Start login --------------------------------------------------- */

  const handleConnect = useCallback(async () => {
    setStatus("connecting");
    try {
      const res = await fetch("/api/dreamina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("not-connected");
        return;
      }
      setAuth(data);

      // Poll checklogin every 5s
      pollRef.current = setInterval(async () => {
        try {
          const r = await fetch("/api/dreamina", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "checklogin", device_code: data.device_code }),
          });
          const result = await r.json();
          if (result.status === "connected") {
            clearInterval(pollRef.current);
            pollRef.current = undefined;
            setAuth(null);
            checkStatus();
          }
        } catch {
          /* keep polling */
        }
      }, 5000);

      // Auto-stop after 2 minutes
      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = undefined;
          setAuth(null);
          setStatus("not-connected");
        }
      }, 120_000);
    } catch {
      setStatus("not-connected");
    }
  }, [checkStatus]);

  /* --- Disconnect ---------------------------------------------------- */

  const handleDisconnect = useCallback(async () => {
    await fetch("/api/dreamina", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    }).catch(() => {});
    setCredits(null);
    setStatus("not-connected");
  }, []);

  /* --- Render -------------------------------------------------------- */

  return (
    <Card>
      <CardContent className="flex items-start gap-[var(--space-4)] px-[var(--space-4)] py-[var(--space-4)]">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--accent-subtle)]">
          <Icon icon="solar:pallete-2-outline" width={22} className="text-[var(--accent)]" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[var(--space-2)]">
            <span className="text-[var(--text-body)] font-semibold text-[var(--ink)]">
              {t.dreamina}
            </span>
            {status === "connected" && (
              <Chip size="sm" variant="success">
                {t.dreaminaConnected}
              </Chip>
            )}
            {status === "not-connected" && (
              <Chip size="sm" variant="error">
                {t.dreaminaNotConnected}
              </Chip>
            )}
            {status === "not-installed" && (
              <Chip size="sm" variant="error">
                {t.dreaminaNotInstalled}
              </Chip>
            )}
          </div>

          <p className="mt-[var(--space-1)] text-[var(--text-caption)] text-[var(--ink-tertiary)]">
            {t.dreaminaDescription}
          </p>

          {/* Not installed hint */}
          {status === "not-installed" && (
            <div className="mt-[var(--space-3)]">
              <code className="block rounded-[var(--radius-md)] bg-[var(--canvas-subtle)] px-[var(--space-3)] py-[var(--space-2)] font-[var(--font-mono)] text-[var(--text-caption)] text-[var(--ink-secondary)]">
                curl -fsSL https://jimeng.jianying.com/cli | bash
              </code>
            </div>
          )}

          {/* Connected: credits */}
          {status === "connected" && credits != null && (
            <p className="mt-[var(--space-2)] text-[var(--text-caption)] text-[var(--ink-secondary)]">
              {t.dreaminaCredits.replace("{n}", String(credits))}
            </p>
          )}

          {/* Connecting: auth info */}
          {status === "connecting" && auth && (
            <div className="mt-[var(--space-3)] space-y-[var(--space-2)]">
              <p className="text-[var(--text-caption)] text-[var(--ink-secondary)]">
                {t.dreaminaAuthPrompt}
              </p>
              <div className="flex items-center gap-[var(--space-2)]">
                <code className="rounded-[var(--radius-sm)] bg-[var(--canvas-subtle)] px-[var(--space-2)] py-[var(--space-1)] font-[var(--font-mono)] text-[var(--text-body)] font-semibold text-[var(--accent)]">
                  {auth.user_code}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(auth.verification_uri, "_blank")}
                >
                  {t.dreaminaOpenLink}
                </Button>
              </div>
              <p className="flex items-center gap-[var(--space-2)] text-[var(--text-micro)] text-[var(--ink-ghost)]">
                <Icon icon="solar:refresh-outline" width={12} className="animate-spin" />
                {t.dreaminaWaiting}
              </p>
            </div>
          )}

          {/* Connecting without auth yet */}
          {status === "connecting" && !auth && (
            <p className="mt-[var(--space-2)] text-[var(--text-caption)] text-[var(--ink-ghost)]">
              {t.dreaminaWaiting}
            </p>
          )}
        </div>

        {/* Action button */}
        <div className="shrink-0">
          {status === "not-connected" && (
            <Button variant="primary" size="sm" onClick={handleConnect}>
              {t.dreaminaConnect}
            </Button>
          )}
          {status === "connected" && (
            <Button variant="ghost" size="sm" onClick={handleDisconnect}>
              {t.dreaminaDisconnect}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
