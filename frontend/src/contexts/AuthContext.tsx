import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/services/api';
import { getSessionKey, type StoredSession } from '@/lib/auth-token';

export interface AuthUser {
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = getSessionKey();

function readSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredSession;
    return data.token && data.username ? data : null;
  } catch {
    return null;
  }
}

function saveSession(session: StoredSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const session = readSession();
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const { user: validUser } = await api.getMe(session.token);
        setUser(validUser);
      } catch {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const result = await api.login(username, password);
      saveSession({ token: result.token, username: result.user.username });
      setUser(result.user);
      return { error: null };
    } catch (err) {
      return { error: (err as Error).message || 'Usuário ou senha incorretos.' };
    }
  }, []);

  const signOut = useCallback(() => {
    const session = readSession();
    if (session?.token) {
      api.logout(session.token).catch(() => {});
    }
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
