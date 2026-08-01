import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { authStore } from '../state/auth-store';
import { catalogStore } from '../state/catalog-store';
import { createProduct, type NewProductInput } from '../api/catalog-api';
import { AuthApiError } from '../api/auth-api';
import { sharedStyles } from '../styles/shared-styles';
import { randomPleasantHex } from '../utils/color';
import '../components/success-dialog';

const EMPTY_FORM = {
  productCode: '',
  name: '',
  category: '',
  fabric: '',
  price: '',
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
  productColor: 'maroon',
  care: '',
};

const BADGE_OPTIONS = ['', 'New', 'Bestseller', 'Sale', 'Limited'];

interface PickedImage {
  file: File;
  url: string;
}

@customElement('product-add-view')
export class ProductAddView extends LitElement {
  @state() private form = { ...EMPTY_FORM, hexColor: randomPleasantHex() };
  @state() private images: PickedImage[] = [];
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
      .actions {
        margin-top: 18px;
        display: flex;
        gap: 10px;
      }
      .actions button {
        flex: 1;
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
      .gallery-picker {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .thumb {
        position: relative;
        width: 72px;
        height: 72px;
        border-radius: var(--radius-sm);
        overflow: hidden;
        flex: none;
      }
      .thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .thumb.is-cover {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }
      .cover-tag {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        font: 700 8.5px var(--sans);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        text-align: center;
        padding: 2px 0;
        background: var(--accent);
        color: var(--accent-contrast);
      }
      .thumb-remove {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.65);
        color: #fff;
        font-size: 12px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .thumb-add {
        width: 72px;
        height: 72px;
        border-radius: var(--radius-sm);
        border: 1.5px dashed var(--border);
        background: var(--bg-sunken);
        color: var(--text-dim);
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .thumb-add:hover {
        border-color: var(--accent);
        color: var(--accent);
      }
    `,
  ];

  private setField<K extends keyof typeof EMPTY_FORM>(key: K, value: string) {
    this.form = { ...this.form, [key]: value };
  }

  private setSoldOut(value: boolean) {
    this.form = { ...this.form, soldOut: value };
  }

  private setDisableListing(disabled: boolean) {
    this.form = { ...this.form, isListed: !disabled };
  }

  private setBlousePieceIncluded(value: boolean) {
    this.form = { ...this.form, blousePieceIncluded: value };
  }

  private setDeliveryAvailable(value: boolean) {
    this.form = { ...this.form, deliveryAvailable: value };
  }

  private openFilePicker() {
    this.renderRoot.querySelector<HTMLInputElement>('#gallery-input')?.click();
  }

  private onFilesSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const added = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    this.images = [...this.images, ...added];
    input.value = '';
  }

  private removeImage(index: number) {
    const removed = this.images[index];
    if (removed) URL.revokeObjectURL(removed.url);
    this.images = this.images.filter((_, i) => i !== index);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.images.forEach((img) => URL.revokeObjectURL(img.url));
  }

  private async onSubmit(e: Event) {
    e.preventDefault();
    const user = authStore.user;
    const f = this.form;
    if (!user || this.saving) return;
    if (!f.productCode.trim() || !f.name.trim() || !f.category.trim() || !f.fabric.trim() || !f.price.trim())
      return;

    this.saving = true;
    this.saveError = '';
    try {
      const payload: NewProductInput = {
        ...f,
        care: JSON.stringify(
          f.care
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        ),
      };
      const created = await createProduct(
        user.token,
        payload,
        this.images.map((img) => img.file)
      );
      catalogStore.refresh();
      this.successMessage = `${created.name} (${created.productCode ?? 'no code'}) was added to your catalog.`;
    } catch (err) {
      this.saveError = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    } finally {
      this.saving = false;
    }
  }

  render() {
    const user = authStore.user;
    if (!user || (user.role !== 'Site Admin' && user.role !== 'Power User')) {
      return html`<div class="missing"><p>You don't have access to this page.</p></div>`;
    }

    const f = this.form;

    return html`
      <div class="card">
        <form @submit=${this.onSubmit}>
          <div class="field">
            <label>Product Code</label>
            <input
              .value=${f.productCode}
              @input=${(e: Event) => this.setField('productCode', (e.target as HTMLInputElement).value)}
              placeholder="SKU-001"
            />
          </div>
          <div class="field">
            <label>Name</label>
            <input
              .value=${f.name}
              @input=${(e: Event) => this.setField('name', (e.target as HTMLInputElement).value)}
              placeholder="Kanjivaram Radiance Silk Saree"
            />
          </div>
          <div class="two-col">
            <div class="field">
              <label>Category</label>
              <input
                .value=${f.category}
                @input=${(e: Event) => this.setField('category', (e.target as HTMLInputElement).value)}
                placeholder="kanjivaram"
              />
            </div>
            <div class="field">
              <label>Fabric</label>
              <input
                .value=${f.fabric}
                @input=${(e: Event) => this.setField('fabric', (e.target as HTMLInputElement).value)}
                placeholder="Pure Silk"
              />
            </div>
          </div>
          <div class="two-col">
            <div class="field">
              <label>Price (₹)</label>
              <input
                inputmode="decimal"
                .value=${f.price}
                @input=${(e: Event) => this.setField('price', (e.target as HTMLInputElement).value)}
                placeholder="5999"
              />
            </div>
            <div class="field">
              <label>MRP (₹) (optional)</label>
              <input
                inputmode="decimal"
                .value=${f.mrp}
                @input=${(e: Event) => this.setField('mrp', (e.target as HTMLInputElement).value)}
                placeholder="8999"
              />
            </div>
          </div>
          <div class="field">
            <label>Description</label>
            <textarea
              .value=${f.description}
              @input=${(e: Event) => this.setField('description', (e.target as HTMLTextAreaElement).value)}
              placeholder="Optional"
            ></textarea>
          </div>
          <div class="two-col">
            <div class="field">
              <label>Rating (0–5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                .value=${f.rating}
                @input=${(e: Event) => this.setField('rating', (e.target as HTMLInputElement).value)}
              />
            </div>
            <div class="field">
              <label>Reviews</label>
              <input
                type="number"
                min="0"
                step="1"
                .value=${f.reviews}
                @input=${(e: Event) => this.setField('reviews', (e.target as HTMLInputElement).value)}
              />
            </div>
          </div>
          <div class="two-col">
            <div class="field">
              <label>Badge</label>
              <select
                .value=${f.badge}
                @change=${(e: Event) => this.setField('badge', (e.target as HTMLSelectElement).value)}
              >
                ${BADGE_OPTIONS.map(
                  (b) => html`<option value=${b} ?selected=${f.badge === b}>${b || 'None'}</option>`
                )}
              </select>
            </div>
            <div class="field">
              <label>Container Background</label>
              <input
                type="color"
                .value=${f.hexColor}
                @input=${(e: Event) => this.setField('hexColor', (e.target as HTMLInputElement).value)}
              />
            </div>
          </div>
          <div class="field">
            <label>Product Colour</label>
            <input
              type="text"
              .value=${f.productColor}
              @input=${(e: Event) => this.setField('productColor', (e.target as HTMLInputElement).value)}
              placeholder="e.g. blue, green, maroon"
            />
          </div>
          <div class="field">
            <label>Care Instructions (one per line)</label>
            <textarea
              .value=${f.care}
              @input=${(e: Event) => this.setField('care', (e.target as HTMLTextAreaElement).value)}
            ></textarea>
          </div>
          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${f.blousePieceIncluded}
                @change=${(e: Event) => this.setBlousePieceIncluded((e.target as HTMLInputElement).checked)}
              />
              Blouse Piece Included
            </label>
          </div>
          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${f.deliveryAvailable}
                @change=${(e: Event) => this.setDeliveryAvailable((e.target as HTMLInputElement).checked)}
              />
              Delivery Available
            </label>
          </div>
          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${f.soldOut}
                @change=${(e: Event) => this.setSoldOut((e.target as HTMLInputElement).checked)}
              />
              Sold Out
            </label>
          </div>
          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input
                type="checkbox"
                .checked=${!f.isListed}
                @change=${(e: Event) => this.setDisableListing((e.target as HTMLInputElement).checked)}
              />
              Disable Listing (hide from storefront)
            </label>
          </div>
          <div class="field">
            <label>Images ${this.images.length ? `(${this.images.length} selected)` : ''}</label>
            <div class="gallery-picker">
              ${this.images.map(
                (img, i) => html`
                  <div class="thumb ${i === 0 ? 'is-cover' : ''}">
                    <img src=${img.url} alt="" />
                    ${i === 0 ? html`<span class="cover-tag">Cover</span>` : nothing}
                    <button
                      type="button"
                      class="thumb-remove"
                      aria-label="Remove image"
                      @click=${() => this.removeImage(i)}
                    >
                      ✕
                    </button>
                  </div>
                `
              )}
              <button type="button" class="thumb-add" aria-label="Add image" @click=${() => this.openFilePicker()}>
                +
              </button>
            </div>
            <input
              id="gallery-input"
              type="file"
              accept="image/*"
              multiple
              style="display:none"
              @change=${(e: Event) => this.onFilesSelected(e)}
            />
          </div>
          ${this.saveError ? html`<p class="error">${this.saveError}</p>` : nothing}
          <div class="actions">
            <button class="ghost" type="button" @click=${() => history.back()}>Cancel</button>
            <button class="primary" type="submit" ?disabled=${this.saving}>
              ${this.saving ? 'Adding…' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
      <success-dialog
        .open=${!!this.successMessage}
        heading="Product Added"
        .message=${this.successMessage}
        @close=${() => (location.hash = '#/account')}
      ></success-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'product-add-view': ProductAddView;
  }
}
