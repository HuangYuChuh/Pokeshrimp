import { net } from "electron";
import { saveTokens, clearTokens, type TokenSet } from "./token-store";

const AUTH_DOMAIN = "https://auth.openai.com";
const CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenSet | null> {
  try {
    const response = await net.fetch(`${AUTH_DOMAIN}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        refresh_token: refreshToken,
      }).toString(),
    });

    if (!response.ok) {
      console.error(
        `[token-refresh] Refresh failed (${response.status}):`,
        await response.text()
      );
      clearTokens("openai");
      return null;
    }

    const data = (await response.json()) as TokenResponse;
    if (!data.access_token) {
      clearTokens("openai");
      return null;
    }

    const tokens: TokenSet = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    saveTokens("openai", tokens);
    return tokens;
  } catch (err) {
    console.error("[token-refresh] Refresh error:", err);
    clearTokens("openai");
    return null;
  }
}
