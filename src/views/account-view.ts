import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authStore, type AuthUser } from '../state/auth-store';
import { StoreController } from '../state/store-controller';
import { login, register, logout, listUsers, AuthApiError, type AccountSummary } from '../api/auth-api';
import { sharedStyles } from '../styles/shared-styles';

type Mode = 'signin' | 'signup';
type AdminTab = 'profile' | 'users';

@customElement('account-view')
export class AccountView extends LitElement {
  @state() private mode: Mode = 'signin';
  @state() private username = '';
  @state() private email = '';
  @state() private password = '';
  @state() private loading = false;
  @state() private error = '';

  @state() private adminTab: AdminTab = 'profile';
  @state() private users: AccountSummary[] = [];
  @state() private usersLoading = false;
  @state() private usersError = '';
  @state() private usersLoaded = false;

  // retains a StoreController subscription to re-render on store changes
  auth = new StoreController(this, authStore);

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .intro {
        margin-bottom: 22px;
      }
      .intro h1 {
        font-size: 19px;
        margin: 0 0 6px;
      }
      .intro p {
        font-size: 13.5px;
        color: var(--text-dim);
        margin: 0;
      }
      .tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 18px;
      }
      .tabs button {
        flex: 1;
        font: 700 13px var(--sans);
        background: var(--bg-elevated);
        color: var(--text-dim);
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 9px 0;
        cursor: pointer;
      }
      .tabs button.active {
        background: var(--accent);
        border-color: var(--accent);
        color: var(--accent-contrast);
      }
      .field {
        margin-bottom: 14px;
      }
      label {
        display: block;
        font-size: 12px;
        color: var(--text-dim);
        margin-bottom: 5px;
      }
      input {
        width: 100%;
        font: 500 14px var(--sans);
        color: var(--text);
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 11px 12px;
      }
      input:focus {
        outline: 2px solid var(--accent);
        outline-offset: -1px;
      }
      .error {
        font-size: 12.5px;
        color: var(--bad);
        margin: -6px 0 14px;
      }
      button.primary {
        width: 100%;
      }
      .card {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 18px;
        background: var(--bg-elevated);
      }
      .card .who {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }
      .avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--accent);
        color: var(--accent-contrast);
        display: flex;
        align-items: center;
        justify-content: center;
        font: 700 17px var(--sans);
        flex: none;
      }
      .who .name {
        font: 700 15px var(--sans);
        color: var(--text);
      }
      button.ghost {
        width: 100%;
      }
      .hint {
        font-size: 11.5px;
        color: var(--text-faint);
        margin-top: 14px;
        text-align: center;
      }
      .user-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid var(--border);
        cursor: pointer;
      }
      .user-row:last-child {
        border-bottom: none;
      }
      .user-row .avatar {
        width: 34px;
        height: 34px;
        font-size: 13px;
      }
      .user-row .meta {
        flex: 1;
        min-width: 0;
      }
      .user-row .name {
        font: 700 13.5px var(--sans);
        color: var(--text);
      }
      .user-row .email {
        font-size: 11.5px;
        color: var(--text-faint);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    `,
  ];

  private setMode(mode: Mode) {
    this.mode = mode;
    this.error = '';
  }

  private async onSubmit(e: Event) {
    e.preventDefault();
    if (this.loading) return;
    if (!this.username.trim() || !this.password.trim()) return;
    if (this.mode === 'signup' && !this.email.trim()) return;

    this.loading = true;
    this.error = '';
    try {
      const user =
        this.mode === 'signin'
          ? await login(this.username.trim(), this.password)
          : await register(this.username.trim(), this.email.trim(), this.password);
      authStore.setUser(user);
      this.password = '';
    } catch (err) {
      this.error = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    } finally {
      this.loading = false;
    }
  }

  private async onLogout() {
    const user = authStore.user;
    authStore.clear();
    if (user) await logout(user.token);
  }

  private async openUsersTab() {
    this.adminTab = 'users';
    if (this.usersLoaded || this.usersLoading) return;
    const user = authStore.user;
    if (!user) return;
    this.usersLoading = true;
    this.usersError = '';
    try {
      this.users = await listUsers(user.token);
      this.usersLoaded = true;
    } catch (err) {
      this.usersError = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    } finally {
      this.usersLoading = false;
    }
  }

  private renderProfileCard(user: AuthUser) {
    return html`
      <div class="card">
        <div class="who">
          <span class="avatar">${user.username.charAt(0).toUpperCase()}</span>
          <div>
            <div class="name">${user.username}</div>
            <span class="badge">${user.role}</span>
          </div>
        </div>
        <button class="ghost" @click=${this.onLogout}>Log Out</button>
      </div>
    `;
  }

  private renderUsersTab() {
    if (this.usersLoading) {
      return html`<div class="card"><p>Loading users…</p></div>`;
    }
    if (this.usersError) {
      return html`<div class="card"><p class="error">${this.usersError}</p></div>`;
    }
    return html`
      <div class="card">
        ${this.users.map(
          (u) => html`
            <div class="user-row" @click=${() => (location.hash = `#/account/users/${u.username}`)}>
              <span class="avatar">${u.username.charAt(0).toUpperCase()}</span>
              <div class="meta">
                <div class="name">${u.username}</div>
                <div class="email">${u.email || 'No email'}</div>
              </div>
              <span class="badge">${u.role}</span>
            </div>
          `
        )}
      </div>
    `;
  }

  render() {
    const user = authStore.user;

    if (user) {
      const isAdmin = user.role === 'Site Admin';
      return html`
        ${isAdmin
          ? html`
              <div class="tabs">
                <button
                  class=${this.adminTab === 'profile' ? 'active' : ''}
                  @click=${() => (this.adminTab = 'profile')}
                >
                  Profile
                </button>
                <button class=${this.adminTab === 'users' ? 'active' : ''} @click=${() => this.openUsersTab()}>
                  Users
                </button>
              </div>
            `
          : nothing}
        ${isAdmin && this.adminTab === 'users' ? this.renderUsersTab() : this.renderProfileCard(user)}
      `;
    }

    const isSignup = this.mode === 'signup';

    return html`
      <div class="intro">
        <h1>Account</h1>
        <p>${isSignup ? 'Create an account to get started.' : 'Sign in to your account.'}</p>
      </div>

      <div class="tabs">
        <button class=${!isSignup ? 'active' : ''} @click=${() => this.setMode('signin')}>
          Sign In
        </button>
        <button class=${isSignup ? 'active' : ''} @click=${() => this.setMode('signup')}>
          Sign Up
        </button>
      </div>

      <form @submit=${this.onSubmit}>
        <div class="field">
          <label>Username</label>
          <input
            .value=${this.username}
            @input=${(e: Event) => (this.username = (e.target as HTMLInputElement).value)}
            placeholder="yourname"
            autocomplete="username"
          />
        </div>
        ${isSignup
          ? html`
              <div class="field">
                <label>Email</label>
                <input
                  type="email"
                  .value=${this.email}
                  @input=${(e: Event) => (this.email = (e.target as HTMLInputElement).value)}
                  placeholder="you@example.com"
                  autocomplete="email"
                />
              </div>
            `
          : nothing}
        <div class="field">
          <label>Password</label>
          <input
            type="password"
            .value=${this.password}
            @input=${(e: Event) => (this.password = (e.target as HTMLInputElement).value)}
            placeholder="••••••••"
            autocomplete=${isSignup ? 'new-password' : 'current-password'}
          />
        </div>
        ${this.error ? html`<p class="error">${this.error}</p>` : nothing}
        <button class="primary" type="submit" ?disabled=${this.loading}>
          ${this.loading ? 'Please wait…' : isSignup ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      ${!isSignup ? html`<p class="hint">Site Admin and Power User accounts are pre-configured.</p>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'account-view': AccountView;
  }
}
