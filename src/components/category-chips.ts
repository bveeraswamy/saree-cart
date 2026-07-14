import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { CATEGORIES } from '../data/categories';

@customElement('category-chips')
export class CategoryChips extends LitElement {
  @property() active = '';

  static styles = css`
    :host {
      display: block;
    }
    .row {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 2px 2px 10px;
      scrollbar-width: none;
    }
    .row::-webkit-scrollbar {
      display: none;
    }
    button {
      flex: none;
      display: flex;
      align-items: center;
      gap: 6px;
      font: 600 12.5px var(--sans);
      background: var(--bg-elevated);
      color: var(--text-dim);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 8px 14px;
      cursor: pointer;
      white-space: nowrap;
    }
    button.active {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--accent-contrast);
    }
  `;

  private select(id: string) {
    this.dispatchEvent(new CustomEvent('select', { detail: id, bubbles: true, composed: true }));
  }

  render() {
    return html`
      <div class="row">
        <button class=${this.active === '' ? 'active' : ''} @click=${() => this.select('')}>
          All
        </button>
        ${CATEGORIES.map(
          (c) => html`
            <button class=${this.active === c.id ? 'active' : ''} @click=${() => this.select(c.id)}>
              <span>${c.icon}</span>${c.label}
            </button>
          `
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'category-chips': CategoryChips;
  }
}
