import { saveTokens, clearTokens, type TokenSet } from "./token-store";

const AUTH0_DOMAIN = "https://auth0.openai.com";
const CLIENT_ID = "pdlLIX2Y72MIl2rhLhTE9VV9bN905kBh";

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
    const response = await fetch(`${AUTH0_DOMAIN}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        refresh_token: refreshToken,
      }),
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
