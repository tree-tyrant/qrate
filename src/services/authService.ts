import type { AuthError, AuthResponse, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/supabase/client';
import type { MarketplaceProfile, UserAccount, UserRole } from '@/utils/types';

export interface AuthenticatedAccount extends MarketplaceProfile {
  legacyPassword?: string | null;
}

export interface AuthResult {
  account: AuthenticatedAccount | null;
  error?: string;
  fromSupabase: boolean;
}

export interface PasswordCredentials {
  identifier: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  password: string;
  role: UserRole;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
}

function mapUserToAccount(user: User | null, roleFallback: UserRole = 'dj'): AuthenticatedAccount | null {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  const role = (metadata.role as UserRole) ?? roleFallback;
  const username = typeof metadata.username === 'string' ? metadata.username : undefined;
  const displayName = typeof metadata.displayName === 'string' ? metadata.displayName : undefined;

  return {
    id: user.id,
    email: user.email ?? '',
    role,
    username: username ?? (user.email ? user.email.split('@')[0] : undefined) ?? null,
    displayName: displayName ?? username ?? user.email ?? null,
    avatarUrl: typeof metadata.avatarUrl === 'string' ? metadata.avatarUrl : null,
    createdAt: user.created_at ?? undefined,
    metadata: metadata ?? undefined
  };
}

export async function signInWithPassword({ identifier, password }: PasswordCredentials, roleFallback: UserRole = 'host'): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      account: null,
      fromSupabase: false,
      error: 'Supabase not configured'
    };
  }

  const trimmedIdentifier = identifier.trim();
  const email = trimmedIdentifier.includes('@') ? trimmedIdentifier : undefined;

  if (!email) {
    return {
      account: null,
      fromSupabase: true,
      error: 'Please sign in with the email used for Supabase accounts.'
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return {
      account: null,
      error: error.message,
      fromSupabase: true
    };
  }

  return {
    account: mapUserToAccount(data.user, roleFallback),
    fromSupabase: true
  };
}

export async function signUpWithPassword(payload: SignupPayload): Promise<AuthResult> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      account: null,
      fromSupabase: false,
      error: 'Supabase not configured'
    };
  }

  const { email, password, role, username, displayName, avatarUrl } = payload;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        username,
        displayName,
        avatarUrl
      }
    }
  });

  if (error) {
    return {
      account: null,
      error: error.message,
      fromSupabase: true
    };
  }

  return {
    account: mapUserToAccount(data.user, role),
    fromSupabase: true
  };
}

export async function signOut(): Promise<AuthError | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { error } = await supabase.auth.signOut();
  return error ?? null;
}

export async function getActiveSession(): Promise<AuthResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      account: null,
      fromSupabase: false
    };
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return {
      account: null,
      fromSupabase: true,
      error: error.message
    };
  }

  return {
    account: mapUserToAccount(data.session?.user ?? null, 'host'),
    fromSupabase: true
  };
}

export function buildAccountFromSupabase(account: AuthenticatedAccount): UserAccount {
  return {
    id: account.id,
    role: account.role,
    email: account.email,
    username: account.username ?? null,
    displayName: account.displayName ?? account.username ?? account.email,
    avatarUrl: account.avatarUrl ?? null,
    legacyPassword: null,
    events: [],
    trashedEvents: [],
    metadata: account.metadata
  };
}

export function mapSupabaseUserToLocalAccount(user: User | null, roleFallback: UserRole = 'dj'): UserAccount | null {
  const account = mapUserToAccount(user, roleFallback);
  return account ? buildAccountFromSupabase(account) : null;
}

export function isSupabaseAuthEnabled(): boolean {
  return isSupabaseConfigured;
}
