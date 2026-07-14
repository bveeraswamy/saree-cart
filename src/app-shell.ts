import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { PRODUCTS } from './data/products';

import './components/top-bar';
import './components/bottom-nav';
import './views/home-view';
import './views/shop-view';
import './views/product-detail-view';
import './views/cart-view';
import './views/wishlist-view';

type Route =
  | { name: 'home' }
  | { name: 'shop'; category: string }
  | { name: 'product'; id: string }
  | { name: 'cart' }
  | { name: 'wishlist' };

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '');
  const segs = path.split('/').filter(Boolean);
  if (segs.length === 0) return { name: 'home' };
  switch (segs[0]) {
    case 'shop':
      return { name: 'shop', category: segs[1] ?? '' };
    case 'product':
      return segs[1] ? { name: 'product', id: segs[1] } : { name: 'home' };
    case 'cart':
      return { name: 'cart' };
    case 'wishlist':
      return { name: 'wishlist' };
    default:
      return { name: 'home' };
  }
}

/**
 * Mobile-first shell: sticky header + scrollable content + bottom tab bar,
 * driven by a tiny hash router (no external router dependency needed for
 * this route set).
 */
@customElement('app-shell')
export class AppShell extends LitElement {
  @state() private route: Route = parseRoute(location.hash);
  @state() private searchQuery = '';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100svh;
      max-width: 560px;
      margin: 0 auto;
      background: var(--bg);
      position: relative;
    }
    main {
      flex: 1;
      padding: 14px 16px 24px;
      min-width: 0;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('hashchange', this.onHashChange);
  }

  disconnectedCallback() {
    window.removeEventListener('hashchange', this.onHashChange);
    super.disconnectedCallback();
  }

  private onHashChange = () => {
    const next = parseRoute(location.hash);
    if (next.name !== 'shop') this.searchQuery = '';
    this.route = next;
    this.renderRoot.querySelector('main')?.scrollTo({ top: 0 });
  };

  private get activeTab() {
    switch (this.route.name) {
      case 'home':
        return 'home';
      case 'shop':
      case 'product':
        return 'shop';
      case 'cart':
        return 'cart';
      case 'wishlist':
        return 'wishlist';
      default:
        return '';
    }
  }

  private topBarProps() {
    const route = this.route;
    switch (route.name) {
      case 'shop':
        return { showBack: false, showSearch: true, label: '' };
      case 'product':
        return {
          showBack: true,
          showSearch: false,
          label: PRODUCTS.find((p) => p.id === route.id)?.name ?? 'Product',
        };
      case 'cart':
        return { showBack: false, showSearch: false, label: 'My Bag' };
      case 'wishlist':
        return { showBack: false, showSearch: false, label: 'Wishlist' };
      default:
        return { showBack: false, showSearch: false, label: '' };
    }
  }

  render() {
    const tb = this.topBarProps();
    return html`
      <top-bar
        .showBack=${tb.showBack}
        .showSearch=${tb.showSearch}
        .label=${tb.label}
        .query=${this.searchQuery}
        @search=${(e: CustomEvent) => (this.searchQuery = e.detail)}
      ></top-bar>
      <main>${this.renderRoute()}</main>
      <bottom-nav .active=${this.activeTab}></bottom-nav>
    `;
  }

  private renderRoute() {
    switch (this.route.name) {
      case 'home':
        return html`<home-view></home-view>`;
      case 'shop':
        return html`<shop-view .categoryId=${this.route.category} .query=${this.searchQuery}></shop-view>`;
      case 'product':
        return html`<product-detail-view .productId=${this.route.id}></product-detail-view>`;
      case 'cart':
        return html`<cart-view></cart-view>`;
      case 'wishlist':
        return html`<wishlist-view></wishlist-view>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}
