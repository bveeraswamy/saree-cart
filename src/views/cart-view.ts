import { LitElement, html, css, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { catalogStore } from '../state/catalog-store';
import { cartStore, cartKey } from '../state/cart-store';
import { StoreController } from '../state/store-controller';
import { sharedStyles } from '../styles/shared-styles';
import { whatsappCartOrderLink } from '../utils/whatsapp';
import '../components/saree-swatch';

@customElement('cart-view')
export class CartView extends LitElement {
  // retains StoreController subscriptions to re-render on store changes
  cart = new StoreController(this, cartStore);
  catalog = new StoreController(this, catalogStore);

  connectedCallback() {
    super.connectedCallback();
    catalogStore.load();
  }

  static styles = [
    sharedStyles,
    css`
      .line {
        display: flex;
        gap: 12px;
        padding: 14px 0;
        border-bottom: 1px solid var(--border);
        cursor: pointer;
      }
      .line.unavailable {
        cursor: default;
      }
      .thumb {
        width: 64px;
        height: 84px;
        object-fit: fill;
        border-radius: var(--radius-sm);
        flex: none;
        background: var(--bg-sunken);
      }
      saree-swatch {
        width: 64px;
        height: 84px;
        flex: none;
      }
      .unavailable-thumb {
        width: 64px;
        height: 84px;
        flex: none;
        border-radius: var(--radius-sm);
        background: var(--bg-sunken);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        opacity: 0.5;
      }
      .line .info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .line .name {
        font: 700 13.5px var(--sans);
        color: var(--text);
        margin: 0 0 2px;
      }
      .line.unavailable .name {
        color: var(--text-faint);
      }
      .line .sub {
        font-size: 11.5px;
        color: var(--text-faint);
        margin: 0 0 8px;
      }
      .status-tag {
        display: inline-block;
        font: 700 10px var(--sans);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        padding: 3px 7px;
        border-radius: 5px;
        margin: 0 0 6px;
        width: fit-content;
      }
      .status-tag.sold-out {
        background: var(--bg-sunken);
        color: var(--text-dim);
      }
      .status-tag.gone {
        background: var(--bg-sunken);
        color: var(--bad);
      }
      .line .price {
        font: 700 13px var(--sans);
      }
      .line-bottom {
        margin-top: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .remove {
        background: none;
        border: none;
        color: var(--bad);
        font-size: 17px;
        line-height: 1;
        cursor: pointer;
        padding: 4px;
        flex: none;
      }
      .summary {
        margin-top: 8px;
        border-top: 1px solid var(--border);
        padding-top: 12px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        font-size: 13.5px;
        color: var(--text-dim);
        padding: 6px 0;
      }
      .row.total {
        font-weight: 700;
        color: var(--text);
        font-size: 15px;
      }
      .unavailable-note {
        font-size: 11.5px;
        color: var(--text-faint);
        margin: 0 0 12px;
      }
      .whatsapp-btn {
        width: 100%;
        height: 48px;
        margin-top: 12px;
        border-radius: var(--radius-sm);
        border: none;
        background: #25d366;
        color: #04150a;
        font: 700 14px var(--sans);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        text-decoration: none;
      }
      .whatsapp-btn[aria-disabled='true'] {
        opacity: 0.5;
        pointer-events: none;
      }
    `,
  ];

  private goToProduct(id: string) {
    location.hash = `#/product/${id}`;
  }

  render() {
    // Every stored line renders — a product no longer resolving against
    // the public catalog (delisted or deleted, indistinguishable from out
    // here) gets an explicit "no longer available" row instead of quietly
    // vanishing, so the cart count and what's on screen always agree, and
    // the customer decides whether to remove it, not the app.
    const lines = cartStore.lines.map((line) => ({
      line,
      product: catalogStore.products.find((p) => cartKey(p) === line.productCode),
    }));

    if (!lines.length) {
      return html`
        <div class="empty">
          <span class="icon">🛒</span>
          <p>Your cart is empty. Add a few sarees to get started.</p>
          <button class="primary" @click=${() => (location.hash = '#/shop')}>Browse Sarees</button>
        </div>
      `;
    }

    // Only sarees that are both resolvable and in stock can actually be
    // ordered — sold-out or no-longer-available lines stay visible for
    // context but drop out of the total and the WhatsApp message.
    const purchasable = lines.filter(({ product }) => product && !product.soldOut);
    const total = purchasable.reduce((sum, { line, product }) => sum + product!.price * line.quantity, 0);
    const hasUnavailable = lines.length !== purchasable.length;

    return html`
      <div>
        ${lines.map(({ line, product }) => {
          if (!product) {
            return html`
              <div class="line unavailable">
                <div class="unavailable-thumb">🥻</div>
                <div class="info">
                  <span class="status-tag gone">No Longer Available</span>
                  <p class="name">This saree is no longer available.</p>
                  <div class="line-bottom">
                    <span></span>
                    <button
                      class="remove"
                      aria-label="Remove item"
                      @click=${() => cartStore.remove(line.productCode)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            `;
          }

          return html`
            <div class="line ${product.soldOut ? 'unavailable' : ''}" @click=${() => this.goToProduct(product.id)}>
              ${product.image
                ? html`<img class="thumb" src=${product.image} alt=${product.name} />`
                : html`<saree-swatch .hex=${product.containerColor} .pattern=${product.category}></saree-swatch>`}
              <div class="info">
                ${product.soldOut ? html`<span class="status-tag sold-out">Sold Out</span>` : nothing}
                <p class="name">${product.name}</p>
                <p class="sub">${product.productCode ? `${product.productCode} · ` : ''}${product.fabric}</p>
                <div class="line-bottom">
                  <span class="price">₹${(product.price * line.quantity).toLocaleString('en-IN')}</span>
                  <button
                    class="remove"
                    aria-label="Remove ${product.name}"
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      cartStore.remove(line.productCode);
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          `;
        })}

        <div class="summary">
          <div class="row"><span>Items</span><span>${cartStore.count}</span></div>
          <div class="row total"><span>Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>
        </div>
        ${hasUnavailable
          ? html`<p class="unavailable-note">Sold-out or no-longer-available items are excluded from the total.</p>`
          : nothing}

        <a
          class="whatsapp-btn"
          aria-disabled=${purchasable.length ? 'false' : 'true'}
          href=${purchasable.length
            ? whatsappCartOrderLink(
                purchasable.map(({ line, product }) => ({
                  name: product!.name,
                  productCode: product!.productCode,
                  price: product!.price,
                  quantity: line.quantity,
                })),
                total
              )
            : undefined}
          target="_blank"
          rel="noopener"
        >
          💬 Checkout via WhatsApp
        </a>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cart-view': CartView;
  }
}
