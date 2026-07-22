import type { AuthUser } from '../state/auth-store';

const API_BASE = 'http://127.0.0.1:8000';

export class AuthApiError extends Error {}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthApiError(body.detail ?? 'Login failed. Please try again.');
  }
  return body as AuthUser;
}

export async function register(username: string, email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errors = body.errors as Record<string, string> | undefined;
    const message = errors ? Object.values(errors).join(' ') : 'Sign up failed. Please try again.';
    throw new AuthApiError(message);
  }
  return body as AuthUser;
}

export async function logout(token: string): Promise<void> {
  await fetch(`${API_BASE}/api/auth/logout/`, {
    method: 'POST',
    headers: { Authorization: `Token ${token}` },
  }).catch(() => {});
}

export interface AccountSummary {
  username: string;
  email: string;
  role: string;
  dateJoined: string;
}

export async function listUsers(token: string): Promise<AccountSummary[]> {
  const res = await fetch(`${API_BASE}/api/auth/users/`, {
    headers: { Authorization: `Token ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthApiError(body.detail ?? 'Could not load users.');
  }
  return body as AccountSummary[];
}

export async function getUser(token: string, username: string): Promise<AccountSummary> {
  const res = await fetch(`${API_BASE}/api/auth/users/${encodeURIComponent(username)}/`, {
    headers: { Authorization: `Token ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthApiError(body.detail ?? 'Could not load this user.');
  }
  return body as AccountSummary;
}

export async function updateUserRole(
  token: string,
  username: string,
  isPowerUser: boolean
): Promise<AccountSummary> {
  const res = await fetch(`${API_BASE}/api/auth/users/${encodeURIComponent(username)}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Token ${token}` },
    body: JSON.stringify({ isPowerUser }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthApiError(body.detail ?? 'Could not update this user.');
  }
  return body as AccountSummary;
}
