import { LitElement, html, css, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { PRODUCTS } from '../data/products';
import { cartStore } from '../state/cart-store';
import { StoreController } from '../state/store-controller';
import { sharedStyles } from '../styles/shared-styles';
import '../components/saree-swatch';
import '../components/qty-stepper';

@customElement('cart-view')
export class CartView extends LitElement {
  // retains a StoreController subscription to re-render on store changes
  cart = new StoreController(this, cartStore);

  static styles = [
    sharedStyles,
    css`
      :host {
        padding-bottom: 90px;
        display: block;
      }
      .line {
        display: flex;
        gap: 12px;
        padding: 14px 0;
        border-bottom: 1px solid var(--border);
      }
      saree-swatch {
        width: 76px;
        height: 96px;
        flex: none;
      }
      .details {
        flex: 1;
        min-width: 0;
      }
      .name {
        font: 600 13.5px var(--sans);
        margin: 0 0 3px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .color {
        font-size: 12px;
        color: var(--text-faint);
        margin: 0 0 8px;
      }
      .row-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .remove {
        background: none;
        border: none;
        color: var(--text-faint);
        font-size: 12px;
        text-decoration: underline;
        cursor: pointer;
        padding: 0;
      }
      .now {
        font: 700 14px var(--sans);
      }
      .summary {
        margin-top: 20px;
        border-top: 1px dashed var(--border);
        padding-top: 14px;
      }
      .summary .row {
        display: flex;
        justify-content: space-between;
        font-size: 13.5px;
        color: var(--text-dim);
        margin-bottom: 8px;
      }
      .summary .row.total {
        font-weight: 800;
        color: var(--text);
        font-size: 15px;
        border-top: 1px solid var(--border);
        padding-top: 10px;
        margin-top: 4px;
      }
      .checkout-bar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: calc(var(--nav-h) + var(--safe-b));
        background: var(--bg-elevated);
        border-top: 1px solid var(--border);
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        z-index: 15;
      }
      .checkout-bar .total {
        font: 800 15px var(--sans);
      }
      .checkout-bar .sub {
        font-size: 11.5px;
        color: var(--text-faint);
      }
      .checkout-bar button {
        min-width: 140px;
      }
    `,
  ];

  render() {
    const lines = cartStore.lines;
    if (!lines.length) {
      return html`
        <div class="empty">
          <span class="icon">🛍️</span>
          <p>Your bag is empty.</p>
          <button class="primary" @click=${() => (location.hash = '#/shop')}>Start Shopping</button>
        </div>
      `;
    }

    const savings = cartStore.mrpTotal - cartStore.subtotal;

    return html`
      <div>
        ${lines.map((line) => {
          const product = PRODUCTS.find((p) => p.id === line.productId);
          if (!product) return nothing;
          const color = product.colors.find((c) => c.name === line.colorName) ?? product.colors[0];
          return html`
            <div class="line">
              <saree-swatch .hex=${color.hex} .pattern=${product.category} ?square=${true}></saree-swatch>
              <div class="details">
                <p class="name">${product.name}</p>
                <p class="color">Colour: ${line.colorName}</p>
                <div class="row-bottom">
                  <qty-stepper
                    .qty=${line.qty}
                    max="10"
                    @change=${(e: CustomEvent) =>
                      cartStore.setQty(line.productId, line.colorName, e.detail)}
                  ></qty-stepper>
                  <span class="now">₹${(product.price * line.qty).toLocaleString('en-IN')}</span>
                </div>
                <button
                  class="remove"
                  @click=${() => cartStore.remove(line.productId, line.colorName)}
                >
                  Remove
                </button>
              </div>
            </div>
          `;
        })}

        <div class="summary">
          <div class="row"><span>Subtotal</span><span>₹${cartStore.subtotal.toLocaleString('en-IN')}</span></div>
          <div class="row"><span>You save</span><span>−₹${savings.toLocaleString('en-IN')}</span></div>
          <div class="row"><span>Delivery</span><span>Free</span></div>
          <div class="row total"><span>Total</span><span>₹${cartStore.subtotal.toLocaleString('en-IN')}</span></div>
        </div>
      </div>

      <div class="checkout-bar">
        <div>
          <div class="total">₹${cartStore.subtotal.toLocaleString('en-IN')}</div>
          <div class="sub">${cartStore.count} item${cartStore.count === 1 ? '' : 's'}</div>
        </div>
        <button class="primary" @click=${() => (location.hash = '#/checkout')}>
          Proceed to Checkout
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cart-view': CartView;
  }
}
