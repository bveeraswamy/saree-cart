export interface AuthUser {
  username: string;
  role: string;
  token: string;
}

const STORAGE_KEY = 'RAGA Boutique:auth';

function load(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

class AuthStore extends EventTarget {
  private _user: AuthUser | null = load();

  get user(): AuthUser | null {
    return this._user;
  }

  get isLoggedIn(): boolean {
    return this._user !== null;
  }

  setUser(user: AuthUser) {
    this._user = user;
    this.persist();
  }

  clear() {
    this._user = null;
    this.persist();
  }

  private persist() {
    if (this._user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.dispatchEvent(new Event('change'));
  }
}

export const authStore = new AuthStore();
