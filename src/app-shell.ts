import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { catalogStore } from './state/catalog-store';
import { StoreController } from './state/store-controller';

import './components/top-bar';
import './components/bottom-nav';
import './views/home-view';
import './views/shop-view';
import './views/product-detail-view';
import './views/wishlist-view';
import './views/account-view';
import './views/user-detail-view';
import './views/product-edit-view';
import './views/product-add-view';
import './views/checkout-view';

type Route =
  | { name: 'home' }
  | { name: 'shop'; category: string }
  | { name: 'product'; id: string }
  | { name: 'wishlist' }
  | { name: 'account' }
  | { name: 'userDetail'; username: string }
  | { name: 'productEdit'; id: string }
  | { name: 'productAdd' }
  | { name: 'checkout'; id: string };

function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '');
  const segs = path
    .split('/')
    .filter(Boolean)
    .map((seg) => decodeURIComponent(seg));
  if (segs.length === 0) return { name: 'home' };
  switch (segs[0]) {
    case 'shop':
      return { name: 'shop', category: segs[1] ?? '' };
    case 'product':
      return segs[1] ? { name: 'product', id: segs[1] } : { name: 'home' };
    case 'checkout':
      return segs[1] ? { name: 'checkout', id: segs[1] } : { name: 'home' };
    case 'wishlist':
      return { name: 'wishlist' };
    case 'account':
      if (segs[1] === 'users' && segs[2]) return { name: 'userDetail', username: segs[2] };
      if (segs[1] === 'inventory' && segs[2] === 'new') return { name: 'productAdd' };
      if (segs[1] === 'inventory' && segs[2]) return { name: 'productEdit', id: segs[2] };
      return { name: 'account' };
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
  @state() private homeLogoVisible = true;

  // retains a StoreController subscription to re-render on store changes
  catalog = new StoreController(this, catalogStore);

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
      display: flex;
      flex-direction: column;
      padding: 14px 16px 24px;
      min-width: 0;
    }
    footer {
      margin-top: auto;
      text-align: center;
      padding: 18px 16px 4px;
      font-size: 11.5px;
      color: var(--text-faint);
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
    if (next.name === 'home') this.homeLogoVisible = true;
    this.route = next;
    window.scrollTo({ top: 0 });
  };

  private onLogoVisibleChange = (e: CustomEvent<{ visible: boolean }>) => {
    this.homeLogoVisible = e.detail.visible;
  };

  private get activeTab() {
    switch (this.route.name) {
      case 'home':
        return 'home';
      case 'shop':
      case 'product':
      case 'checkout':
        return 'shop';
      case 'wishlist':
        return 'wishlist';
      case 'account':
      case 'userDetail':
      case 'productEdit':
      case 'productAdd':
        return 'account';
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
          label: catalogStore.products.find((p) => p.id === route.id)?.name ?? 'Product',
        };
      case 'wishlist':
        return { showBack: false, showSearch: false, label: 'Wishlist' };
      case 'account':
        return { showBack: false, showSearch: false, label: 'Account' };
      case 'userDetail':
        return { showBack: true, showSearch: false, label: route.username };
      case 'productEdit':
        return {
          showBack: true,
          showSearch: false,
          label: catalogStore.products.find((p) => p.id === route.id)?.name ?? 'Product',
        };
      case 'productAdd':
        return { showBack: true, showSearch: false, label: 'Add Product' };
      case 'checkout':
        return { showBack: true, showSearch: false, label: 'Checkout' };
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
        .brandVisible=${!this.homeLogoVisible}
        @search=${(e: CustomEvent) => (this.searchQuery = e.detail)}
      ></top-bar>
      <main @logo-visible-change=${this.onLogoVisibleChange}>
        ${this.renderRoute()}
        <footer>Powered by BAGA Solutions</footer>
      </main>
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
      case 'wishlist':
        return html`<wishlist-view></wishlist-view>`;
      case 'account':
        return html`<account-view></account-view>`;
      case 'userDetail':
        return html`<user-detail-view .username=${this.route.username}></user-detail-view>`;
      case 'productEdit':
        return html`<product-edit-view .productId=${this.route.id}></product-edit-view>`;
      case 'productAdd':
        return html`<product-add-view></product-add-view>`;
      case 'checkout':
        return html`<checkout-view .productId=${this.route.id}></checkout-view>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}
