/**
 * Configure Node.js fetch to respect system proxy settings.
 *
 * Node.js's built-in fetch (undici) does NOT automatically use
 * HTTP_PROXY / HTTPS_PROXY environment variables, unlike curl.
 * This module sets a global dispatcher that reads proxy settings
 * from env vars, making ALL fetch calls proxy-aware.
 *
 * Call this once at app startup (before any API calls).
 */

let initialized = false;

export async function initProxySupport(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const proxyUrl =
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy;

  if (!proxyUrl) return;

  try {
    const { setGlobalDispatcher, ProxyAgent } = await import("undici");
    const agent = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(agent);
    console.log(`[proxy] Using proxy: ${proxyUrl}`);
  } catch (err) {
    console.warn(
      "[proxy] Failed to configure proxy agent:",
      err instanceof Error ? err.message : err,
    );
  }
}
