import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authStore, type AuthUser } from '../state/auth-store';
import { StoreController } from '../state/store-controller';
import {
  login,
  register,
  logout,
  listUsers,
  deleteUser,
  syncProdData,
  exportCatalogJson,
  AuthApiError,
  type AccountSummary,
} from '../api/auth-api';
import { listProducts, deleteProduct, type InventoryProduct } from '../api/catalog-api';
import { catalogStore } from '../state/catalog-store';
import { sharedStyles } from '../styles/shared-styles';

type Mode = 'signin' | 'signup';
type AdminTab = 'profile' | 'users' | 'inventory';

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

  @state() private products: InventoryProduct[] = [];
  @state() private productsLoading = false;
  @state() private productsError = '';
  @state() private productsLoaded = false;
  @state() private productCodeFilter = '';

  @state() private syncing = false;
  @state() private syncMessage = '';

  @state() private exporting = false;
  @state() private exportMessage = '';

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
      button.sync-btn {
        margin-top: 10px;
      }
      .sync-note {
        font-size: 11.5px;
        color: var(--text-faint);
        text-align: center;
        margin: 8px 0 0;
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
      .product-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 0;
        border-bottom: 1px solid var(--border);
        cursor: pointer;
      }
      .product-row:last-child {
        border-bottom: none;
      }
      .product-row .meta {
        flex: 1;
        min-width: 0;
      }
      .product-row .name {
        font: 700 13.5px var(--sans);
        color: var(--text);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .product-row .sub {
        font-size: 11.5px;
        color: var(--text-faint);
      }
      .product-row .price {
        font: 700 13px var(--sans);
        color: var(--text);
        flex: none;
      }
      button.remove {
        flex: none;
        background: none;
        border: none;
        color: var(--bad);
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
        padding: 4px;
      }
      .empty-note {
        font-size: 12.5px;
        color: var(--text-faint);
        text-align: center;
        padding: 10px 0 18px;
      }
      .product-list-scroll {
        max-height: 55vh;
        overflow-y: auto;
      }
      .inventory-actions {
        display: flex;
        gap: 8px;
        margin-top: 12px;
      }
      .inventory-actions button {
        flex: 1;
        height: 48px;
        border-radius: var(--radius-sm);
        font: 700 14px var(--sans);
        cursor: pointer;
      }
      .fab-add {
        border: none;
        background: var(--accent);
        color: var(--accent-contrast);
      }
      .fab-bulk {
        border: 1.5px solid var(--accent);
        background: var(--bg-elevated);
        color: var(--accent);
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

  private async openInventoryTab() {
    this.adminTab = 'inventory';
    if (this.productsLoaded || this.productsLoading) return;
    await this.refreshProducts();
  }

  private async refreshProducts() {
    const user = authStore.user;
    if (!user) return;
    this.productsLoading = true;
    this.productsError = '';
    try {
      this.products = await listProducts(user.token);
      this.productsLoaded = true;
    } catch (err) {
      this.productsError = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    } finally {
      this.productsLoading = false;
    }
  }

  private async onDeleteProduct(id: number) {
    const user = authStore.user;
    if (!user) return;
    const previous = this.products;
    this.products = this.products.filter((p) => p.id !== id);
    try {
      await deleteProduct(user.token, id);
      catalogStore.refresh();
    } catch (err) {
      this.products = previous;
      this.productsError = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    }
  }

  private async onDeleteUser(username: string) {
    const admin = authStore.user;
    if (!admin || admin.username === username) return;
    if (!confirm(`Remove ${username}? This cannot be undone.`)) return;

    const previous = this.users;
    this.users = this.users.filter((u) => u.username !== username);
    try {
      await deleteUser(admin.token, username);
    } catch (err) {
      this.users = previous;
      this.usersError = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    }
  }

  private isLocalDev() {
    return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  }

  private async onSyncProdData() {
    const admin = authStore.user;
    if (!admin || this.syncing) return;
    const ok = confirm(
      'This overwrites your local database and product images with a copy of production (your ' +
        'local data is backed up first). Continue?'
    );
    if (!ok) return;
    this.syncing = true;
    this.syncMessage = '';
    try {
      const result = await syncProdData(admin.token);
      this.syncMessage = result.ok
        ? 'Synced. Restart your local server to pick up the new data.'
        : result.output || 'Sync failed.';
    } catch (err) {
      this.syncMessage = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    } finally {
      this.syncing = false;
    }
  }

  private async onExportCatalogJson() {
    const admin = authStore.user;
    if (!admin || this.exporting) return;
    this.exporting = true;
    this.exportMessage = '';
    try {
      const result = await exportCatalogJson(admin.token);
      this.exportMessage = `Exported ${result.count} products. Commit and push saree-ecart/public/catalog-fallback.json to publish the fallback.`;
    } catch (err) {
      this.exportMessage = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    } finally {
      this.exporting = false;
    }
  }

  private renderProfileCard(user: AuthUser) {
    const isAdmin = user.role === 'Site Admin';
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
        ${isAdmin && this.isLocalDev()
          ? html`
              <button class="ghost sync-btn" ?disabled=${this.syncing} @click=${this.onSyncProdData}>
                ${this.syncing ? 'Syncing…' : 'Sync Local with Prod'}
              </button>
              ${this.syncMessage ? html`<p class="sync-note">${this.syncMessage}</p>` : nothing}
              <button class="ghost sync-btn" ?disabled=${this.exporting} @click=${this.onExportCatalogJson}>
                ${this.exporting ? 'Exporting…' : 'Export Catalog JSON (Fallback)'}
              </button>
              ${this.exportMessage ? html`<p class="sync-note">${this.exportMessage}</p>` : nothing}
            `
          : nothing}
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
    const self = authStore.user?.username;
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
              ${u.username !== self
                ? html`
                    <button
                      class="remove"
                      aria-label="Remove ${u.username}"
                      @click=${(e: Event) => {
                        e.stopPropagation();
                        this.onDeleteUser(u.username);
                      }}
                    >
                      ✕
                    </button>
                  `
                : nothing}
            </div>
          `
        )}
      </div>
    `;
  }

  private get filteredProducts() {
    const q = this.productCodeFilter.trim().toLowerCase();
    if (!q) return this.products;
    return this.products.filter((p) => (p.productCode ?? '').toLowerCase().includes(q));
  }

  private renderInventoryTab() {
    const filtered = this.filteredProducts;
    return html`
      <div class="card">
        <div class="field">
          <input
            .value=${this.productCodeFilter}
            @input=${(e: Event) => (this.productCodeFilter = (e.target as HTMLInputElement).value)}
            placeholder="Filter by product code"
          />
        </div>
        <div class="product-list-scroll">
          ${this.productsLoading
            ? html`<p>Loading products…</p>`
            : filtered.length
              ? filtered.map(
                  (p) => html`
                    <div
                      class="product-row"
                      @click=${() =>
                        (location.hash = `#/account/inventory/${encodeURIComponent(p.productCode || String(p.id))}`)}
                    >
                      <div class="meta">
                        <div class="name">${p.name}</div>
                        <div class="sub">${p.productCode ? `${p.productCode} · ` : ''}${p.category} · ${p.fabric}</div>
                      </div>
                      <span class="price">₹${Number(p.price).toLocaleString('en-IN')}</span>
                      <button
                        class="remove"
                        aria-label="Remove ${p.name}"
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          this.onDeleteProduct(p.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  `
                )
              : html`
                  <p class="empty-note">
                    ${this.products.length ? 'No products match that code.' : 'No products in inventory yet.'}
                  </p>
                `}
          ${this.productsError ? html`<p class="error">${this.productsError}</p>` : nothing}
        </div>
      </div>
      <div class="inventory-actions">
        <button class="fab-add" @click=${() => (location.hash = '#/account/inventory/new')}>+ Add Product</button>
        <button class="fab-bulk" @click=${() => (location.hash = '#/account/inventory/bulk')}>Bulk Add</button>
      </div>
    `;
  }

  render() {
    const user = authStore.user;

    if (user) {
      const isAdmin = user.role === 'Site Admin';
      const isPowerUser = user.role === 'Power User';
      const showTabs = isAdmin || isPowerUser;

      const showInventory = showTabs && this.adminTab === 'inventory';
      let content = this.renderProfileCard(user);
      if (showInventory) {
        content = this.renderInventoryTab();
      } else if (isAdmin && this.adminTab === 'users') {
        content = this.renderUsersTab();
      }

      return html`
        ${showTabs
          ? html`
              <div class="tabs">
                <button
                  class=${this.adminTab === 'profile' ? 'active' : ''}
                  @click=${() => (this.adminTab = 'profile')}
                >
                  Profile
                </button>
                ${isAdmin
                  ? html`
                      <button
                        class=${this.adminTab === 'users' ? 'active' : ''}
                        @click=${() => this.openUsersTab()}
                      >
                        Users
                      </button>
                    `
                  : nothing}
                <button
                  class=${this.adminTab === 'inventory' ? 'active' : ''}
                  @click=${() => this.openInventoryTab()}
                >
                  Inventory
                </button>
              </div>
            `
          : nothing}
        ${content}
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
