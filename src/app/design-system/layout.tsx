/* ─── Design System Preview Layout ────────────────────────────
 * Override the root body overflow:hidden for this route only.
 * The main app needs overflow:hidden for Electron's fixed panels,
 * but the preview page needs to scroll freely.
 * ────────────────────────────────────────────────────────── */

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 overflow-y-auto">{children}</div>;
}
