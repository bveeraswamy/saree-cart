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

  // retains a StoreController subscription to re-render on store changes
  cart = new StoreController(this, cartStore);

  static styles = css`
    :host {
      position: sticky;
      top: 0;
      z-index: 20;
      display: block;
      background: var(--bg-elevated);
      border-bottom: 1px solid var(--border);
    }
    .bar {
      height: var(--header-h);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 8px;
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
    .cart-btn {
      position: relative;
    }
    .count {
      position: absolute;
      top: 2px;
      right: 2px;
      background: var(--accent);
      color: var(--accent-contrast);
      font: 700 9.5px var(--sans);
      min-width: 15px;
      height: 15px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
    }
  `;

  private onInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent('search', { detail: value, bubbles: true, composed: true }));
  }

  private goCart() {
    location.hash = '#/cart';
  }

  render() {
    return html`
      <div class="bar">
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
        <button class="icon-btn cart-btn" aria-label="Cart" @click=${this.goCart}>
          🛍️
          ${cartStore.count ? html`<span class="count">${cartStore.count}</span>` : ''}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-bar': TopBar;
  }
}
