import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

const PATTERN_OVERLAY: Record<string, string> = {
  kanjivaram: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0 2px, transparent 2px 10px)',
  banarasi: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.14) 0 3px, transparent 3px 9px)',
  cotton: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0 1px, transparent 1px 8px)',
  chiffon: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent 60%)',
  georgette: 'radial-gradient(circle at 70% 40%, rgba(255,255,255,0.2), transparent 55%)',
  linen: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 6px)',
  wedding: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0 2px, transparent 2px 8px)',
  printed: 'radial-gradient(rgba(255,255,255,0.28) 1.5px, transparent 1.6px)',
};

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
      background: linear-gradient(165deg, rgba(255, 255, 255, 0.16), rgba(0, 0, 0, 0.18) 85%);
    }
    .pallu {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 18%;
      background: linear-gradient(90deg, rgba(183, 134, 47, 0.9), rgba(212, 175, 90, 0.95));
      border-top: 2px solid rgba(255, 255, 255, 0.35);
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
    this.style.setProperty('--swatch-color', this.hex);
    this.style.setProperty('--pattern-image', PATTERN_OVERLAY[this.pattern] ?? PATTERN_OVERLAY.cotton);
  }

  render() {
    return html`
      <div class="frame ${this.square ? 'square' : ''}">
        <div class="overlay"></div>
        <div class="shade"></div>
        <div class="pallu"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'saree-swatch': SareeSwatch;
  }
}
