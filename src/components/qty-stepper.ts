import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('qty-stepper')
export class QtyStepper extends LitElement {
  @property({ type: Number }) qty = 1;
  @property({ type: Number }) min = 1;
  @property({ type: Number }) max = 10;

  static styles = css`
    :host {
      display: inline-flex;
    }
    .stepper {
      display: flex;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }
    button {
      width: 32px;
      height: 32px;
      border: none;
      background: var(--bg-sunken);
      color: var(--text);
      font-size: 15px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .val {
      width: 32px;
      text-align: center;
      font: 700 13px var(--sans);
    }
  `;

  private emit(qty: number) {
    this.dispatchEvent(new CustomEvent('change', { detail: qty, bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="stepper">
        <button ?disabled=${this.qty <= this.min} @click=${() => this.emit(this.qty - 1)}>−</button>
        <span class="val">${this.qty}</span>
        <button ?disabled=${this.qty >= this.max} @click=${() => this.emit(this.qty + 1)}>+</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'qty-stepper': QtyStepper;
  }
}
