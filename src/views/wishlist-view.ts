import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { PRODUCTS } from '../data/products';
import { wishlistStore } from '../state/wishlist-store';
import { StoreController } from '../state/store-controller';
import { sharedStyles } from '../styles/shared-styles';
import '../components/product-grid';

@customElement('wishlist-view')
export class WishlistView extends LitElement {
  // retains a StoreController subscription to re-render on store changes
  wishlist = new StoreController(this, wishlistStore);

  static styles = [sharedStyles, css``];

  render() {
    const items = PRODUCTS.filter((p) => wishlistStore.has(p.id));
    if (!items.length) {
      return html`
        <div class="empty">
          <span class="icon">♡</span>
          <p>Nothing saved yet. Tap the heart on a saree to add it here.</p>
          <button class="primary" @click=${() => (location.hash = '#/shop')}>Browse Sarees</button>
        </div>
      `;
    }
    return html`<product-grid .products=${items}></product-grid>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wishlist-view': WishlistView;
  }
}
