import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { authStore } from '../state/auth-store';
import { getUser, updateUserRole, AuthApiError, type AccountSummary } from '../api/auth-api';
import { sharedStyles } from '../styles/shared-styles';

@customElement('user-detail-view')
export class UserDetailView extends LitElement {
  @property() username = '';

  @state() private account: AccountSummary | null = null;
  @state() private loading = true;
  @state() private error = '';
  @state() private saving = false;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .card {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 18px;
        background: var(--bg-elevated);
      }
      .who {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }
      .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--accent);
        color: var(--accent-contrast);
        display: flex;
        align-items: center;
        justify-content: center;
        font: 700 18px var(--sans);
        flex: none;
      }
      .who .name {
        font: 700 16px var(--sans);
        color: var(--text);
      }
      .who .email {
        font-size: 12.5px;
        color: var(--text-faint);
        margin-top: 2px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: var(--text-dim);
        padding: 10px 0;
        border-top: 1px solid var(--border);
      }
      .row:first-of-type {
        border-top: none;
      }
      .checkbox-field {
        display: flex;
        align-items: center;
        gap: 9px;
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid var(--border);
      }
      .checkbox-field input[type='checkbox'] {
        width: 18px;
        height: 18px;
        flex: none;
        padding: 0;
        border: none;
        background: none;
        border-radius: 0;
        accent-color: var(--accent);
        cursor: pointer;
      }
      .checkbox-field input[type='checkbox']:disabled {
        cursor: not-allowed;
      }
      .checkbox-field label {
        color: var(--text);
        font-size: 13.5px;
        font-weight: 600;
        cursor: pointer;
      }
      .checkbox-hint {
        font-size: 11.5px;
        color: var(--text-faint);
        margin: 6px 0 0;
      }
      .missing {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-faint);
      }
    `,
  ];

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('username') && this.username) {
      this.load();
    }
  }

  private async load() {
    const admin = authStore.user;
    if (!admin) return;
    this.loading = true;
    this.error = '';
    try {
      this.account = await getUser(admin.token, this.username);
    } catch (err) {
      this.error = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    } finally {
      this.loading = false;
    }
  }

  private async onToggle(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    const admin = authStore.user;
    if (!admin || !this.account || this.saving) return;
    this.saving = true;
    this.error = '';
    try {
      this.account = await updateUserRole(admin.token, this.account.username, checked);
    } catch (err) {
      this.error = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    } finally {
      this.saving = false;
    }
  }

  render() {
    const admin = authStore.user;
    if (!admin || admin.role !== 'Site Admin') {
      return html`<div class="missing"><p>You don't have access to this page.</p></div>`;
    }

    if (this.loading) {
      return html`<div class="card"><p>Loading…</p></div>`;
    }

    if (!this.account) {
      return html`<div class="card"><p class="error">${this.error || 'User not found.'}</p></div>`;
    }

    const a = this.account;
    const isSiteAdmin = a.role === 'Site Admin';
    const joined = new Date(a.dateJoined).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return html`
      <div class="card">
        <div class="who">
          <span class="avatar">${a.username.charAt(0).toUpperCase()}</span>
          <div>
            <div class="name">${a.username}</div>
            <div class="email">${a.email || 'No email'}</div>
          </div>
        </div>

        <div class="row"><span>Role</span><span class="badge">${a.role}</span></div>
        <div class="row"><span>Joined</span><span>${joined}</span></div>

        <div class="checkbox-field">
          <input
            type="checkbox"
            id="power-toggle"
            .checked=${a.role === 'Power User'}
            ?disabled=${isSiteAdmin || this.saving}
            @change=${this.onToggle}
          />
          <label for="power-toggle">Power User</label>
        </div>
        ${isSiteAdmin
          ? html`<p class="checkbox-hint">Site Admins already have full access.</p>`
          : nothing}
        ${this.error ? html`<p class="checkbox-hint" style="color:var(--bad)">${this.error}</p>` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'user-detail-view': UserDetailView;
  }
}
