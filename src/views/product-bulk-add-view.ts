import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authStore } from '../state/auth-store';
import { catalogStore } from '../state/catalog-store';
import { createProduct, type NewProductInput } from '../api/catalog-api';
import { AuthApiError } from '../api/auth-api';
import { sharedStyles } from '../styles/shared-styles';
import { randomPleasantHex } from '../utils/color';
import '../components/success-dialog';

const EMPTY_SHARED = {
  name: '',
  category: '',
  fabric: '',
  mrp: '',
  description: '',
  soldOut: false,
  isListed: true,
  rating: '0',
  reviews: '0',
  badge: '',
  blousePieceIncluded: false,
  deliveryAvailable: true,
  hexColor: '#7a1030',
  care: '',
};

const BADGE_OPTIONS = ['', 'New', 'Bestseller', 'Sale', 'Limited'];

type RowStatus = 'pending' | 'saving' | 'done' | 'error';

interface BulkRow {
  productCode: string;
  price: string;
  productColor: string;
  status: RowStatus;
  error?: string;
}

function emptyRow(): BulkRow {
  return { productCode: '', price: '', productColor: '', status: 'pending' };
}

@customElement('product-bulk-add-view')
export class ProductBulkAddView extends LitElement {
  @state() private shared = { ...EMPTY_SHARED, hexColor: randomPleasantHex() };
  @state() private rows: BulkRow[] = [emptyRow(), emptyRow(), emptyRow()];
  @state() private saving = false;
  @state() private saveError = '';
  @state() private successMessage = '';

  static styles = [
    sharedStyles,
    css`
      :host {
        display: block;
      }
      .card {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 18px;
        background: var(--bg-elevated);
      }
      h1 {
        font-size: 18px;
        margin: 0 0 4px;
      }
      .hint {
        font-size: 12.5px;
        color: var(--text-faint);
        margin: 0 0 18px;
      }
      .field {
        margin-bottom: 14px;
      }
      label {
        display: block;
        font-size: 12px;
        color: var(--text-dim);
        margin-bottom: 5px;
      }
      input,
      textarea,
      select {
        width: 100%;
        font: 500 14px var(--sans);
        color: var(--text);
        background: var(--bg-sunken);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: 11px 12px;
      }
      input[type='color'] {
        padding: 4px;
        height: 42px;
        cursor: pointer;
      }
      textarea {
        resize: vertical;
        min-height: 70px;
        font-family: var(--sans);
      }
      input:focus,
      textarea:focus,
      select:focus {
        outline: 2px solid var(--accent);
        outline-offset: -1px;
      }
      .two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .checkbox-field {
        margin-bottom: 18px;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--text);
        margin-bottom: 0;
        cursor: pointer;
      }
      .checkbox-label input {
        width: auto;
        cursor: pointer;
      }
      .missing {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-faint);
      }
      .rows {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 10px;
      }
      .row-head {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 28px;
        gap: 8px;
        padding: 0 2px;
        font-size: 10.5px;
        color: var(--text-faint);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 28px;
        gap: 8px;
        align-items: center;
      }
      .row input {
        padding: 9px 10px;
        font-size: 13px;
      }
      .row.row-saving input {
        opacity: 0.6;
      }
      .row.row-done input {
        border-color: var(--good);
      }
      .row.row-error input {
        border-color: var(--bad);
      }
      .row-remove {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: none;
        background: var(--bg-sunken);
        color: var(--text-faint);
        font-size: 12px;
        line-height: 1;
        cursor: pointer;
      }
      .row-note {
        grid-column: 1 / -1;
        font-size: 11px;
        margin: -4px 0 2px;
      }
      .row-note.row-note-error {
        color: var(--bad);
      }
      .row-note.row-note-ok {
        color: var(--good);
      }
      .add-row {
        font: 700 12.5px var(--sans);
        background: none;
        border: 1.5px dashed var(--border);
        border-radius: var(--radius-sm);
        color: var(--text-dim);
        padding: 9px 0;
        width: 100%;
        cursor: pointer;
      }
      .add-row:hover {
        border-color: var(--accent);
        color: var(--accent);
      }
      .actions {
        margin-top: 18px;
        display: flex;
        gap: 10px;
      }
      .actions button {
        flex: 1;
      }
    `,
  ];

  private setShared<K extends keyof typeof EMPTY_SHARED>(key: K, value: (typeof EMPTY_SHARED)[K]) {
    this.shared = { ...this.shared, [key]: value };
  }

  private setRow(index: number, key: 'productCode' | 'price' | 'productColor', value: string) {
    this.rows = this.rows.map((row, i) => (i === index ? { ...row, [key]: value } : row));
  }

  private addRow() {
    this.rows = [...this.rows, emptyRow()];
  }

  private removeRow(index: number) {
    this.rows = this.rows.filter((_, i) => i !== index);
  }

  private get validRows(): BulkRow[] {
    return this.rows.filter((r) => r.productCode.trim() && r.price.trim() && r.productColor.trim());
  }

  private async onSubmit(e: Event) {
    e.preventDefault();
    const user = authStore.user;
    const s = this.shared;
    if (!user || this.saving) return;
    if (!s.name.trim() || !s.category.trim() || !s.fabric.trim()) return;

    const targets = this.rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.productCode.trim() && row.price.trim() && row.productColor.trim());
    if (!targets.length) return;

    this.saving = true;
    this.saveError = '';
    const care = JSON.stringify(
      s.care
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    );

    let successCount = 0;
    for (const { row, index } of targets) {
      this.rows = this.rows.map((r, i) => (i === index ? { ...r, status: 'saving', error: undefined } : r));
      try {
        const payload: NewProductInput = {
          productCode: row.productCode.trim(),
          name: s.name,
          category: s.category,
          fabric: s.fabric,
          price: row.price.trim(),
          mrp: s.mrp,
          description: s.description,
          soldOut: s.soldOut,
          isListed: s.isListed,
          rating: s.rating,
          reviews: s.reviews,
          badge: s.badge,
          blousePieceIncluded: s.blousePieceIncluded,
          deliveryAvailable: s.deliveryAvailable,
          hexColor: s.hexColor,
          productColor: row.productColor.trim(),
          care,
        };
        await createProduct(user.token, payload, []);
        successCount += 1;
        this.rows = this.rows.map((r, i) => (i === index ? { ...r, status: 'done' } : r));
      } catch (err) {
        const message = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
        this.rows = this.rows.map((r, i) => (i === index ? { ...r, status: 'error', error: message } : r));
      }
    }

    this.saving = false;
    catalogStore.refresh();
    if (successCount === targets.length) {
      this.successMessage = `${successCount} product${successCount === 1 ? '' : 's'} added to your catalog.`;
    } else {
      this.saveError = `${successCount} of ${targets.length} products added. Fix the failed row(s) below and submit again.`;
    }
  }

  render() {
    const user = authStore.user;
    if (!user || (user.role !== 'Site Admin' && user.role !== 'Power User')) {
      return html`<div class="missing"><p>You don't have access to this page.</p></div>`;
    }

    const s = this.shared;
    const count = this.validRows.length;

    return html`
      <div class="card">
        <h1>Bulk Add Products</h1>
        <p class="hint">
          Set the shared details once — every row below only needs a Product Code, Price, and Color to create
          its own product.
        </p>
        <form @submit=${this.onSubmit}>
          <div class="field">
            <label>Name</label>
            <input
              .value=${s.name}
              @input=${(e: Event) => this.setShared('name', (e.target as HTMLInputElement).value)}
              placeholder="Kanjivaram Radiance Silk Saree"
            />
          </div>
          <div class="two-col">
            <div class="field">
              <label>Category</label>
              <input
                .value=${s.category}
                @input=${(e: Event) => this.setShared('category', (e.target as HTMLInputElement).value)}
                placeholder="kanjivaram"
              />
            </div>
            <div class="field">
              <label>Fabric</label>
              <input
                .value=${s.fabric}
                @input=${(e: Event) => this.setShared('fabric', (e.target as HTMLInputElement).value)}
                placeholder="Pure Silk"
              />
            </div>
          </div>
          <div class="field">
            <label>Description</label>
            <textarea
              .value=${s.description}
              @input=${(e: Event) => this.setShared('description', (e.target as HTMLTextAreaElement).value)}
              placeholder="Optional"
            ></textarea>
          </div>
          <div class="two-col">
            <div class="field">
              <label>MRP (₹) (optional, shared)</label>
              <input
                inputmode="decimal"
                .value=${s.mrp}
                @input=${(e: Event) => this.setShared('mrp', (e.target as HTMLInputElement).value)}
                placeholder="8999"
              />
            </div>
            <div class="field">
              <label>Badge</label>
              <select
                .value=${s.badge}
                @change=${(e: Event) => this.setShared('badge', (e.target as HTMLSelectElement).value)}
              >
                ${BADGE_OPTIONS.map(
                  (b) => html`<option value=${b} ?selected=${s.badge === b}>${b || 'None'}</option>`
                )}
              </select>
            </div>
          </div>
          <div class="field">
            <label>Container Background (shared)</label>
            <input
              type="color"
              .value=${s.hexColor}
              @input=${(e: Event) => this.setShared('hexColor', (e.target as HTMLInputElement).value)}
            />
          </div>
          <div class="field">
            <label>Care Instructions (one per line, shared)</label>
            <textarea
              .value=${s.care}
              @input=${(e: Event) => this.setShared('care', (e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </div>
          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${s.blousePieceIncluded}
                @change=${(e: Event) => this.setShared('blousePieceIncluded', (e.target as HTMLInputElement).checked)}
              />
              Blouse Piece Included
            </label>
          </div>
          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${s.deliveryAvailable}
                @change=${(e: Event) => this.setShared('deliveryAvailable', (e.target as HTMLInputElement).checked)}
              />
              Delivery Available
            </label>
          </div>
          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${s.soldOut}
                @change=${(e: Event) => this.setShared('soldOut', (e.target as HTMLInputElement).checked)}
              />
              Sold Out
            </label>
          </div>
          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${!s.isListed}
                @change=${(e: Event) => this.setShared('isListed', !(e.target as HTMLInputElement).checked)}
              />
              Disable Listing (hide from storefront)
            </label>
          </div>

          <div class="field">
            <label>Variants</label>
            <div class="rows">
              <div class="row-head">
                <span>Product Code</span><span>Price (₹)</span><span>Color</span><span></span>
              </div>
              ${this.rows.map(
                (row, i) => html`
                  <div class="row row-${row.status}">
                    <input
                      .value=${row.productCode}
                      @input=${(e: Event) => this.setRow(i, 'productCode', (e.target as HTMLInputElement).value)}
                      placeholder="VKSS-10"
                    />
                    <input
                      inputmode="decimal"
                      .value=${row.price}
                      @input=${(e: Event) => this.setRow(i, 'price', (e.target as HTMLInputElement).value)}
                      placeholder="2600"
                    />
                    <input
                      .value=${row.productColor}
                      @input=${(e: Event) => this.setRow(i, 'productColor', (e.target as HTMLInputElement).value)}
                      placeholder="olive green"
                    />
                    <button
                      type="button"
                      class="row-remove"
                      aria-label="Remove row"
                      @click=${() => this.removeRow(i)}
                    >
                      ✕
                    </button>
                    ${row.status === 'error'
                      ? html`<span class="row-note row-note-error">${row.error}</span>`
                      : nothing}
                    ${row.status === 'done' ? html`<span class="row-note row-note-ok">✓ Added</span>` : nothing}
                  </div>
                `
              )}
            </div>
            <button type="button" class="add-row" @click=${() => this.addRow()}>+ Add Row</button>
          </div>

          ${this.saveError ? html`<p class="error">${this.saveError}</p>` : nothing}
          <div class="actions">
            <button class="ghost" type="button" @click=${() => history.back()}>Cancel</button>
            <button class="primary" type="submit" ?disabled=${this.saving || !count}>
              ${this.saving ? 'Adding…' : `Add ${count || ''} Product${count === 1 ? '' : 's'}`}
            </button>
          </div>
        </form>
      </div>
      <success-dialog
        .open=${!!this.successMessage}
        heading="Products Added"
        .message=${this.successMessage}
        @close=${() => (location.hash = '#/account')}
      ></success-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'product-bulk-add-view': ProductBulkAddView;
  }
}
