import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { catalogStore } from '../state/catalog-store';
import { StoreController } from '../state/store-controller';
import { sharedStyles } from '../styles/shared-styles';
import '../components/category-chips';
import '../components/product-grid';

const EXPO_ADDRESS =
  'No. 325, Bharathiyar Road, Maniyakarampalayam, Ganapathy, Coimbatore - 641006, Tamil Nadu';
// Exact pin coordinates for the venue (confirmed via Google Maps), used
// instead of a text-search so the link never depends on geocoding guesses.
const EXPO_COORDS = '11.048024,76.975682';

@customElement('home-view')
export class HomeView extends LitElement {
  @state() private logoLoaded = false;

  private logoObserver?: IntersectionObserver;

  // retains a StoreController subscription to re-render on store changes
  catalog = new StoreController(this, catalogStore);

  static styles = [
    sharedStyles,
    css`
      .brand-logo {
        width: 100%;
        height: auto;
        display: block;
        border-radius: var(--radius-sm);
        margin-bottom: 16px;
        opacity: 0;
      }
      .brand-logo.loaded {
        animation: logo-in 0.7s ease-out both;
      }
      @keyframes logo-in {
        from {
          opacity: 0;
          transform: translateY(-16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .hero {
        border-radius: var(--radius);
        background:
          linear-gradient(135deg, rgba(42, 13, 23, 0.18), rgba(122, 16, 48, 0.12)),
          url('/shop.jpg') center 30% / cover;
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
        font-size: 10.5px;
        font-weight: 700;
        line-height: 1.5;
        margin: 0 0 10px;
        max-width: 44ch;
        opacity: 1;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
      }
      .hero button {
        font: 700 13px var(--sans);
        background: var(--text);
        color: var(--accent-strong);
        border: none;
        border-radius: 20px;
        padding: 9px 16px;
        cursor: pointer;
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

    return html`
      <img
        class="brand-logo ${this.logoLoaded ? 'loaded' : ''}"
        src="/logo.jpg"
        alt="RAGA Boutique"
        @load=${() => (this.logoLoaded = true)}
      />

      <div class="hero">
        <div class="hero-text">
          <p class="eyebrow">Saree Expo</p>
          <!--<h1>Handwoven sarees, curated for every occasion</h1>-->
          <h1>Visit us at ${EXPO_ADDRESS}</h1>
          <!--<button @click=${() => this.go('#/shop')}>Shop the collection</button>-->
        </div>
        <a
          class="map-link"
          href=${`https://www.google.com/maps/search/?api=1&query=${EXPO_COORDS}`}
          target="_blank"
          rel="noopener"
          aria-label="Open in Google Maps"
        >
          <iframe
            class="map-embed"
            src=${`https://www.google.com/maps?q=${EXPO_COORDS}&z=15&output=embed`}
            loading="lazy"
            title="Saree Expo location"
            tabindex="-1"
          ></iframe>
          <span>Google Maps</span>
        </a>
      </div>

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
