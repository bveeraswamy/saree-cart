import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('success-dialog')
export class SuccessDialog extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property() heading = 'Success';
  @property() message = '';

  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    :host([open]) {
      display: flex;
    }
    .backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
    }
    .panel {
      position: relative;
      width: 100%;
      max-width: 360px;
      background: var(--bg-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 26px 22px 20px;
      text-align: center;
      box-shadow: var(--shadow);
    }
    .icon {
      width: 52px;
      height: 52px;
      margin: 0 auto 14px;
      border-radius: 50%;
      background: var(--good);
      color: #0b2015;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      font-weight: 800;
    }
    h2 {
      font-size: 16px;
      margin: 0 0 6px;
      color: var(--text);
    }
    p {
      font-size: 13px;
      color: var(--text-dim);
      margin: 0 0 20px;
      white-space: pre-line;
    }
    button {
      width: 100%;
      font: 700 14px var(--sans);
      background: var(--accent);
      color: var(--accent-contrast);
      border: none;
      border-radius: var(--radius-sm);
      padding: 11px 0;
      cursor: pointer;
    }
  `;

  private close() {
    this.dispatchEvent(new CustomEvent('close'));
  }

  render() {
    if (!this.open) return nothing;
    return html`
      <div class="backdrop" @click=${this.close}></div>
      <div class="panel" role="alertdialog" aria-modal="true">
        <div class="icon">✓</div>
        <h2>${this.heading}</h2>
        <p>${this.message}</p>
        <button @click=${this.close}>Done</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'success-dialog': SuccessDialog;
  }
}
