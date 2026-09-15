import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { catalogStore } from '../state/catalog-store';
import { cartStore } from '../state/cart-store';
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
      .line .sub {
        font-size: 11.5px;
        color: var(--text-faint);
        margin: 0 0 8px;
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
      .stepper {
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--border);
        border-radius: 20px;
        padding: 2px 4px;
      }
      .stepper button {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: none;
        background: var(--bg-sunken);
        color: var(--text);
        font: 700 14px var(--sans);
        cursor: pointer;
        line-height: 1;
      }
      .stepper span {
        font: 700 13px var(--sans);
        min-width: 16px;
        text-align: center;
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
    `,
  ];

  private updateQuantity(productId: string, delta: number) {
    cartStore.add(productId, delta);
  }

  render() {
    const lines = cartStore.lines
      .map((line) => ({ line, product: catalogStore.products.find((p) => p.id === line.productId) }))
      .filter((entry) => !!entry.product);

    if (!lines.length) {
      return html`
        <div class="empty">
          <span class="icon">🛒</span>
          <p>Your cart is empty. Add a few sarees to get started.</p>
          <button class="primary" @click=${() => (location.hash = '#/shop')}>Browse Sarees</button>
        </div>
      `;
    }

    const total = lines.reduce((sum, { line, product }) => sum + product!.price * line.quantity, 0);

    return html`
      <div>
        ${lines.map(
          ({ line, product }) => html`
            <div class="line">
              ${product!.image
                ? html`<img class="thumb" src=${product!.image} alt=${product!.name} />`
                : html`<saree-swatch .hex=${product!.containerColor} .pattern=${product!.category}></saree-swatch>`}
              <div class="info">
                <p class="name">${product!.name}</p>
                <p class="sub">${product!.productCode ? `${product!.productCode} · ` : ''}${product!.fabric}</p>
                <div class="line-bottom">
                  <span class="price">₹${(product!.price * line.quantity).toLocaleString('en-IN')}</span>
                  <div class="stepper">
                    <button
                      aria-label="Decrease quantity"
                      @click=${() => this.updateQuantity(line.productId, -1)}
                    >
                      −
                    </button>
                    <span>${line.quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      @click=${() => this.updateQuantity(line.productId, 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    class="remove"
                    aria-label="Remove ${product!.name}"
                    @click=${() => cartStore.remove(line.productId)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          `
        )}

        <div class="summary">
          <div class="row"><span>Items</span><span>${cartStore.count}</span></div>
          <div class="row total"><span>Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>
        </div>

        <a
          class="whatsapp-btn"
          href=${whatsappCartOrderLink(
            lines.map(({ line, product }) => ({
              name: product!.name,
              productCode: product!.productCode,
              price: product!.price,
              quantity: line.quantity,
            })),
            total
          )}
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
