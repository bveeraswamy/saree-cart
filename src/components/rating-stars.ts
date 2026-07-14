import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('rating-stars')
export class RatingStars extends LitElement {
  @property({ type: Number }) rating = 0;
  @property({ type: Number }) reviews = 0;

  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: var(--good);
      color: #fff;
      font: 700 11.5px var(--sans);
      padding: 2px 6px;
      border-radius: 5px;
    }
    .count {
      font-size: 12px;
      color: var(--text-faint);
    }
  `;

  render() {
    return html`
      <span class="pill">${this.rating.toFixed(1)} ★</span>
      ${this.reviews ? html`<span class="count">(${this.reviews})</span>` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rating-stars': RatingStars;
  }
}
