import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { catalogStore } from '../state/catalog-store';
import type { Product } from '../data/products';
import { sharedStyles } from '../styles/shared-styles';
import { wishlistStore } from '../state/wishlist-store';
import { StoreController } from '../state/store-controller';
import { patternForSeed } from '../components/saree-swatch';
import { hexToRgb, mixWithWhite } from '../utils/color';
import '../components/saree-swatch';
import '../components/rating-stars';
import '../components/product-grid';

@customElement('product-detail-view')
export class ProductDetailView extends LitElement {
  @property() productId = '';

  @state() private colorIndex = 0;
  @state() private photoIndex = 0;
  @state() private lightboxOpen = false;

  private touchActive = false;
  private touchStartX = 0;
  private touchStartY = 0;

  // retains a StoreController subscription to re-render on store changes
  wishlist = new StoreController(this, wishlistStore);
  // retains a StoreController subscription to re-render on store changes
  catalog = new StoreController(this, catalogStore);

  connectedCallback() {
    super.connectedCallback();
    catalogStore.load();
    document.addEventListener('keydown', this.onKeyDown);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this.onKeyDown);
    super.disconnectedCallback();
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.lightboxOpen) this.lightboxOpen = false;
  };

  static styles = [
    sharedStyles,
    css`
      .media {
        margin: 0 -16px 14px;
        padding: 0 16px;
      }
      saree-swatch,
      .photo-frame {
        width: 100%;
        max-width: 360px;
        margin: 0 auto;
        display: block;
      }
      .photo-frame,
      .lightbox-frame {
        position: relative;
        aspect-ratio: 3 / 4;
        border-radius: var(--radius);
        overflow: hidden;
        background: var(--bg-sunken);
        touch-action: pan-y;
      }
      .lightbox-frame {
        width: 100%;
        max-width: 440px;
      }
      .photo-frame saree-swatch,
      .lightbox-frame saree-swatch {
        width: 100%;
        height: 100%;
      }
      .photo-frame .product-image {
        cursor: zoom-in;
      }
      .product-image {
        display: block;
        position: absolute;
        top: 3%;
        left: 5%;
        width: 89%;
        height: 100%;
        object-fit: cover;
        border-radius: var(--radius-sm);
        background: var(--bg-sunken);
        opacity: 0;
        transition: opacity 350ms ease;
        pointer-events: none;
      }
      .product-image.active {
        opacity: 1;
        z-index: 1;
        pointer-events: auto;
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
        font: 700 11.5px var(--sans);
        letter-spacing: 0.04em;
        color: rgba(0, 0, 0, 0.72);
        text-shadow: 0 1px 0 rgba(255, 255, 255, 0.25);
      }
      saree-swatch.sold-out,
      .photo-frame.sold-out {
        filter: grayscale(0.7) brightness(0.7);
      }
      .carousel-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.45);
        color: #fff;
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2;
      }
      .carousel-arrow.prev {
        left: 8px;
      }
      .carousel-arrow.next {
        right: 8px;
      }
      .carousel-dots {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin-top: 10px;
      }
      .carousel-dots .dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        border: none;
        padding: 0;
        background: var(--border);
        cursor: pointer;
      }
      .carousel-dots .dot.active {
        background: var(--accent);
        width: 18px;
        border-radius: 4px;
      }
      .lightbox {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: #050303;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 24px;
        gap: 14px;
      }
      .lightbox .carousel-dots {
        margin-top: 0;
      }
      .lightbox-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 51;
      }
      .sold-out-badge {
        display: inline-block;
        font: 700 11px var(--sans);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        padding: 4px 9px;
        border-radius: 5px;
        background: rgba(0, 0, 0, 0.75);
        color: #fff;
        margin-bottom: 10px;
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
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .color-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid var(--border);
        display: inline-block;
      }
      .actions {
        margin: 18px 0 22px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .buy-now-btn {
        width: 100%;
        height: 48px;
        border-radius: var(--radius-sm);
        border: none;
        background: var(--accent);
        color: var(--accent-contrast);
        font: 700 14.5px var(--sans);
        cursor: pointer;
      }
      .buy-now-btn:disabled {
        background: var(--bg-sunken);
        color: var(--text-faint);
        cursor: not-allowed;
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
      this.photoIndex = 0;
      this.lightboxOpen = false;
    }
  }

  private prevPhoto(count: number) {
    this.photoIndex = (this.photoIndex - 1 + count) % count;
  }

  private nextPhoto(count: number) {
    this.photoIndex = (this.photoIndex + 1) % count;
  }

  private onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    this.touchStartX = t.clientX;
    this.touchStartY = t.clientY;
    this.touchActive = true;
  }

  private onTouchEnd(e: TouchEvent, count: number) {
    if (!this.touchActive) return;
    this.touchActive = false;
    if (count <= 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchStartX;
    const dy = t.clientY - this.touchStartY;
    const SWIPE_THRESHOLD = 40;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) this.nextPhoto(count);
      else this.prevPhoto(count);
    }
  }

  private renderPhotoStage(
    photos: string[],
    activeIndex: number,
    product: Product,
    pattern: string,
    sheenRgb: string,
    frameClass: 'photo-frame' | 'lightbox-frame'
  ) {
    const clickable = frameClass === 'photo-frame';
    return html`
      <div
        class="${frameClass} ${product.soldOut ? 'sold-out' : ''}"
        @click=${(e: Event) => e.stopPropagation()}
        @touchstart=${(e: TouchEvent) => this.onTouchStart(e)}
        @touchend=${(e: TouchEvent) => this.onTouchEnd(e, photos.length)}
      >
        <saree-swatch .hex=${product.containerColor} .pattern=${pattern} hidePallu></saree-swatch>
        ${photos.map(
          (src, i) => html`
            <img
              class="product-image ${i === activeIndex ? 'active' : ''}"
              src=${src}
              alt=${product.name}
              @click=${() => clickable && (this.lightboxOpen = true)}
            />
          `
        )}
        <div class="photo-shade" style="--sheen-rgb:${sheenRgb}"></div>
        <div class="photo-sheen" style="--sheen-rgb:${sheenRgb}"></div>
        ${photos.length > 1
          ? html`
              <button
                class="carousel-arrow prev"
                aria-label="Previous photo"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this.prevPhoto(photos.length);
                }}
              >
                ‹
              </button>
              <button
                class="carousel-arrow next"
                aria-label="Next photo"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this.nextPhoto(photos.length);
                }}
              >
                ›
              </button>
            `
          : nothing}
        <div class="pallu-bar">
          ${product.productCode ? html`<span class="pallu-label">${product.productCode}</span>` : nothing}
        </div>
      </div>
    `;
  }

  private renderPhotoDots(photos: string[], activeIndex: number) {
    if (photos.length <= 1) return nothing;
    return html`
      <div class="carousel-dots">
        ${photos.map(
          (_, i) => html`
            <button
              class="dot ${i === activeIndex ? 'active' : ''}"
              aria-label="Photo ${i + 1}"
              @click=${(e: Event) => {
                e.stopPropagation();
                this.photoIndex = i;
              }}
            ></button>
          `
        )}
      </div>
    `;
  }

  render() {
    const product = catalogStore.products.find((p) => p.id === this.productId);
    if (!product) {
      if (catalogStore.loading) {
        return html`<div class="missing"><p>Loading…</p></div>`;
      }
      return html`<div class="missing"><p>This saree is no longer available.</p></div>`;
    }
    const color = product.colors[this.colorIndex] ?? product.colors[0];
    const off = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : null;
    const wished = wishlistStore.has(product.id);
    const related = catalogStore.products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
    const pattern = patternForSeed(product.id);
    const sheenRgb = mixWithWhite(hexToRgb(product.containerColor), 0.65);
    const photos = product.image ? [product.image, ...product.gallery] : [];
    const activeIndex = Math.min(this.photoIndex, Math.max(photos.length - 1, 0));

    return html`
      <div class="media">
        ${photos.length
          ? html`
              ${this.renderPhotoStage(photos, activeIndex, product, pattern, sheenRgb, 'photo-frame')}
              ${this.renderPhotoDots(photos, activeIndex)}
            `
          : html`
              <saree-swatch
                class=${product.soldOut ? 'sold-out' : ''}
                .hex=${product.containerColor}
                .pattern=${pattern}
                .label=${product.productCode ?? ''}
              ></saree-swatch>
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
            `}
      </div>

      <p class="fabric">${product.fabric}</p>
      <h1>${product.name}</h1>
      ${product.soldOut ? html`<span class="sold-out-badge">Sold Out</span>` : nothing}
      ${product.rating || product.reviews
        ? html`<rating-stars .rating=${product.rating} .reviews=${product.reviews}></rating-stars>`
        : nothing}
      <div class="price-row">
        <span class="now">₹${product.price.toLocaleString('en-IN')}</span>
        ${product.mrp
          ? html`
              <span class="mrp">₹${product.mrp.toLocaleString('en-IN')}</span>
              <span class="off">${off}% off</span>
            `
          : nothing}
      </div>
      <p class="color-name"><span class="color-dot" style="background:${color.hex}"></span>Colour: ${color.name}</p>
      <p class="note">${product.blousePieceIncluded ? '✓ Unstitched blouse piece included' : 'Sold without blouse piece'}</p>

      <div class="actions">
        <button
          class="buy-now-btn"
          ?disabled=${product.soldOut}
          @click=${() => (location.hash = `#/checkout/${product.id}`)}
        >
          ${product.soldOut ? 'Sold Out' : 'Buy Now'}
        </button>
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

      ${this.lightboxOpen && photos.length
        ? html`
            <div class="lightbox" @click=${() => (this.lightboxOpen = false)}>
              <button
                class="lightbox-close"
                aria-label="Close"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this.lightboxOpen = false;
                }}
              >
                ✕
              </button>
              ${this.renderPhotoStage(photos, activeIndex, product, pattern, sheenRgb, 'lightbox-frame')}
              ${this.renderPhotoDots(photos, activeIndex)}
            </div>
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
