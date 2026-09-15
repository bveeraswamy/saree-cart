import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Product } from '../data/products';
import { wishlistStore } from '../state/wishlist-store';
import { cartStore, cartKey } from '../state/cart-store';
import { StoreController } from '../state/store-controller';
import { hexToRgb, mixWithWhite } from '../utils/color';
import { patternForSeed } from './saree-swatch';
import './saree-swatch';
import './rating-stars';

@customElement('product-card')
export class ProductCard extends LitElement {
  @property({ attribute: false }) product!: Product;

  // retains a StoreController subscription to re-render on store changes
  wishlist = new StoreController(this, wishlistStore);
  // retains a StoreController subscription to re-render on store changes
  cart = new StoreController(this, cartStore);

  static styles = css`
    :host {
      display: block;
      height: 100%;
      cursor: pointer;
    }
    .card {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .media {
      position: relative;
      width: 100%;
      aspect-ratio: 3 / 4;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--bg-sunken);
    }
    saree-swatch {
      display: block;
      width: 100%;
      height: 100%;
    }
    .product-image {
      display: block;
      position: absolute;
      top: 3%;
      left: 5%;
      width: 89%;
      height: 100%;
      object-fit: fill;
      border-radius: var(--radius-sm);
      background: var(--bg-sunken);
    }
    .photo-shade,
    .photo-sheen {
      position: absolute;
      top: 3%;
      left: 5%;
      width: 89%;
      height: 100%;
      border-radius: var(--radius-sm);
      pointer-events: none;
    }
    .photo-shade {
      background: linear-gradient(165deg, rgba(var(--sheen-rgb, 255, 255, 255), 0.22), rgba(0, 0, 0, 0.22) 85%);
    }
    .photo-sheen {
      background: linear-gradient(
        115deg,
        transparent 25%,
        rgba(var(--sheen-rgb, 255, 255, 255), 0.28) 45%,
        transparent 65%
      );
      mix-blend-mode: soft-light;
    }
    .pallu-bar {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 18%;
      border-radius: 0 0 var(--radius) var(--radius);
      background: linear-gradient(90deg, rgba(183, 134, 47, 0.9), rgba(212, 175, 90, 0.95));
      border-top: 2px solid rgba(255, 255, 255, 0.35);
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pallu-label {
      font: 700 10.5px var(--sans);
      letter-spacing: 0.04em;
      color: rgba(0, 0, 0, 0.72);
      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.25);
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
    .badge-tag.badge-new {
      background: var(--badge-new);
      color: var(--badge-new-contrast);
    }
    .badge-tag.badge-bestseller {
      background: var(--badge-bestseller);
      color: var(--badge-bestseller-contrast);
    }
    .badge-tag.badge-sale {
      background: var(--badge-sale);
      color: var(--badge-sale-contrast);
    }
    .badge-tag.badge-limited {
      background: var(--badge-limited);
      color: var(--badge-limited-contrast);
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
      flex: 1;
      display: flex;
      flex-direction: column;
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
    .actions {
      display: flex;
      gap: 6px;
      margin-top: auto;
    }
    .buy-now {
      flex: 1;
      font: 700 12.5px var(--sans);
      background: var(--accent);
      color: var(--accent-contrast);
      border: none;
      border-radius: var(--radius-sm);
      padding: 9px 0;
      cursor: pointer;
    }
    .buy-now:disabled {
      background: var(--bg-sunken);
      color: var(--text-faint);
      cursor: not-allowed;
    }
    .cart-add {
      flex: none;
      width: 36px;
      font-size: 15px;
      background: var(--bg-sunken);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      cursor: pointer;
    }
    .cart-add:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .cart-add.in-cart {
      background: var(--good);
      color: #0b2015;
      border-color: var(--good);
    }
  `;

  private toggleWishlist(e: Event) {
    e.stopPropagation();
    wishlistStore.toggle(this.product.id);
  }

  private go() {
    location.hash = `#/product/${this.product.id}`;
  }

  private buyNow(e: Event) {
    e.stopPropagation();
    location.hash = `#/checkout/${this.product.id}`;
  }

  private addToCart(e: Event) {
    e.stopPropagation();
    cartStore.add(cartKey(this.product));
  }

  render() {
    const p = this.product;
    const off = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : null;
    const active = wishlistStore.has(p.id);
    const inCart = cartStore.has(cartKey(p));
    const sheenRgb = mixWithWhite(hexToRgb(p.containerColor), 0.65);
    const pattern = patternForSeed(p.id);
    return html`
      <div class="card" @click=${this.go}>
        <div class="media" style="background:${p.containerColor}">
          ${p.soldOut
            ? ''
            : p.badge
              ? html`<span class="badge-tag badge-${p.badge.toLowerCase()}">${p.badge}</span>`
              : ''}
          <button
            class="wish ${active ? 'active' : ''}"
            aria-label="Toggle wishlist"
            @click=${this.toggleWishlist}
          >
            ${active ? '♥' : '♡'}
          </button>
          ${p.image
            ? html`
                <saree-swatch
                  .hex=${p.containerColor}
                  .pattern=${pattern}
                  hidePallu
                ></saree-swatch>
                <img class="product-image" src=${p.image} alt=${p.name} />
                <div class="photo-shade" style="--sheen-rgb:${sheenRgb}"></div>
                <div class="photo-sheen" style="--sheen-rgb:${sheenRgb}"></div>
                <div class="pallu-bar">
                  ${p.productCode ? html`<span class="pallu-label">${p.productCode}</span>` : nothing}
                </div>
              `
            : html`
                <saree-swatch
                  .hex=${p.containerColor}
                  .pattern=${pattern}
                  .label=${p.productCode ?? ''}
                ></saree-swatch>
              `}
          ${p.soldOut ? html`<div class="sold-out-overlay"><span>Sold Out</span></div>` : ''}
        </div>
        <div class="info ${p.soldOut ? 'sold-out' : ''}">
          <p class="fabric">${p.fabric}</p>
          <p class="name">${p.name}</p>
          ${p.rating || p.reviews
            ? html`<rating-stars .rating=${p.rating} .reviews=${p.reviews}></rating-stars>`
            : nothing}
          <div class="price-row">
            <span class="now">₹${p.price.toLocaleString('en-IN')}</span>
            ${p.mrp
              ? html`
                  <span class="mrp">₹${p.mrp.toLocaleString('en-IN')}</span>
                  <span class="off">${off}% off</span>
                `
              : nothing}
          </div>
          <div class="actions">
            <button
              class="cart-add ${inCart ? 'in-cart' : ''}"
              ?disabled=${p.soldOut}
              aria-label=${inCart ? 'Already in cart' : 'Add to cart'}
              @click=${this.addToCart}
            >
              ${inCart ? '✓' : '🛒'}
            </button>
            <button class="buy-now" ?disabled=${p.soldOut} @click=${this.buyNow}>
              ${p.soldOut ? 'Sold Out' : 'Buy Now'}
            </button>
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
