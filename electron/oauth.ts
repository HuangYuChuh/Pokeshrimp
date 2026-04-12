import { BrowserWindow } from "electron";
import crypto from "crypto";

/**
 * OpenAI OAuth 2.0 PKCE flow via Electron BrowserWindow.
 *
 * Uses OpenAI's Auth0 tenant (auth0.openai.com) with their known public
 * CLI client ID. The flow opens a BrowserWindow for the user to log in,
 * intercepts the redirect to capture the authorization code, then exchanges
 * it for an access token.
 *
 * If OpenAI changes their Auth0 configuration or revokes the client ID,
 * this flow will fail gracefully and the user can fall back to manually
 * pasting an API key in Settings.
 */

const AUTH0_DOMAIN = "https://auth0.openai.com";
const CLIENT_ID = "pdlLIX2Y72MIl2rhLhTE9VV9bN905kBh";
const REDIRECT_URI = "http://localhost:3099/oauth/callback";
const AUDIENCE = "https://api.openai.com/v1";
const SCOPES = "openid email profile offline_access";

function base64URLEncode(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  const challenge = base64URLEncode(
    crypto.createHash("sha256").update(verifier).digest()
  );
  return { verifier, challenge };
}

export async function startOpenAIOAuth(): Promise<{ accessToken: string }> {
  const { verifier, challenge } = generatePKCE();

  const authURL = new URL(`${AUTH0_DOMAIN}/authorize`);
  authURL.searchParams.set("response_type", "code");
  authURL.searchParams.set("client_id", CLIENT_ID);
  authURL.searchParams.set("redirect_uri", REDIRECT_URI);
  authURL.searchParams.set("scope", SCOPES);
  authURL.searchParams.set("code_challenge", challenge);
  authURL.searchParams.set("code_challenge_method", "S256");
  authURL.searchParams.set("audience", AUDIENCE);

  return new Promise<{ accessToken: string }>((resolve, reject) => {
    const authWindow = new BrowserWindow({
      width: 600,
      height: 700,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    let settled = false;

    function settle(
      fn: typeof resolve | typeof reject,
      value: { accessToken: string } | Error
    ) {
      if (settled) return;
      settled = true;
      if (!authWindow.isDestroyed()) authWindow.close();
      (fn as (v: unknown) => void)(value);
    }

    authWindow.once("ready-to-show", () => authWindow.show());

    authWindow.on("closed", () => {
      if (!settled) {
        settle(reject, new Error("User closed the login window"));
      }
    });

    // Intercept navigation to the redirect URI
    authWindow.webContents.on("will-redirect", (_event, url) => {
      handleRedirect(url);
    });

    authWindow.webContents.on("will-navigate", (_event, url) => {
      handleRedirect(url);
    });

    function handleRedirect(url: string) {
      if (!url.startsWith(REDIRECT_URI)) return;

      const parsed = new URL(url);
      const code = parsed.searchParams.get("code");
      const error = parsed.searchParams.get("error");

      if (error) {
        settle(
          reject,
          new Error(`OAuth error: ${error} - ${parsed.searchParams.get("error_description") ?? ""}`)
        );
        return;
      }

      if (!code) {
        settle(reject, new Error("No authorization code in redirect"));
        return;
      }

      exchangeCodeForToken(code, verifier)
        .then((accessToken) => settle(resolve, { accessToken }))
        .catch((err) => settle(reject, err));
    }

    authWindow.loadURL(authURL.toString());
  });
}

async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<string> {
  const response = await fetch(`${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      code_verifier: codeVerifier,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("No access_token in token response");
  }

  return data.access_token;
}
