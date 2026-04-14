import { BrowserWindow, net } from "electron";
import crypto from "crypto";
import http from "http";
import { saveTokens } from "./token-store";

/**
 * OpenAI OAuth 2.0 PKCE flow via Electron BrowserWindow.
 *
 * Verified against OpenClaw's @mariozechner/pi-ai/oauth (openai-codex.js).
 * The flow:
 *   1. Start a localhost HTTP server on port 1455 to receive the callback
 *   2. Open a BrowserWindow to OpenAI's authorize endpoint
 *   3. User logs in on OpenAI
 *   4. OpenAI redirects to localhost:1455/auth/callback with the auth code
 *   5. Our HTTP server captures the code, shows a success page, closes
 *   6. Exchange the code for an access token via POST to /oauth/token
 *
 * If the port is busy or the flow fails, the user can fall back to
 * manually pasting an API key in Settings.
 */

const AUTH_DOMAIN = "https://auth.openai.com";
const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
const REDIRECT_URI = "http://localhost:1455/auth/callback";
const CALLBACK_PORT = 1455;
const SCOPES = "openid profile email offline_access";

export interface OAuthResult {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
}

// ─── PKCE ────────────────────────────────────────────────────

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  const challenge = base64URLEncode(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

// ─── HTML responses for the callback server ──────────────────

const SUCCESS_HTML = `<!DOCTYPE html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#e0e0e0">
<div style="text-align:center"><h1 style="color:#4ade80">✓ Authenticated</h1><p>You can close this window and return to Pokeshrimp.</p></div></body></html>`;

const ERROR_HTML = (msg: string) =>
  `<!DOCTYPE html><html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a2e;color:#e0e0e0">
<div style="text-align:center"><h1 style="color:#f87171">✗ Authentication Failed</h1><p>${msg}</p></div></body></html>`;

// ─── Main OAuth flow ─────────────────────────────────────────

export async function startOpenAIOAuth(): Promise<OAuthResult> {
  const { verifier, challenge } = generatePKCE();
  const state = crypto.randomBytes(16).toString("hex");

  const authURL = new URL(`${AUTH_DOMAIN}/oauth/authorize`);
  authURL.searchParams.set("response_type", "code");
  authURL.searchParams.set("client_id", CLIENT_ID);
  authURL.searchParams.set("redirect_uri", REDIRECT_URI);
  authURL.searchParams.set("scope", SCOPES);
  authURL.searchParams.set("code_challenge", challenge);
  authURL.searchParams.set("code_challenge_method", "S256");
  authURL.searchParams.set("state", state);
  // These parameters are required for Codex API access (from OpenClaw).
  // Without them, the token won't have api.responses.write scope.
  authURL.searchParams.set("id_token_add_organizations", "true");
  authURL.searchParams.set("codex_cli_simplified_flow", "true");
  authURL.searchParams.set("originator", "pokeshrimp");

  return new Promise<OAuthResult>((resolve, reject) => {
    let settled = false;
    let callbackServer: http.Server | null = null;
    let authWindow: BrowserWindow | null = null;

    function cleanup() {
      if (callbackServer) {
        try {
          callbackServer.close();
        } catch {
          /* ignore */
        }
        callbackServer = null;
      }
      if (authWindow && !authWindow.isDestroyed()) {
        authWindow.close();
      }
      authWindow = null;
    }

    function settle(result: OAuthResult | Error) {
      if (settled) return;
      settled = true;
      // Delay cleanup slightly so the success page renders
      setTimeout(cleanup, 500);
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    }

    // 1. Start localhost HTTP server to receive the OAuth callback
    callbackServer = http.createServer((req, res) => {
      if (!req.url?.startsWith("/auth/callback")) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      const errorDesc = url.searchParams.get("error_description");

      if (error) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(ERROR_HTML(`${error}: ${errorDesc ?? "Unknown error"}`));
        settle(new Error(`OAuth error: ${error} - ${errorDesc ?? ""}`));
        return;
      }

      if (returnedState !== state) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(ERROR_HTML("State mismatch — possible CSRF attack"));
        settle(new Error("OAuth state mismatch"));
        return;
      }

      if (!code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(ERROR_HTML("No authorization code received"));
        settle(new Error("No authorization code in callback"));
        return;
      }

      // Show success page immediately
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(SUCCESS_HTML);

      // Exchange code for token
      exchangeCodeForToken(code, verifier)
        .then((result) => {
          if (result.refreshToken) {
            saveTokens("openai", {
              accessToken: result.accessToken,
              refreshToken: result.refreshToken,
              expiresAt: result.expiresAt,
            });
          }
          settle(result);
        })
        .catch((err) => settle(err instanceof Error ? err : new Error(String(err))));
    });

    callbackServer.on("error", (err) => {
      settle(
        new Error(
          `Cannot start OAuth callback server on port ${CALLBACK_PORT}: ${err.message}. ` +
            `Another application may be using this port.`,
        ),
      );
    });

    callbackServer.listen(CALLBACK_PORT, "127.0.0.1", () => {
      // 2. Open BrowserWindow to the authorize URL
      authWindow = new BrowserWindow({
        width: 600,
        height: 700,
        show: false,
        title: "Login with OpenAI — Pokeshrimp",
        autoHideMenuBar: true,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
        },
      });

      authWindow.once("ready-to-show", () => authWindow?.show());

      authWindow.on("closed", () => {
        authWindow = null;
        if (!settled) {
          settle(new Error("User closed the login window"));
        }
      });

      authWindow.loadURL(authURL.toString());
    });
  });
}

// ─── Token Exchange ──────────────────────────────────────────

interface TokenExchangeResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<OAuthResult> {
  // Use Electron's net.fetch instead of Node's fetch so the request
  // goes through Chromium's network stack and respects system proxy.
  // Without this, users behind a proxy/VPN will get 403 from OpenAI
  // because Node's fetch bypasses the system proxy.
  const response = await net.fetch(`${AUTH_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as TokenExchangeResponse;
  if (!data.access_token) {
    throw new Error("No access_token in token response");
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
}
