import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Product } from '../data/products';
import './product-card';

@customElement('product-grid')
export class ProductGrid extends LitElement {
  @property({ attribute: false }) products: Product[] = [];

  static styles = css`
    :host {
      display: block;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px 10px;
    }
    @media (min-width: 640px) {
      .grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 20px 16px;
      }
    }
    @media (min-width: 960px) {
      .grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  `;

  render() {
    return html`
      <div class="grid">
        ${this.products.map((p) => html`<product-card .product=${p}></product-card>`)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'product-grid': ProductGrid;
  }
}
