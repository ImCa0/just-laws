export const RECENT_SEARCHES_KEY = "just-laws:recent-searches";
export const RECENT_SEARCHES_EVENT = "just-laws:recent-searches-change";

const MAX_RECENT_SEARCHES = 5;
let sessionRecentSearches = [];

function normalizedEntries(entries) {
  if (!Array.isArray(entries)) return [];

  return entries
    .filter((entry) => entry && typeof entry.query === "string" && typeof entry.path === "string")
    .map((entry) => ({ query: entry.query.trim(), path: entry.path }))
    .filter((entry) => entry.query && entry.path)
    .slice(0, MAX_RECENT_SEARCHES);
}

export function readRecentSearches(viewport) {
  if (!viewport) return [...sessionRecentSearches];

  try {
    const saved = normalizedEntries(JSON.parse(viewport.localStorage.getItem(RECENT_SEARCHES_KEY) || "[]"));
    sessionRecentSearches = saved;
  } catch {
    // Storage may be unavailable; keep the in-memory history for this session.
  }

  return [...sessionRecentSearches];
}

export function recordRecentSearch(entry, viewport) {
  const [nextEntry] = normalizedEntries([entry]);
  if (!nextEntry) return readRecentSearches(viewport);

  const current = readRecentSearches(viewport);
  const normalizedQuery = nextEntry.query.normalize("NFKC").toLowerCase();
  sessionRecentSearches = [
    nextEntry,
    ...current.filter((item) => item.query.normalize("NFKC").toLowerCase() !== normalizedQuery),
  ].slice(0, MAX_RECENT_SEARCHES);

  if (viewport) {
    try {
      viewport.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(sessionRecentSearches));
    } catch {
      // The in-memory history still works when persistence is blocked.
    }

    viewport.dispatchEvent(new viewport.CustomEvent(RECENT_SEARCHES_EVENT));
  }

  return [...sessionRecentSearches];
}
