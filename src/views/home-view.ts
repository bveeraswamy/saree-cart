import { LitElement, html, css, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { catalogStore } from '../state/catalog-store';
import { expoStore, DEFAULT_FALLBACK_MESSAGE } from '../state/expo-store';
import { StoreController } from '../state/store-controller';
import { sharedStyles } from '../styles/shared-styles';
import '../components/category-chips';
import '../components/product-grid';

function mapUrl(location: string, embed: boolean): string {
  const query = encodeURIComponent(location);
  return embed
    ? `https://www.google.com/maps?q=${query}&z=15&output=embed`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;
}

@customElement('home-view')
export class HomeView extends LitElement {
  private logoObserver?: IntersectionObserver;

  // retains StoreController subscriptions to re-render on store changes
  catalog = new StoreController(this, catalogStore);
  expo = new StoreController(this, expoStore);

  static styles = [
    sharedStyles,
    css`
      .brand-logo {
        width: 100%;
        height: auto;
        display: block;
        border-radius: var(--radius-sm);
        margin-bottom: 16px;
      }
      .hero {
        border-radius: var(--radius);
        background-size: cover;
        background-position: center 30%;
        color: var(--text);
        padding: 22px 18px;
        margin-bottom: 18px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .hero::after {
        content: '';
        position: absolute;
        right: -30px;
        top: -30px;
        width: 140px;
        height: 140px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
      }
      .hero-text {
        flex: 1;
        min-width: 0;
        background: rgba(20, 6, 11, 0.4);
        border-radius: 10px;
        padding: 8px 10px;
        margin: -8px -10px;
      }
      .map-link {
        flex: none;
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        text-decoration: none;
        color: inherit;
      }
      .map-embed {
        width: 76px;
        height: 76px;
        border: 2px solid var(--text);
        border-radius: 12px;
        /* Purely a visual preview — the wrapping <a> handles the tap, so
           the iframe itself must never intercept touch/scroll gestures. */
        pointer-events: none;
        background: var(--bg-sunken);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
      }
      .map-link span:last-child {
        font: 700 9.5px var(--sans);
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }
      .hero .eyebrow {
        font: 800 30px var(--sans);
        text-transform: uppercase;
        letter-spacing: 0.02em;
        opacity: 1;
        margin: 0 0 8px;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
      }
      .hero h1 {
        font-size: 13px;
        font-weight: 700;
        line-height: 1.5;
        margin: 0 0 6px;
        max-width: 44ch;
        opacity: 1;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      }
      .expo-fallback {
        border-radius: var(--radius);
        border: 1px solid var(--accent);
        background: rgba(232, 121, 154, 0.12);
        color: var(--text);
        padding: 14px 16px;
        margin: 0 0 18px;
        text-align: center;
        font-size: 12.5px;
        font-weight: 600;
        line-height: 1.5;
      }
      .hero-location {
        font-size: 10.5px;
        font-weight: 600;
        line-height: 1.5;
        margin: 0 0 10px;
        max-width: 44ch;
        opacity: 0.9;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      }
      section {
        margin-bottom: 26px;
      }
      .empty-note {
        font-size: 13px;
        color: var(--text-faint);
        text-align: center;
        padding: 20px 0;
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

  connectedCallback() {
    super.connectedCallback();
    catalogStore.load();
    expoStore.load();
  }

  firstUpdated() {
    const logo = this.renderRoot.querySelector('.brand-logo');
    if (!logo) return;
    this.logoObserver = new IntersectionObserver(
      ([entry]) => {
        this.dispatchEvent(
          new CustomEvent('logo-visible-change', {
            detail: { visible: entry.isIntersecting },
            bubbles: true,
            composed: true,
          })
        );
      },
      { rootMargin: '-56px 0px 0px 0px', threshold: 0 }
    );
    this.logoObserver.observe(logo);
  }

  disconnectedCallback() {
    this.logoObserver?.disconnect();
    super.disconnectedCallback();
  }

  render() {
    const products = catalogStore.products;
    const bestsellers = products.filter((p) => p.badge === 'Bestseller').slice(0, 4);
    const newArrivals = products.filter((p) => p.badge === 'New').slice(0, 4);
    const trending = products;

    const expo = expoStore.config;
    const expoActive = !!expo?.isActive;
    const heroStyle = expoActive
      ? `background-image: linear-gradient(135deg, rgba(42, 13, 23, 0.18), rgba(122, 16, 48, 0.12)), url('${expo?.background || '/shop.jpg'}')`
      : '';

    return html`
      <img
        class="brand-logo"
        src="/logo.jpg"
        alt="RAGA Boutique"
        width="1100"
        height="378"
        fetchpriority="high"
        decoding="async"
      />

      ${expoActive
        ? html`
            <div class="hero" style=${heroStyle}>
              <div class="hero-text">
                <p class="eyebrow">${expo?.header || 'Saree Expo'}</p>
                ${expo?.description ? html`<h1>${expo.description}</h1>` : nothing}
                ${expo?.location ? html`<p class="hero-location">Visit us at ${expo.location}</p>` : nothing}
              </div>
              ${expo?.location
                ? html`
                    <a
                      class="map-link"
                      href=${mapUrl(expo.location, false)}
                      target="_blank"
                      rel="noopener"
                      aria-label="Open in Google Maps"
                    >
                      <iframe
                        class="map-embed"
                        src=${mapUrl(expo.location, true)}
                        loading="lazy"
                        title="Saree Expo location"
                        tabindex="-1"
                      ></iframe>
                      <span>Google Maps</span>
                    </a>
                  `
                : nothing}
            </div>
          `
        : html`<p class="expo-fallback">${expo?.fallbackMessage || DEFAULT_FALLBACK_MESSAGE}</p>`}

      <category-chips
        .categories=${catalogStore.categories}
        @select=${(e: CustomEvent) => this.go(`#/shop/${encodeURIComponent(e.detail)}`)}
      ></category-chips>

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
          <strong>Kanjivaram Edit</strong>
          <span>Handwoven silks &amp; heirloom zari borders</span>
        </div>
        <button @click=${() => this.go('#/shop/kanjivaram')}>Explore</button>
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
        ${catalogStore.loading
          ? html`<p class="empty-note">Loading sarees…</p>`
          : trending.length
            ? html`<product-grid .products=${trending}></product-grid>`
            : html`
                <div class="empty">
                  <span class="icon">🥻</span>
                  <p>No sarees available right now.</p>
                  <p>Check back soon for our latest collection.</p>
                </div>
              `}
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-view': HomeView;
  }
}
