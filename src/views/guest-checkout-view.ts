import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cartStore } from '../state/cart-store';
import { setGuestEmail, getGuestEmail } from '../state/checkout-session';
import { sharedStyles } from '../styles/shared-styles';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@customElement('guest-checkout-view')
export class GuestCheckoutView extends LitElement {
  @state() private email = getGuestEmail();
  @state() private touched = false;
  @state() private toast = '';

  private toastTimer?: ReturnType<typeof setTimeout>;

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .intro {
        margin-bottom: 22px;
      }
      .intro h1 {
        font-size: 19px;
        margin: 0 0 6px;
      }
      .intro p {
        font-size: 13.5px;
        color: var(--text-dim);
        margin: 0;
      }
      .card {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 18px;
        background: var(--bg-elevated);
        margin-bottom: 18px;
      }
      .card h2 {
        font-size: 15px;
        margin: 0 0 4px;
      }
      .card .hint {
        font-size: 12.5px;
        color: var(--text-faint);
        margin: 0 0 14px;
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
        background: var(--bg-sunken);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 11px 12px;
        margin-bottom: 14px;
      }
      input:focus {
        outline: 2px solid var(--accent);
        outline-offset: -1px;
      }
      input.invalid {
        border-color: var(--bad);
      }
      .error {
        font-size: 11.5px;
        color: var(--bad);
        margin: -10px 0 14px;
      }
      button.primary {
        width: 100%;
      }
      .divider {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 22px 0;
        color: var(--text-faint);
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border);
      }
      .signin {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 16px;
        text-align: center;
      }
      .signin p {
        font-size: 13px;
        color: var(--text-dim);
        margin: 0 0 12px;
      }
      button.ghost {
        width: 100%;
      }
      .toast {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: calc(var(--safe-b) + 16px);
        background: var(--text);
        color: var(--bg);
        padding: 12px 16px;
        border-radius: var(--radius-sm);
        font-size: 13.5px;
        font-weight: 600;
        text-align: center;
        z-index: 30;
        box-shadow: var(--shadow);
      }
    `,
  ];

  disconnectedCallback() {
    clearTimeout(this.toastTimer);
    super.disconnectedCallback();
  }

  private get emailValid() {
    return EMAIL_RE.test(this.email.trim());
  }

  private continueAsGuest() {
    this.touched = true;
    if (!this.emailValid || !cartStore.lines.length) return;
    setGuestEmail(this.email.trim());
    location.hash = '#/checkout/address';
  }

  private signInStub() {
    this.toast = 'Accounts aren’t available yet — continue as guest to check out.';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toast = ''), 2600);
  }

  render() {
    const invalid = this.touched && !this.emailValid;
    return html`
      <div class="intro">
        <h1>Almost there</h1>
        <p>No account needed — check out as a guest with just your email.</p>
      </div>

      <div class="card">
        <h2>Continue as Guest</h2>
        <p class="hint">We'll send your order confirmation and delivery updates here.</p>
        <label>Email address</label>
        <input
          type="email"
          class=${invalid ? 'invalid' : ''}
          .value=${this.email}
          @input=${(e: Event) => (this.email = (e.target as HTMLInputElement).value)}
          placeholder="you@example.com"
        />
        ${invalid ? html`<p class="error">Enter a valid email address</p>` : nothing}
        <button class="primary" @click=${this.continueAsGuest}>Continue as Guest</button>
      </div>

      <div class="divider">or</div>

      <div class="signin">
        <p>Have an account? Sign in to use saved addresses and track past orders.</p>
        <button class="ghost" @click=${this.signInStub}>Sign In</button>
      </div>

      ${this.toast ? html`<div class="toast">${this.toast}</div>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'guest-checkout-view': GuestCheckoutView;
  }
}
