import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { PRODUCTS } from '../data/products';
import { sharedStyles } from '../styles/shared-styles';
import { wishlistStore } from '../state/wishlist-store';
import { StoreController } from '../state/store-controller';
import '../components/saree-swatch';
import '../components/rating-stars';
import '../components/product-grid';

@customElement('product-detail-view')
export class ProductDetailView extends LitElement {
  @property() productId = '';

  @state() private colorIndex = 0;

  // retains a StoreController subscription to re-render on store changes
  wishlist = new StoreController(this, wishlistStore);

  static styles = [
    sharedStyles,
    css`
      .media {
        margin: 0 -16px 14px;
        padding: 0 16px;
      }
      saree-swatch {
        width: 100%;
        max-width: 360px;
        margin: 0 auto;
        display: block;
      }
      .swatches {
        display: flex;
        gap: 8px;
        justify-content: center;
        margin-top: 10px;
      }
      .swatch-dot {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        padding: 0;
      }
      .swatch-dot.active {
        border-color: var(--accent);
      }
      .fabric {
        font-size: 12px;
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        margin: 0 0 4px;
      }
      h1 {
        font-size: 19px;
        line-height: 1.3;
        margin: 0 0 6px;
      }
      rating-stars {
        margin-bottom: 10px;
        display: inline-flex;
      }
      .price-row {
        margin-bottom: 4px;
      }
      .note {
        font-size: 12.5px;
        color: var(--text-dim);
        margin: 4px 0 16px;
      }
      .color-name {
        font-size: 12.5px;
        color: var(--text-dim);
        margin: 0 0 16px;
      }
      .actions {
        margin: 18px 0 22px;
      }
      .wish-btn {
        width: 100%;
        height: 46px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border);
        background: var(--bg-elevated);
        color: var(--text);
        font: 700 14px var(--sans);
        cursor: pointer;
      }
      .wish-btn.active {
        color: var(--accent);
        border-color: var(--accent);
      }
      h3.block-title {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-faint);
        margin: 0 0 10px;
      }
      p.desc {
        font-size: 14px;
        line-height: 1.6;
        color: var(--text-dim);
        margin: 0 0 22px;
      }
      ul.care {
        margin: 0 0 24px;
        padding-left: 18px;
        font-size: 13.5px;
        color: var(--text-dim);
        line-height: 1.8;
      }
      .missing {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-faint);
      }
    `,
  ];

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('productId')) {
      this.colorIndex = 0;
    }
  }

  render() {
    const product = PRODUCTS.find((p) => p.id === this.productId);
    if (!product) {
      return html`<div class="missing"><p>This saree is no longer available.</p></div>`;
    }
    const color = product.colors[this.colorIndex] ?? product.colors[0];
    const off = Math.round(((product.mrp - product.price) / product.mrp) * 100);
    const wished = wishlistStore.has(product.id);
    const related = PRODUCTS.filter(
      (p) => p.category === product.category && p.id !== product.id
    ).slice(0, 4);

    return html`
      <div class="media">
        <saree-swatch .hex=${color.hex} .pattern=${product.category}></saree-swatch>
        ${product.colors.length > 1
          ? html`
              <div class="swatches">
                ${product.colors.map(
                  (c, i) => html`
                    <button
                      class="swatch-dot ${i === this.colorIndex ? 'active' : ''}"
                      style="background:${c.hex}"
                      aria-label=${c.name}
                      @click=${() => (this.colorIndex = i)}
                    ></button>
                  `
                )}
              </div>
            `
          : nothing}
      </div>

      <p class="fabric">${product.fabric}</p>
      <h1>${product.name}</h1>
      <rating-stars .rating=${product.rating} .reviews=${product.reviews}></rating-stars>
      <div class="price-row">
        <span class="now">₹${product.price.toLocaleString('en-IN')}</span>
        <span class="mrp">₹${product.mrp.toLocaleString('en-IN')}</span>
        <span class="off">${off}% off</span>
      </div>
      <p class="color-name">Colour: ${color.name}</p>
      <p class="note">${product.blousePieceIncluded ? '✓ Unstitched blouse piece included' : 'Sold without blouse piece'}</p>

      <div class="actions">
        <button
          class="wish-btn ${wished ? 'active' : ''}"
          aria-label="Toggle wishlist"
          @click=${() => wishlistStore.toggle(product.id)}
        >
          ${wished ? '♥' : '♡'} ${wished ? 'Saved to Wishlist' : 'Add to Wishlist'}
        </button>
      </div>

      <h3 class="block-title">Details</h3>
      <p class="desc">${product.description}</p>

      <h3 class="block-title">Care Instructions</h3>
      <ul class="care">
        ${product.care.map((c) => html`<li>${c}</li>`)}
      </ul>

      ${related.length
        ? html`
            <h3 class="block-title">You may also like</h3>
            <product-grid .products=${related}></product-grid>
          `
        : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'product-detail-view': ProductDetailView;
  }
}
