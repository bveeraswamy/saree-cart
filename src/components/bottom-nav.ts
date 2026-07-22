import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { wishlistStore } from '../state/wishlist-store';
import { StoreController } from '../state/store-controller';

interface Tab {
  id: string;
  path: string;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'home', path: '#/', label: 'Home', icon: '🏠' },
  { id: 'shop', path: '#/shop', label: 'Shop', icon: '🧵' },
  { id: 'wishlist', path: '#/wishlist', label: 'Wishlist', icon: '♡' },
  { id: 'account', path: '#/account', label: 'Account', icon: '👤' },
];

@customElement('bottom-nav')
export class BottomNav extends LitElement {
  @property() active = 'home';

  // retains a StoreController subscription to re-render on store changes
  wishlist = new StoreController(this, wishlistStore);

  static styles = css`
    :host {
      position: sticky;
      bottom: 0;
      z-index: 20;
      display: block;
      background: var(--bg-elevated);
      border-top: 1px solid var(--border);
      padding-bottom: var(--safe-b);
    }
    .row {
      height: var(--nav-h);
      display: flex;
    }
    button {
      flex: 1;
      border: none;
      background: transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      color: var(--text-faint);
      font: 600 10.5px var(--sans);
      cursor: pointer;
      position: relative;
    }
    button .ic {
      font-size: 18px;
    }
    button.active {
      color: var(--accent);
    }
    .count {
      position: absolute;
      top: 2px;
      right: calc(50% - 20px);
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
  `;

  private go(path: string) {
    location.hash = path;
  }

  render() {
    return html`
      <div class="row">
        ${TABS.map((t) => {
          const badge = t.id === 'wishlist' ? wishlistStore.count : 0;
          return html`
            <button class=${this.active === t.id ? 'active' : ''} @click=${() => this.go(t.path)}>
              ${badge ? html`<span class="count">${badge}</span>` : ''}
              <span class="ic">${t.icon}</span>
              <span>${t.label}</span>
            </button>
          `;
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bottom-nav': BottomNav;
  }
}
