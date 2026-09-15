import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { catalogStore } from '../state/catalog-store';
import { cartStore } from '../state/cart-store';
import { StoreController } from '../state/store-controller';
import { sharedStyles } from '../styles/shared-styles';
import '../components/category-chips';
import '../components/product-grid';

type Sort = 'popularity' | 'price-asc' | 'price-desc' | 'rating';

@customElement('shop-view')
export class ShopView extends LitElement {
  @property() categoryId = '';
  @property() query = '';

  @state() private sort: Sort = 'popularity';

  // retains StoreController subscriptions to re-render on store changes
  catalog = new StoreController(this, catalogStore);
  cart = new StoreController(this, cartStore);

  connectedCallback() {
    super.connectedCallback();
    catalogStore.load();
  }

  static styles = [
    sharedStyles,
    css`
      .head {
        margin-bottom: 4px;
      }
      .title {
        font: 800 19px var(--sans);
        margin: 0 0 2px;
      }
      .count {
        font-size: 12.5px;
        color: var(--text-faint);
        margin: 0 0 12px;
      }
      .chips-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      category-chips {
        flex: 1;
        min-width: 0;
      }
      .cart-btn {
        position: relative;
        flex: none;
        width: 36px;
        height: 36px;
        margin-bottom: 10px;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--bg-elevated);
        color: var(--text);
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .cart-btn .count {
        position: absolute;
        top: -3px;
        right: -3px;
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
      .toolbar {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 12px;
      }
      select {
        font: 600 12.5px var(--sans);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        background: var(--bg-elevated);
        color: var(--text-dim);
        padding: 7px 10px;
      }
    `,
  ];

  private setCategory(id: string) {
    location.hash = id ? `#/shop/${encodeURIComponent(id)}` : '#/shop';
  }

  private get filtered() {
    let list = catalogStore.products;
    if (this.categoryId) {
      list = list.filter((p) => p.category.toLowerCase() === this.categoryId.toLowerCase());
    }
    if (this.query.trim()) {
      const q = this.query.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q) ||
          p.colors.some((c) => c.name.toLowerCase().includes(q))
      );
    }
    const sorted = [...list];
    switch (this.sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      default:
        sorted.sort((a, b) => b.reviews - a.reviews);
    }
    return sorted;
  }

  render() {
    const results = this.filtered;
    const heading = this.query
      ? `Results for "${this.query}"`
      : this.categoryId
        ? catalogStore.categoryLabel(this.categoryId)
        : 'All Sarees';

    return html`
      <div class="head">
        <p class="title">${heading}</p>
        <p class="count">${results.length} saree${results.length === 1 ? '' : 's'}</p>
      </div>

      <div class="chips-row">
        <category-chips
          .active=${this.categoryId}
          .categories=${catalogStore.categories}
          @select=${(e: CustomEvent) => this.setCategory(e.detail)}
        ></category-chips>
        <button class="cart-btn" aria-label="Cart" @click=${() => (location.hash = '#/cart')}>
          ${cartStore.count ? html`<span class="count">${cartStore.count}</span>` : nothing}
          🛍️
        </button>
      </div>

      <div class="toolbar">
        <select
          .value=${this.sort}
          @change=${(e: Event) => (this.sort = (e.target as HTMLSelectElement).value as Sort)}
        >
          <option value="popularity">Popularity</option>
          <option value="rating">Top rated</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      ${catalogStore.loading
        ? html`<p class="count">Loading sarees…</p>`
        : results.length
          ? html`<product-grid .products=${results}></product-grid>`
          : html`
              <div class="empty">
                <span class="icon">🥻</span>
                <p>No sarees match your search.</p>
                <button class="ghost" @click=${() => this.setCategory('')}>Clear filters</button>
              </div>
            `}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'shop-view': ShopView;
  }
}
