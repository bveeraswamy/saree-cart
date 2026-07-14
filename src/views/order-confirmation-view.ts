import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getOrder } from '../state/order-store';
import { sharedStyles } from '../styles/shared-styles';

@customElement('order-confirmation-view')
export class OrderConfirmationView extends LitElement {
  @property() orderId = '';

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        text-align: center;
        padding: 40px 10px;
      }
      .check {
        width: 66px;
        height: 66px;
        border-radius: 50%;
        background: var(--good);
        color: #fff;
        font-size: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 18px;
      }
      h1 {
        font-size: 19px;
        margin: 0 0 6px;
      }
      p.sub {
        font-size: 13.5px;
        color: var(--text-dim);
        margin: 0 0 24px;
      }
      .card {
        text-align: left;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        margin-bottom: 24px;
        background: var(--bg-elevated);
      }
      .card .row {
        display: flex;
        justify-content: space-between;
        font-size: 13.5px;
        color: var(--text-dim);
        margin-bottom: 8px;
      }
      .card .row:last-child {
        margin-bottom: 0;
      }
      .card .row strong {
        color: var(--text);
      }
      button.primary {
        width: 100%;
      }
    `,
  ];

  render() {
    const order = getOrder(this.orderId);
    return html`
      <div class="check">✓</div>
      <h1>Order Placed!</h1>
      <p class="sub">
        ${order?.email
          ? html`A confirmation has been sent to <strong>${order.email}</strong>.`
          : 'A confirmation has been sent to your registered number.'}
      </p>
      ${order
        ? html`
            <div class="card">
              <div class="row"><span>Order ID</span><strong>${order.id}</strong></div>
              <div class="row"><span>Items</span><strong>${order.itemCount}</strong></div>
              <div class="row"><span>Amount Paid</span><strong>₹${order.total.toLocaleString('en-IN')}</strong></div>
              <div class="row"><span>Estimated Delivery</span><strong>${order.eta}</strong></div>
            </div>
          `
        : ''}
      <button class="primary" @click=${() => (location.hash = '#/shop')}>Continue Shopping</button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'order-confirmation-view': OrderConfirmationView;
  }
}
