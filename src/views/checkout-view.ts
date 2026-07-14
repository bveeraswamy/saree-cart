import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cartStore } from '../state/cart-store';
import { setLastOrder } from '../state/order-store';
import { getGuestEmail } from '../state/checkout-session';
import { sharedStyles } from '../styles/shared-styles';

type PaymentMethod = 'cod' | 'upi' | 'card';

interface AddressForm {
  fullName: string;
  phone: string;
  pincode: string;
  addressLine: string;
  city: string;
  state: string;
}

interface PaymentDetails {
  upiId: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}

const EMPTY_FORM: AddressForm = {
  fullName: '',
  phone: '',
  pincode: '',
  addressLine: '',
  city: '',
  state: '',
};

const EMPTY_PAYMENT: PaymentDetails = {
  upiId: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvv: '',
};

const UPI_RE = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z][a-zA-Z0-9]{1,}$/;
const EXPIRY_RE = /^(0[1-9]|1[0-2])\/\d{2}$/;

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

@customElement('checkout-view')
export class CheckoutView extends LitElement {
  @state() private form: AddressForm = { ...EMPTY_FORM };
  @state() private payment: PaymentMethod = 'cod';
  @state() private paymentDetails: PaymentDetails = { ...EMPTY_PAYMENT };
  @state() private submitting = false;
  @state() private touched = false;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
        padding-bottom: 90px;
      }
      h3.block-title {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-faint);
        margin: 0 0 12px;
      }
      section {
        margin-bottom: 24px;
      }
      .guest-banner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: var(--gold-soft);
        color: var(--text);
        border-radius: var(--radius-sm);
        padding: 10px 12px;
        font-size: 12.5px;
        margin-bottom: 20px;
      }
      .guest-banner strong {
        display: block;
        font-size: 13px;
      }
      .guest-banner button {
        flex: none;
        background: none;
        border: none;
        color: var(--accent);
        font: 700 12px var(--sans);
        cursor: pointer;
        padding: 0;
      }
      .field {
        margin-bottom: 12px;
      }
      label {
        display: block;
        font-size: 12px;
        color: var(--text-dim);
        margin-bottom: 5px;
      }
      input {
        width: 100%;
        font: 500 14px var(--sans);
        color: var(--text);
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 11px 12px;
      }
      input:focus {
        outline: 2px solid var(--accent);
        outline-offset: -1px;
      }
      input.invalid {
        border-color: var(--bad);
      }
      .two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .pay-option {
        display: flex;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 12px;
        margin-bottom: 8px;
        cursor: pointer;
      }
      .pay-option.active {
        border-color: var(--accent);
        background: var(--bg-sunken);
      }
      .pay-option .label {
        font-size: 13.5px;
        font-weight: 600;
      }
      .pay-option .hint {
        font-size: 11.5px;
        color: var(--text-faint);
      }
      .pay-detail {
        border: 1px solid var(--accent);
        border-top: none;
        border-radius: 0 0 var(--radius-sm) var(--radius-sm);
        padding: 14px 12px 12px;
        margin: -8px 0 8px;
        background: var(--bg-sunken);
      }
      .pay-detail .field {
        margin-bottom: 10px;
      }
      .pay-detail .field:last-child {
        margin-bottom: 0;
      }
      .lock-hint {
        font-size: 11px;
        color: var(--text-faint);
        margin: 2px 0 0;
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
      }
      .place-bar {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--bg-elevated);
        border-top: 1px solid var(--border);
        padding: 12px 16px calc(12px + var(--safe-b));
        z-index: 15;
      }
      .place-bar button {
        width: 100%;
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    if (!getGuestEmail()) {
      location.hash = '#/checkout';
    }
  }

  private setField<K extends keyof AddressForm>(key: K, value: string) {
    this.form = { ...this.form, [key]: value };
  }

  private setPaymentField<K extends keyof PaymentDetails>(key: K, value: string) {
    this.paymentDetails = { ...this.paymentDetails, [key]: value };
  }

  private get isAddressValid() {
    const f = this.form;
    return (
      f.fullName.trim().length > 1 &&
      /^[0-9]{10}$/.test(f.phone.trim()) &&
      /^[0-9]{6}$/.test(f.pincode.trim()) &&
      f.addressLine.trim().length > 4 &&
      f.city.trim().length > 1 &&
      f.state.trim().length > 1
    );
  }

  private get isPaymentValid() {
    const p = this.paymentDetails;
    switch (this.payment) {
      case 'upi':
        return UPI_RE.test(p.upiId.trim());
      case 'card':
        return (
          p.cardNumber.replace(/\s/g, '').length === 16 &&
          EXPIRY_RE.test(p.cardExpiry.trim()) &&
          /^[0-9]{3,4}$/.test(p.cardCvv.trim())
        );
      default:
        return true;
    }
  }

  private get isValid() {
    return this.isAddressValid && this.isPaymentValid;
  }

  private placeOrder() {
    this.touched = true;
    if (!this.isValid || this.submitting || !cartStore.lines.length) return;
    this.submitting = true;
    const id = `VST${Date.now().toString(36).toUpperCase()}`;
    setLastOrder({
      id,
      itemCount: cartStore.count,
      total: cartStore.subtotal,
      eta: '5-7 business days',
      email: getGuestEmail(),
    });
    setTimeout(() => {
      cartStore.clear();
      location.hash = `#/order/${id}`;
    }, 500);
  }

  render() {
    const f = this.form;
    const p = this.paymentDetails;
    const invalid = this.touched && !this.isAddressValid;
    const payInvalid = this.touched && !this.isPaymentValid;

    const email = getGuestEmail();

    return html`
      ${email
        ? html`
            <div class="guest-banner">
              <div>
                <strong>Checking out as guest</strong>
                <span>${email}</span>
              </div>
              <button @click=${() => (location.hash = '#/checkout')}>Change</button>
            </div>
          `
        : nothing}
      <section>
        <h3 class="block-title">Delivery Address</h3>
        <div class="field">
          <label>Full name</label>
          <input
            class=${invalid && f.fullName.trim().length <= 1 ? 'invalid' : ''}
            .value=${f.fullName}
            @input=${(e: Event) => this.setField('fullName', (e.target as HTMLInputElement).value)}
            placeholder="Priya Sharma"
          />
        </div>
        <div class="field">
          <label>Phone number</label>
          <input
            class=${invalid && !/^[0-9]{10}$/.test(f.phone.trim()) ? 'invalid' : ''}
            .value=${f.phone}
            inputmode="numeric"
            maxlength="10"
            @input=${(e: Event) => this.setField('phone', (e.target as HTMLInputElement).value)}
            placeholder="9876543210"
          />
        </div>
        <div class="field">
          <label>Address</label>
          <input
            class=${invalid && f.addressLine.trim().length <= 4 ? 'invalid' : ''}
            .value=${f.addressLine}
            @input=${(e: Event) => this.setField('addressLine', (e.target as HTMLInputElement).value)}
            placeholder="House no, street, area"
          />
        </div>
        <div class="two-col">
          <div class="field">
            <label>City</label>
            <input
              class=${invalid && f.city.trim().length <= 1 ? 'invalid' : ''}
              .value=${f.city}
              @input=${(e: Event) => this.setField('city', (e.target as HTMLInputElement).value)}
              placeholder="Chennai"
            />
          </div>
          <div class="field">
            <label>State</label>
            <input
              class=${invalid && f.state.trim().length <= 1 ? 'invalid' : ''}
              .value=${f.state}
              @input=${(e: Event) => this.setField('state', (e.target as HTMLInputElement).value)}
              placeholder="Tamil Nadu"
            />
          </div>
        </div>
        <div class="field">
          <label>Pincode</label>
          <input
            class=${invalid && !/^[0-9]{6}$/.test(f.pincode.trim()) ? 'invalid' : ''}
            .value=${f.pincode}
            inputmode="numeric"
            maxlength="6"
            @input=${(e: Event) => this.setField('pincode', (e.target as HTMLInputElement).value)}
            placeholder="600001"
          />
        </div>
      </section>

      <section>
        <h3 class="block-title">Payment Method</h3>
        ${(
          [
            ['cod', 'Cash on Delivery', 'Pay when your order arrives'],
            ['upi', 'UPI', 'Pay via any UPI app'],
            ['card', 'Credit / Debit Card', 'Visa, Mastercard, RuPay'],
          ] as [PaymentMethod, string, string][]
        ).map(
          ([id, label, hint]) => html`
            <label class="pay-option ${this.payment === id ? 'active' : ''}">
              <input
                type="radio"
                name="payment"
                .checked=${this.payment === id}
                @change=${() => (this.payment = id)}
              />
              <span>
                <span class="label">${label}</span><br />
                <span class="hint">${hint}</span>
              </span>
            </label>
            ${this.payment === id && id === 'upi'
              ? html`
                  <div class="pay-detail">
                    <div class="field">
                      <label>UPI ID</label>
                      <input
                        class=${payInvalid && !UPI_RE.test(p.upiId.trim()) ? 'invalid' : ''}
                        .value=${p.upiId}
                        @input=${(e: Event) =>
                          this.setPaymentField('upiId', (e.target as HTMLInputElement).value)}
                        placeholder="yourname@upi"
                      />
                    </div>
                  </div>
                `
              : nothing}
            ${this.payment === id && id === 'card'
              ? html`
                  <div class="pay-detail">
                    <div class="field">
                      <label>Card number</label>
                      <input
                        class=${payInvalid && p.cardNumber.replace(/\s/g, '').length !== 16 ? 'invalid' : ''}
                        .value=${p.cardNumber}
                        inputmode="numeric"
                        maxlength="19"
                        @input=${(e: Event) =>
                          this.setPaymentField(
                            'cardNumber',
                            formatCardNumber((e.target as HTMLInputElement).value)
                          )}
                        placeholder="1234 5678 9012 3456"
                      />
                    </div>
                    <div class="two-col">
                      <div class="field">
                        <label>Expiry (MM/YY)</label>
                        <input
                          class=${payInvalid && !EXPIRY_RE.test(p.cardExpiry.trim()) ? 'invalid' : ''}
                          .value=${p.cardExpiry}
                          inputmode="numeric"
                          maxlength="5"
                          @input=${(e: Event) =>
                            this.setPaymentField(
                              'cardExpiry',
                              formatExpiry((e.target as HTMLInputElement).value)
                            )}
                          placeholder="08/29"
                        />
                      </div>
                      <div class="field">
                        <label>CVV</label>
                        <input
                          class=${payInvalid && !/^[0-9]{3,4}$/.test(p.cardCvv.trim()) ? 'invalid' : ''}
                          .value=${p.cardCvv}
                          inputmode="numeric"
                          maxlength="4"
                          type="password"
                          @input=${(e: Event) =>
                            this.setPaymentField(
                              'cardCvv',
                              (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4)
                            )}
                          placeholder="123"
                        />
                      </div>
                    </div>
                    <p class="lock-hint">🔒 This is a demo checkout — no card data is transmitted or stored.</p>
                  </div>
                `
              : nothing}
          `
        )}
      </section>

      <section class="summary">
        <div class="row"><span>Items</span><span>${cartStore.count}</span></div>
        <div class="row total"><span>Total payable</span><span>₹${cartStore.subtotal.toLocaleString('en-IN')}</span></div>
      </section>

      <div class="place-bar">
        <button class="primary" ?disabled=${this.submitting} @click=${this.placeOrder}>
          ${this.submitting ? 'Placing order…' : `Place Order · ₹${cartStore.subtotal.toLocaleString('en-IN')}`}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'checkout-view': CheckoutView;
  }
}
