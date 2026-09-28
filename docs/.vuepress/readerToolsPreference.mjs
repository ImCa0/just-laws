export const READER_TOOLS_EXPANDED_KEY = "just-laws:reader-tools-expanded";
let sessionExpanded = false;

export function readReaderToolsExpanded(viewport) {
  if (!viewport) return false;
  try {
    const saved = viewport.localStorage.getItem(READER_TOOLS_EXPANDED_KEY);
    if (saved === "true" || saved === "false") sessionExpanded = saved === "true";
  } catch {
    // Storage may be blocked; retain the preference during this app session.
  }
  return sessionExpanded;
}

export function saveReaderToolsExpanded(expanded, viewport) {
  if (!viewport) return;
  sessionExpanded = Boolean(expanded);
  try {
    viewport.localStorage.setItem(READER_TOOLS_EXPANDED_KEY, String(sessionExpanded));
  } catch {
    // Navigation still remembers the session preference when persistence fails.
  }
}
