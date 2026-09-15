import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { cartStore } from '../state/cart-store';
import { StoreController } from '../state/store-controller';

@customElement('top-bar')
export class TopBar extends LitElement {
  @property() label = '';
  @property({ type: Boolean }) showBack = false;
  @property({ type: Boolean }) showSearch = false;
  @property() query = '';
  @property({ type: Boolean }) brandVisible = true;

  // retains a StoreController subscription to re-render on store changes
  cart = new StoreController(this, cartStore);

  static styles = css`
    :host {
      position: sticky;
      top: 0;
      z-index: 20;
      display: block;
    }
    .bar {
      height: var(--header-h);
      opacity: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 8px;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border);
      overflow: hidden;
      transition:
        height 0.45s ease,
        opacity 0.4s ease,
        border-color 0.4s ease;
    }
    .bar.collapsed {
      height: 0;
      opacity: 0;
      border-bottom-color: transparent;
    }
    .side {
      width: 36px;
      flex: none;
      display: flex;
    }
    .center {
      flex: 1;
      min-width: 0;
      display: flex;
      justify-content: center;
    }
    .icon-btn {
      width: 36px;
      height: 36px;
      flex: none;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
    }
    .icon-btn .count {
      position: absolute;
      top: 2px;
      right: 2px;
      background: var(--accent);
      color: var(--accent-contrast);
      font: 700 9px var(--sans);
      min-width: 14px;
      height: 14px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
    }
    .brand {
      font: 800 18px var(--sans);
      color: var(--accent);
      letter-spacing: -0.2px;
    }
    .label {
      font: 700 15.5px var(--sans);
      color: var(--text);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
    }
    .search {
      width: 100%;
      display: flex;
      align-items: center;
      background: var(--bg-sunken);
      border-radius: 20px;
      padding: 0 12px;
      height: 36px;
    }
    .search input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 13.5px;
      color: var(--text);
      flex: 1;
      min-width: 0;
    }
  `;

  private onInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent('search', { detail: value, bubbles: true, composed: true }));
  }

  render() {
    const isBrandSlot = !this.showSearch && !this.label;
    const collapsed = isBrandSlot && !this.brandVisible;
    return html`
      <div class="bar ${collapsed ? 'collapsed' : ''}">
        <div class="side">
          ${this.showBack
            ? html`<button class="icon-btn" @click=${() => history.back()} aria-label="Back">‹</button>`
            : nothing}
        </div>
        <div class="center">
          ${this.showSearch
            ? html`
                <div class="search">
                  <span>🔍</span>
                  <input
                    placeholder="Search sarees, fabric, colour…"
                    .value=${this.query}
                    @input=${this.onInput}
                  />
                </div>
              `
            : this.label
              ? html`<span class="label">${this.label}</span>`
              : html`<span class="brand">RAGA Boutique</span>`}
        </div>
        <div class="side">
          <button class="icon-btn" @click=${() => (location.hash = '#/cart')} aria-label="Cart">
            ${cartStore.count ? html`<span class="count">${cartStore.count}</span>` : nothing}
            🛍️
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-bar': TopBar;
  }
}
