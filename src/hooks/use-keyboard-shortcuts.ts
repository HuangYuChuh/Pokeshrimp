import { useEffect } from "react";

interface KeyboardShortcutOptions {
  onNewSession: () => void;
  onFocusChatInput: () => void;
  onOpenSettings: () => void;
  onCloseSettings: () => void;
  isSettingsOpen: boolean;
}

/**
 * Global keyboard shortcuts for the app.
 *
 * - Cmd/Ctrl + N  → New session
 * - Cmd/Ctrl + /  → Focus chat input
 * - Cmd/Ctrl + ,  → Open Settings
 * - Escape        → Close Settings (when open)
 */
export function useKeyboardShortcuts({
  onNewSession,
  onFocusChatInput,
  onOpenSettings,
  onCloseSettings,
  isSettingsOpen,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      // Escape — close settings if open (works even when typing)
      if (e.key === "Escape") {
        if (isSettingsOpen) {
          e.preventDefault();
          onCloseSettings();
        }
        return;
      }

      // Skip modifier shortcuts when the user is typing in an input/textarea
      // (except the chat textarea for Cmd+/ which focuses it)
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (!mod) return;

      if (e.key === "n") {
        e.preventDefault();
        if (!isTyping) {
          onNewSession();
        }
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        onFocusChatInput();
        return;
      }

      if (e.key === ",") {
        e.preventDefault();
        if (!isTyping) {
          onOpenSettings();
        }
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onNewSession, onFocusChatInput, onOpenSettings, onCloseSettings, isSettingsOpen]);
}
