import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { hexToRgb, relativeLuminance, mixWithWhite } from '../utils/color';

// Each recipe uses --pattern-tint (an "R, G, B" triple chosen for contrast
// against the product's own hex colour) rather than a fixed white, so the
// texture stays visible whether the base colour is pale ivory or near-black.
const PATTERN_OVERLAY: Record<string, string> = {
  kanjivaram: 'repeating-linear-gradient(45deg, rgba(var(--pattern-tint), 0.16) 0 2px, transparent 2px 10px)',
  banarasi: 'repeating-linear-gradient(115deg, rgba(var(--pattern-tint), 0.14) 0 3px, transparent 3px 9px)',
  cotton: 'repeating-linear-gradient(0deg, rgba(var(--pattern-tint), 0.1) 0 1px, transparent 1px 8px)',
  chiffon: 'radial-gradient(circle at 30% 30%, rgba(var(--pattern-tint), 0.25), transparent 60%)',
  georgette: 'radial-gradient(circle at 70% 40%, rgba(var(--pattern-tint), 0.2), transparent 55%)',
  linen: 'repeating-linear-gradient(90deg, rgba(var(--pattern-tint), 0.08) 0 2px, transparent 2px 6px)',
  wedding: 'repeating-linear-gradient(45deg, rgba(var(--pattern-tint), 0.2) 0 2px, transparent 2px 8px)',
  printed: 'radial-gradient(rgba(var(--pattern-tint), 0.28) 1.5px, transparent 1.6px)',
};

const PATTERN_KEYS = Object.keys(PATTERN_OVERLAY);

// Deterministic per-product pattern pick: same product always gets the same
// texture (no flicker on re-render), but different products spread across
// the full set instead of clumping by category.
export function patternForSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return PATTERN_KEYS[hash % PATTERN_KEYS.length];
}

/**
 * Illustrative saree "photo" placeholder: a colour-driven gradient with a
 * fabric-appropriate texture overlay and a gold pallu stripe. Avoids any
 * network image dependency so the catalog renders identically offline.
 */
@customElement('saree-swatch')
export class SareeSwatch extends LitElement {
  @property() hex = '#7a1030';
  @property() pattern = 'cotton';
  @property({ type: Boolean }) square = false;
  @property() label = '';
  @property({ type: Boolean }) hidePallu = false;

  static styles = css`
    :host {
      display: block;
      position: relative;
      overflow: hidden;
      border-radius: var(--radius);
      background: var(--swatch-color, #7a1030);
    }
    .overlay {
      position: absolute;
      inset: 0;
      background-image: var(--pattern-image, none);
      background-size: 14px 14px;
      mix-blend-mode: overlay;
    }
    .shade {
      position: absolute;
      inset: 0;
      background: linear-gradient(165deg, rgba(var(--sheen-rgb, 255, 255, 255), 0.3), rgba(0, 0, 0, 0.2) 85%);
    }
    .sheen {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        115deg,
        transparent 25%,
        rgba(var(--sheen-rgb, 255, 255, 255), 0.35) 45%,
        transparent 65%
      );
      mix-blend-mode: soft-light;
    }
    .pallu {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 18%;
      background: linear-gradient(90deg, rgba(183, 134, 47, 0.9), rgba(212, 175, 90, 0.95));
      border-top: 2px solid rgba(255, 255, 255, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pallu-label {
      font: 700 10.5px var(--sans);
      letter-spacing: 0.04em;
      color: rgba(0, 0, 0, 0.72);
      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.25);
    }
    .frame {
      aspect-ratio: 3 / 4;
      width: 100%;
      height: 100%;
    }
    .frame.square {
      aspect-ratio: 1 / 1;
    }
  `;

  updated() {
    const rgb = hexToRgb(this.hex);
    const isLight = relativeLuminance(rgb) > 0.5;

    this.style.setProperty('--swatch-color', this.hex);
    this.style.setProperty('--pattern-image', PATTERN_OVERLAY[this.pattern] ?? PATTERN_OVERLAY.cotton);
    // Dark tint on light backgrounds, light tint on dark ones, so the woven
    // texture never washes out regardless of the chosen colour.
    this.style.setProperty('--pattern-tint', isLight ? '40, 28, 20' : '255, 255, 255');
    // A highlight mixed from the product's own hue, not a generic white, so
    // the "silk sheen" reads as part of the same fabric rather than a glare.
    this.style.setProperty('--sheen-rgb', mixWithWhite(rgb, 0.65));
  }

  render() {
    return html`
      <div class="frame ${this.square ? 'square' : ''}">
        <div class="overlay"></div>
        <div class="shade"></div>
        <div class="sheen"></div>
        ${this.hidePallu
          ? nothing
          : html`<div class="pallu">${this.label ? html`<span class="pallu-label">${this.label}</span>` : nothing}</div>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'saree-swatch': SareeSwatch;
  }
}
