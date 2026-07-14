import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { PRODUCTS } from '../data/products';
import { sharedStyles } from '../styles/shared-styles';
import '../components/category-chips';
import '../components/product-grid';

@customElement('home-view')
export class HomeView extends LitElement {
  static styles = [
    sharedStyles,
    css`
      .hero {
        border-radius: var(--radius);
        background: linear-gradient(135deg, var(--accent-strong), var(--accent));
        color: var(--accent-contrast);
        padding: 22px 18px;
        margin-bottom: 18px;
        position: relative;
        overflow: hidden;
      }
      .hero::after {
        content: '';
        position: absolute;
        right: -30px;
        top: -30px;
        width: 140px;
        height: 140px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.12);
      }
      .hero .eyebrow {
        font: 700 11px var(--sans);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.85;
        margin: 0 0 6px;
      }
      .hero h1 {
        font-size: 22px;
        line-height: 1.25;
        margin: 0 0 10px;
        max-width: 22ch;
      }
      .hero button {
        font: 700 13px var(--sans);
        background: var(--accent-contrast);
        color: var(--accent-strong);
        border: none;
        border-radius: 20px;
        padding: 9px 16px;
        cursor: pointer;
      }
      section {
        margin-bottom: 26px;
      }
      .promo {
        border-radius: var(--radius);
        background: var(--gold-soft);
        color: var(--gold);
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 26px;
      }
      .promo strong {
        display: block;
        font-size: 14px;
        color: var(--text);
      }
      .promo span {
        font-size: 12.5px;
      }
      .promo button {
        font: 700 12.5px var(--sans);
        background: var(--gold);
        color: #fff;
        border: none;
        border-radius: 16px;
        padding: 8px 14px;
        cursor: pointer;
        flex: none;
      }
    `,
  ];

  private go(hash: string) {
    location.hash = hash;
  }

  render() {
    const bestsellers = PRODUCTS.filter((p) => p.badge === 'Bestseller').slice(0, 4);
    const newArrivals = PRODUCTS.filter((p) => p.badge === 'New').slice(0, 4);
    const trending = PRODUCTS.slice(0, 8);

    return html`
      <div class="hero">
        <p class="eyebrow">Festive Edit 2026</p>
        <h1>Handwoven sarees, curated for every occasion</h1>
        <button @click=${() => this.go('#/shop')}>Shop the collection</button>
      </div>

      <category-chips @select=${(e: CustomEvent) => this.go(`#/shop/${e.detail}`)}></category-chips>

      ${bestsellers.length
        ? html`
            <section>
              <p class="section-title">
                Bestsellers <span class="link" @click=${() => this.go('#/shop')}>See all ›</span>
              </p>
              <product-grid .products=${bestsellers}></product-grid>
            </section>
          `
        : ''}

      <div class="promo">
        <div>
          <strong>Wedding Edit</strong>
          <span>Bridal silks &amp; heirloom weaves</span>
        </div>
        <button @click=${() => this.go('#/shop/wedding')}>Explore</button>
      </div>

      ${newArrivals.length
        ? html`
            <section>
              <p class="section-title">
                New Arrivals <span class="link" @click=${() => this.go('#/shop')}>See all ›</span>
              </p>
              <product-grid .products=${newArrivals}></product-grid>
            </section>
          `
        : ''}

      <section>
        <p class="section-title">Trending Now</p>
        <product-grid .products=${trending}></product-grid>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-view': HomeView;
  }
}
