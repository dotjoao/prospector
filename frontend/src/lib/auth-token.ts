const SESSION_KEY = 'leadhunter_auth';

interface StoredSession {
  token: string;
  username: string;
}

export function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredSession;
    return data.token || null;
  } catch {
    return null;
  }
}

export function getSessionKey(): string {
  return SESSION_KEY;
}

export type { StoredSession };
