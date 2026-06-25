import { randomBytes } from 'crypto';
import { getPersistenceMode } from '../lib/persistence.js';
import { authRepository } from '../repositories/auth.repository.js';

const FALLBACK_USER = process.env.AUTH_USER || 'admin';
const FALLBACK_PASSWORD = process.env.AUTH_PASSWORD || 'leadhunter123';

const fallbackSessions = new Set<string>();

export interface LoginResult {
  token: string;
  user: { username: string };
}

export class AuthService {
  async login(username: string, password: string): Promise<LoginResult | null> {
    const mode = getPersistenceMode();

    if (mode === 'supabase-db') {
      const user = await authRepository.verifyLogin(username, password);
      if (!user) return null;

      const token = randomBytes(32).toString('hex');
      await authRepository.createSession(user.id, token);
      return { token, user: { username: user.username } };
    }

    if (
      username.trim().toLowerCase() === FALLBACK_USER.toLowerCase() &&
      password === FALLBACK_PASSWORD
    ) {
      const token = randomBytes(32).toString('hex');
      fallbackSessions.add(token);
      return { token, user: { username: FALLBACK_USER } };
    }

    return null;
  }

  async validateToken(token: string): Promise<{ username: string } | null> {
    const mode = getPersistenceMode();

    if (mode === 'supabase-db') {
      const user = await authRepository.getSessionUser(token);
      return user ? { username: user.username } : null;
    }

    return fallbackSessions.has(token) ? { username: FALLBACK_USER } : null;
  }

  async logout(token: string): Promise<void> {
    if (!token) return;

    if (getPersistenceMode() === 'supabase-db') {
      await authRepository.deleteSession(token);
    } else {
      fallbackSessions.delete(token);
    }
  }
}

export const authService = new AuthService();
