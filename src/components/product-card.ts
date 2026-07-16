import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Product } from '../data/products';
import { wishlistStore } from '../state/wishlist-store';
import { StoreController } from '../state/store-controller';
import './saree-swatch';
import './rating-stars';

@customElement('product-card')
export class ProductCard extends LitElement {
  @property({ attribute: false }) product!: Product;

  // retains a StoreController subscription to re-render on store changes
  wishlist = new StoreController(this, wishlistStore);

  static styles = css`
    :host {
      display: block;
      cursor: pointer;
    }
    .media {
      position: relative;
    }
    .wish {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.85);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      cursor: pointer;
      z-index: 1;
    }
    .wish.active {
      color: var(--accent);
    }
    .badge-tag {
      position: absolute;
      top: 8px;
      left: 8px;
      z-index: 1;
      font: 700 10px var(--sans);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 3px 7px;
      border-radius: 5px;
      background: var(--accent);
      color: var(--accent-contrast);
    }
    .sold-out-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
      border-radius: var(--radius);
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sold-out-overlay span {
      font: 800 12.5px var(--sans);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #fff;
      border: 1.5px solid rgba(255, 255, 255, 0.85);
      border-radius: 6px;
      padding: 6px 14px;
      opacity: 0.5;
    }
    .info.sold-out {
      opacity: 0.55;
    }
    .info {
      padding: 8px 2px 0;
    }
    .fabric {
      font-size: 11px;
      color: var(--text-faint);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin: 0 0 2px;
    }
    .name {
      font: 600 13.5px var(--sans);
      color: var(--text);
      margin: 0 0 4px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.3;
    }
    rating-stars {
      margin-bottom: 4px;
    }
    .price-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      flex-wrap: wrap;
    }
    .now {
      font: 700 14px var(--sans);
    }
    .mrp {
      font-size: 11.5px;
      color: var(--text-faint);
      text-decoration: line-through;
    }
    .off {
      font-size: 11px;
      font-weight: 700;
      color: var(--good);
    }
  `;

  private toggleWishlist(e: Event) {
    e.stopPropagation();
    wishlistStore.toggle(this.product.id);
  }

  private go() {
    location.hash = `#/product/${this.product.id}`;
  }

  render() {
    const p = this.product;
    const off = Math.round(((p.mrp - p.price) / p.mrp) * 100);
    const active = wishlistStore.has(p.id);
    return html`
      <div @click=${this.go}>
        <div class="media">
          ${p.soldOut ? '' : p.badge ? html`<span class="badge-tag">${p.badge}</span>` : ''}
          <button
            class="wish ${active ? 'active' : ''}"
            aria-label="Toggle wishlist"
            @click=${this.toggleWishlist}
          >
            ${active ? '♥' : '♡'}
          </button>
          <saree-swatch .hex=${p.colors[0].hex} .pattern=${p.category}></saree-swatch>
          ${p.soldOut ? html`<div class="sold-out-overlay"><span>Sold Out</span></div>` : ''}
        </div>
        <div class="info ${p.soldOut ? 'sold-out' : ''}">
          <p class="fabric">${p.fabric}</p>
          <p class="name">${p.name}</p>
          <rating-stars .rating=${p.rating} .reviews=${p.reviews}></rating-stars>
          <div class="price-row">
            <span class="now">₹${p.price.toLocaleString('en-IN')}</span>
            <span class="mrp">₹${p.mrp.toLocaleString('en-IN')}</span>
            <span class="off">${off}% off</span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'product-card': ProductCard;
  }
}
