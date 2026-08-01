import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { catalogStore } from '../state/catalog-store';
import { StoreController } from '../state/store-controller';
import { sharedStyles } from '../styles/shared-styles';
import { whatsappOrderLink, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_TEL } from '../utils/whatsapp';
import '../components/saree-swatch';

@customElement('checkout-view')
export class CheckoutView extends LitElement {
  @property() productId = '';

  // retains a StoreController subscription to re-render on store changes
  catalog = new StoreController(this, catalogStore);

  connectedCallback() {
    super.connectedCallback();
    catalogStore.load();
  }

  static styles = [
    sharedStyles,
    css`
      .card {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 18px;
        background: var(--bg-elevated);
      }
      h1 {
        font-size: 18px;
        margin: 0 0 16px;
      }
      .summary {
        display: flex;
        gap: 12px;
        margin-bottom: 18px;
      }
      .thumb {
        width: 68px;
        height: 90px;
        object-fit: cover;
        border-radius: var(--radius-sm);
        flex: none;
        background: var(--bg-sunken);
      }
      saree-swatch {
        width: 68px;
        height: 90px;
        flex: none;
      }
      .summary .info {
        min-width: 0;
      }
      .summary .name {
        font: 700 14px var(--sans);
        color: var(--text);
        margin: 0 0 3px;
      }
      .summary .sub {
        font-size: 12px;
        color: var(--text-faint);
        margin: 0 0 6px;
      }
      .summary .price {
        font: 700 14px var(--sans);
      }
      .row {
        display: flex;
        justify-content: space-between;
        font-size: 13.5px;
        color: var(--text-dim);
        padding: 10px 0;
        border-top: 1px solid var(--border);
      }
      .row.total {
        font-weight: 700;
        color: var(--text);
        font-size: 15px;
      }
      .whatsapp-btn {
        width: 100%;
        height: 46px;
        margin-top: 18px;
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
      .contact-note {
        text-align: center;
        font-size: 12.5px;
        color: var(--text-dim);
        margin: 12px 0 0;
      }
      .contact-note a {
        color: var(--accent);
        font-weight: 700;
        text-decoration: none;
      }
      .missing {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-faint);
      }
    `,
  ];

  render() {
    const product = catalogStore.products.find((p) => p.id === this.productId);
    if (!product) {
      if (catalogStore.loading) {
        return html`<div class="missing"><p>Loading…</p></div>`;
      }
      return html`<div class="missing"><p>This saree is no longer available.</p></div>`;
    }

    return html`
      <div class="card">
        <h1>Checkout</h1>
        <div class="summary">
          ${product.image
            ? html`<img class="thumb" src=${product.image} alt=${product.name} />`
            : html`<saree-swatch .hex=${product.containerColor} .pattern=${product.category}></saree-swatch>`}
          <div class="info">
            <p class="name">${product.name}</p>
            <p class="sub">${product.productCode ? `${product.productCode} · ` : ''}${product.fabric}</p>
            <p class="price">₹${product.price.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div class="row"><span>Item total</span><span>₹${product.price.toLocaleString('en-IN')}</span></div>
        ${product.deliveryAvailable
          ? html`<div class="row"><span>Delivery</span><span>Free</span></div>`
          : nothing}
        <div class="row total">
          <span>Total</span><span>₹${product.price.toLocaleString('en-IN')}</span>
        </div>
        <a
          class="whatsapp-btn"
          href=${whatsappOrderLink(product.name, product.productCode, product.price)}
          target="_blank"
          rel="noopener"
        >
          💬 Order on WhatsApp
        </a>
        <p class="contact-note">
          On desktop? Reach us at <a href=${CONTACT_PHONE_TEL}>${CONTACT_PHONE_DISPLAY}</a>
        </p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'checkout-view': CheckoutView;
  }
}
