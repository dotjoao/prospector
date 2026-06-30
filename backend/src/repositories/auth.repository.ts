import { getSupabase, isSupabaseConfigured } from '../lib/supabase.js';
import { getDbPool, isDbDirectAvailable } from '../lib/db.js';

export interface AuthUser {
  id: string;
  username: string;
}

const SESSION_DAYS = 7;

export class AuthRepository {
  async verifyLogin(username: string, password: string): Promise<AuthUser | null> {
    if (isSupabaseConfigured()) {
      return this.verifyLoginViaSupabase(username, password);
    }

    if (isDbDirectAvailable()) {
      return this.verifyLoginViaPg(username, password);
    }

    throw new Error('Autenticação indisponível: configure Supabase ou SUPABASE_DB_PASSWORD.');
  }

  private async verifyLoginViaPg(username: string, password: string): Promise<AuthUser | null> {
    const { rows } = await getDbPool().query<{ user_id: string; username: string }>(
      'SELECT user_id, username FROM public.verify_user_login($1, $2)',
      [username, password]
    );
    const row = rows[0];
    return row ? { id: row.user_id, username: row.username } : null;
  }

  private async verifyLoginViaSupabase(username: string, password: string): Promise<AuthUser | null> {
    const { data, error } = await getSupabase().rpc('verify_user_login', {
      p_username: username,
      p_password: password,
    });

    if (error) {
      if (error.code === 'PGRST202' || error.message.includes('does not exist')) {
        throw new Error('Tabela de usuários não encontrada. Execute a migration 004_app_users.sql.');
      }
      throw new Error(`[Auth] Erro ao verificar login: ${error.message}`);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    return { id: row.user_id, username: row.username };
  }

  async createSession(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

    const { error } = await getSupabase().from('auth_sessions').insert({
      token,
      user_id: userId,
      expires_at: expiresAt.toISOString(),
    });

    if (error) throw new Error(`[Auth] Erro ao criar sessão: ${error.message}`);
  }

  async getSessionUser(token: string): Promise<AuthUser | null> {
    const { data, error } = await getSupabase()
      .from('auth_sessions')
      .select('expires_at, app_users(id, username, is_active)')
      .eq('token', token)
      .maybeSingle();

    if (error) throw new Error(`[Auth] Erro ao validar sessão: ${error.message}`);
    if (!data) return null;

    const expiresAt = new Date(data.expires_at);
    if (expiresAt <= new Date()) {
      await this.deleteSession(token);
      return null;
    }

    const userRaw = data.app_users as
      | { id: string; username: string; is_active: boolean }
      | { id: string; username: string; is_active: boolean }[]
      | null;
    const user = Array.isArray(userRaw) ? userRaw[0] : userRaw;
    if (!user?.is_active) return null;

    return { id: user.id, username: user.username };
  }

  async deleteSession(token: string): Promise<void> {
    await getSupabase().from('auth_sessions').delete().eq('token', token);
  }
}

export const authRepository = new AuthRepository();
