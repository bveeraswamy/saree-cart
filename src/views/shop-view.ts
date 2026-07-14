import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { PRODUCTS } from '../data/products';
import { categoryLabel } from '../data/categories';
import { sharedStyles } from '../styles/shared-styles';
import '../components/category-chips';
import '../components/product-grid';

type Sort = 'popularity' | 'price-asc' | 'price-desc' | 'rating';

@customElement('shop-view')
export class ShopView extends LitElement {
  @property() categoryId = '';
  @property() query = '';

  @state() private sort: Sort = 'popularity';

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
    location.hash = id ? `#/shop/${id}` : '#/shop';
  }

  private get filtered() {
    let list = PRODUCTS;
    if (this.categoryId) {
      list = list.filter((p) => p.category === this.categoryId);
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
        ? categoryLabel(this.categoryId)
        : 'All Sarees';

    return html`
      <div class="head">
        <p class="title">${heading}</p>
        <p class="count">${results.length} saree${results.length === 1 ? '' : 's'}</p>
      </div>

      <category-chips
        .active=${this.categoryId}
        @select=${(e: CustomEvent) => this.setCategory(e.detail)}
      ></category-chips>

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

      ${results.length
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
