import type { MediaSummary } from "./api";

export interface AvyraUser {
  name: string;
  email: string;
  createdAt: string;
}

export interface ContinueWatchingItem {
  id: string;
  title: string;
  media_type: string;
  backdrop_url: string | null;
  poster_url: string | null;
  progress: number;
  subtitle: string;
}

export const SYNC_EVENT = "avyra-sync-change";
export const AUTH_EVENT = "avyra-auth-change";

export function getCurrentUser(): AvyraUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("avyra_user");
    return raw ? (JSON.parse(raw) as AvyraUser) : null;
  } catch {
    return null;
  }
}

function watchlistKey(email?: string | null): string {
  return email ? `avyra_watchlist:${email.toLowerCase()}` : "avyra_watchlist:guest";
}

function continueWatchingKey(email?: string | null): string {
  return email
    ? `avyra_continue_watching:${email.toLowerCase()}`
    : "avyra_continue_watching:guest";
}

function notifySync() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  }
}

export function getWatchlist(): MediaSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const user = getCurrentUser();
    const key = watchlistKey(user?.email);
    const raw =
      localStorage.getItem(key) ||
      (!user ? localStorage.getItem("avyra_watchlist") : null);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(items: MediaSummary[]): void {
  if (typeof window === "undefined") return;
  const user = getCurrentUser();
  const key = watchlistKey(user?.email);
  try {
    localStorage.setItem(key, JSON.stringify(items));
    if (!user) {
      localStorage.setItem("avyra_watchlist", JSON.stringify(items));
    }
    notifySync();
  } catch {}

  if (user?.email) {
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, watchlist: items }),
    }).catch(() => {});
  }
}

export function toggleWatchlistItem(media: MediaSummary): boolean {
  const list = getWatchlist();
  const exists = list.some((m) => m.id === media.id);
  const next = exists ? list.filter((m) => m.id !== media.id) : [media, ...list];
  saveWatchlist(next);
  return !exists;
}

export function getContinueWatching(): ContinueWatchingItem[] {
  if (typeof window === "undefined") return [];
  try {
    const user = getCurrentUser();
    const key = continueWatchingKey(user?.email);
    const raw =
      localStorage.getItem(key) ||
      (!user ? localStorage.getItem("avyra_continue_watching") : null);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordContinueWatching(entry: ContinueWatchingItem): void {
  if (typeof window === "undefined") return;
  const user = getCurrentUser();
  const key = continueWatchingKey(user?.email);
  const list = getContinueWatching();
  const filtered = list.filter((i) => i.id !== entry.id);
  const next = [entry, ...filtered].slice(0, 12);

  try {
    localStorage.setItem(key, JSON.stringify(next));
    if (!user) {
      localStorage.setItem("avyra_continue_watching", JSON.stringify(next));
    }
    notifySync();
  } catch {}

  if (user?.email) {
    fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, continueWatching: next }),
    }).catch(() => {});
  }
}

export function applyCloudSyncData(
  email: string,
  watchlist: MediaSummary[],
  continueWatching: ContinueWatchingItem[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(watchlistKey(email), JSON.stringify(watchlist || []));
    localStorage.setItem(
      continueWatchingKey(email),
      JSON.stringify(continueWatching || [])
    );
    notifySync();
  } catch {}
}

export async function pullAccountSync(email?: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const targetEmail = email || getCurrentUser()?.email;
  if (!targetEmail) return false;

  try {
    const res = await fetch(`/api/sync?email=${encodeURIComponent(targetEmail)}`, {
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data && data.synced) {
      const cloudW: MediaSummary[] = Array.isArray(data.watchlist) ? data.watchlist : [];
      const cloudCW: ContinueWatchingItem[] = Array.isArray(data.continueWatching)
        ? data.continueWatching
        : [];
      applyCloudSyncData(targetEmail, cloudW, cloudCW);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
