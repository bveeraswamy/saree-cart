import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { authStore } from '../state/auth-store';
import { catalogStore } from '../state/catalog-store';
import { getProduct, updateProduct, type InventoryProduct } from '../api/catalog-api';
import { AuthApiError } from '../api/auth-api';
import { sharedStyles } from '../styles/shared-styles';

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

interface GalleryItem {
  // For 'existing' items this is 'cover' or the gallery image id (as a
  // string); the backend uses this same token to know which stored images
  // survive and what order they're in. 'new' items carry no token — they're
  // uploaded fresh and appended after whatever existing images remain.
  token: string;
  kind: 'existing' | 'new';
  url: string;
  file?: File;
}

@customElement('product-edit-view')
export class ProductEditView extends LitElement {
  @property() productId = '';

  @state() private product: InventoryProduct | null = null;
  @state() private loading = true;
  @state() private error = '';

  @state() private editing = false;
  @state() private form = { ...EMPTY_FORM };
  @state() private galleryItems: GalleryItem[] = [];
  @state() private replaceIndex: number | null = null;
  @state() private saving = false;
  @state() private saveError = '';

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
      .name {
        font: 700 16px var(--sans);
        color: var(--text);
        margin: 0 0 2px;
      }
      .sub {
        font-size: 12.5px;
        color: var(--text-faint);
        margin: 0 0 16px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: var(--text-dim);
        padding: 10px 0;
        border-top: 1px solid var(--border);
      }
      .row:first-of-type {
        border-top: none;
      }
      .desc {
        font-size: 13px;
        color: var(--text-dim);
        line-height: 1.6;
        padding-top: 10px;
        border-top: 1px solid var(--border);
        margin-top: 4px;
      }
      .actions {
        margin-top: 18px;
        display: flex;
        gap: 10px;
      }
      .actions button {
        flex: 1;
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
      .preview-wrap {
        position: relative;
        width: 100%;
        max-width: 200px;
        margin-bottom: 10px;
      }
      .preview {
        display: block;
        width: 100%;
        aspect-ratio: 3 / 4;
        object-fit: cover;
        border-radius: var(--radius-sm);
        background: var(--bg-sunken);
      }
      .preview-wrap .cover-tag {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        font: 700 10px var(--sans);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        text-align: center;
        padding: 4px 0;
        background: var(--accent);
        color: var(--accent-contrast);
        border-radius: 0 0 var(--radius-sm) var(--radius-sm);
      }
      .missing {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-faint);
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
      .status-tag {
        display: inline-block;
        font: 700 11px var(--sans);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        padding: 3px 8px;
        border-radius: 5px;
        background: var(--bg-sunken);
        color: var(--text-dim);
        margin-bottom: 10px;
      }
      .status-tag.sold-out {
        background: rgba(0, 0, 0, 0.75);
        color: #fff;
      }
      .status-tag.unlisted {
        background: var(--accent);
        color: var(--accent-contrast);
        margin-left: 6px;
      }
      .colour-value {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .colour-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1px solid var(--border);
        display: inline-block;
      }
      .care-title {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-faint);
        margin: 16px 0 8px;
      }
      .care-list {
        margin: 0;
        padding-left: 18px;
        font-size: 13px;
        color: var(--text-dim);
        line-height: 1.7;
      }
      .gallery-preview {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }
      .gallery-preview img {
        width: 56px;
        height: 56px;
        object-fit: cover;
        border-radius: var(--radius-sm);
        background: var(--bg-sunken);
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
        cursor: pointer;
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
      .thumb-replace {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font: 700 10px var(--sans);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: #fff;
        background: rgba(0, 0, 0, 0.55);
        opacity: 0;
        transition: opacity 0.15s ease;
      }
      .thumb:hover .thumb-replace {
        opacity: 1;
      }
      .thumb .cover-tag {
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

  willUpdate(changed: Map<string, unknown>) {
    if (changed.has('productId') && this.productId) {
      this.load();
    }
  }

  private async load() {
    this.loading = true;
    this.error = '';
    this.editing = false;
    try {
      this.product = await getProduct(this.productId, authStore.user?.token);
    } catch (err) {
      this.error = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    } finally {
      this.loading = false;
    }
  }

  private startEdit() {
    if (!this.product) return;
    const p = this.product;
    this.form = {
      productCode: p.productCode ?? '',
      name: p.name,
      category: p.category,
      fabric: p.fabric,
      price: p.price,
      mrp: p.mrp ?? '',
      description: p.description,
      soldOut: p.soldOut,
      isListed: p.isListed,
      rating: p.rating,
      reviews: String(p.reviews),
      badge: p.badge,
      blousePieceIncluded: p.blousePieceIncluded,
      deliveryAvailable: p.deliveryAvailable,
      hexColor: p.hexColor,
      productColor: p.productColor,
      care: p.care.join('\n'),
    };
    this.revokeNewImageUrls();
    this.galleryItems = [
      ...(p.image ? [{ token: 'cover', kind: 'existing' as const, url: p.image }] : []),
      ...p.gallery.map((img) => ({ token: String(img.id), kind: 'existing' as const, url: img.url })),
    ];
    this.saveError = '';
    this.editing = true;
  }

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
    this.replaceIndex = null;
    this.renderRoot.querySelector<HTMLInputElement>('#gallery-input')?.click();
  }

  private openReplacePicker(index: number) {
    this.replaceIndex = index;
    this.renderRoot.querySelector<HTMLInputElement>('#gallery-input')?.click();
  }

  private onFilesSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (this.replaceIndex !== null) {
      const index = this.replaceIndex;
      this.replaceIndex = null;
      const file = files[0];
      if (!file) return;
      const replaced = this.galleryItems[index];
      if (replaced?.kind === 'new') URL.revokeObjectURL(replaced.url);
      const next = [...this.galleryItems];
      next[index] = { token: '', kind: 'new', url: URL.createObjectURL(file), file };
      this.galleryItems = next;
      input.value = '';
      return;
    }
    const added: GalleryItem[] = files.map((file) => ({
      token: '',
      kind: 'new',
      url: URL.createObjectURL(file),
      file,
    }));
    this.galleryItems = [...this.galleryItems, ...added];
    input.value = '';
  }

  private removeGalleryItem(index: number) {
    const removed = this.galleryItems[index];
    if (removed?.kind === 'new') URL.revokeObjectURL(removed.url);
    this.galleryItems = this.galleryItems.filter((_, i) => i !== index);
  }

  private revokeNewImageUrls() {
    this.galleryItems.filter((img) => img.kind === 'new').forEach((img) => URL.revokeObjectURL(img.url));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.revokeNewImageUrls();
  }

  private async onSave(e: Event) {
    e.preventDefault();
    const admin = authStore.user;
    const f = this.form;
    if (!admin || this.saving) return;
    if (
      !f.productCode.trim() ||
      !f.name.trim() ||
      !f.category.trim() ||
      !f.fabric.trim() ||
      !f.price.trim()
    )
      return;

    this.saving = true;
    this.saveError = '';
    try {
      const payload = {
        ...f,
        care: JSON.stringify(
          f.care
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        ),
      };
      const existingOrder = this.galleryItems.filter((img) => img.kind === 'existing').map((img) => img.token);
      const newFiles = this.galleryItems
        .filter((img): img is GalleryItem & { file: File } => img.kind === 'new' && !!img.file)
        .map((img) => img.file);
      this.product = await updateProduct(admin.token, this.productId, payload, existingOrder, newFiles);
      this.revokeNewImageUrls();
      this.galleryItems = [];
      this.editing = false;
      catalogStore.refresh();
    } catch (err) {
      this.saveError = err instanceof AuthApiError ? err.message : 'Could not reach the server.';
    } finally {
      this.saving = false;
    }
  }

  render() {
    const admin = authStore.user;
    if (!admin || (admin.role !== 'Site Admin' && admin.role !== 'Power User')) {
      return html`<div class="missing"><p>You don't have access to this page.</p></div>`;
    }

    if (this.loading) {
      return html`<div class="card"><p>Loading…</p></div>`;
    }

    if (!this.product) {
      return html`<div class="card"><p class="error">${this.error || 'Product not found.'}</p></div>`;
    }

    const p = this.product;
    const f = this.form;

    if (this.editing) {
      return html`
        <div class="card">
          <form @submit=${this.onSave}>
            <div class="field">
              <label>Product Code</label>
              <input
                .value=${f.productCode}
                @input=${(e: Event) => this.setField('productCode', (e.target as HTMLInputElement).value)}
              />
            </div>
            <div class="field">
              <label>Name</label>
              <input
                .value=${f.name}
                @input=${(e: Event) => this.setField('name', (e.target as HTMLInputElement).value)}
              />
            </div>
            <div class="two-col">
              <div class="field">
                <label>Category</label>
                <input
                  .value=${f.category}
                  @input=${(e: Event) => this.setField('category', (e.target as HTMLInputElement).value)}
                />
              </div>
              <div class="field">
                <label>Fabric</label>
                <input
                  .value=${f.fabric}
                  @input=${(e: Event) => this.setField('fabric', (e.target as HTMLInputElement).value)}
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
                />
              </div>
              <div class="field">
                <label>MRP (₹) (optional)</label>
                <input
                  inputmode="decimal"
                  .value=${f.mrp}
                  @input=${(e: Event) => this.setField('mrp', (e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
            <div class="field">
              <label>Description</label>
              <textarea
                .value=${f.description}
                @input=${(e: Event) => this.setField('description', (e.target as HTMLTextAreaElement).value)}
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
                  @change=${(e: Event) =>
                    this.setDeliveryAvailable((e.target as HTMLInputElement).checked)}
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
              <label>Images ${this.galleryItems.length ? `(${this.galleryItems.length} selected)` : ''}</label>
              <div class="gallery-picker">
                ${this.galleryItems.map(
                  (img, i) => html`
                    <div
                      class="thumb ${i === 0 ? 'is-cover' : ''}"
                      title="Click to replace image"
                      @click=${() => this.openReplacePicker(i)}
                    >
                      <img src=${img.url} alt="" />
                      <span class="thumb-replace">Replace</span>
                      ${i === 0 ? html`<span class="cover-tag">Cover</span>` : nothing}
                      <button
                        type="button"
                        class="thumb-remove"
                        aria-label="Remove image"
                        @click=${(e: Event) => {
                          e.stopPropagation();
                          this.removeGalleryItem(i);
                        }}
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
              <button class="ghost" type="button" @click=${() => (this.editing = false)}>Cancel</button>
              <button class="primary" type="submit" ?disabled=${this.saving}>
                ${this.saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      `;
    }

    return html`
      <div class="card">
        ${p.image
          ? html`
              <div class="preview-wrap">
                <img class="preview" src=${p.image} alt=${p.name} />
                <span class="cover-tag">Cover</span>
              </div>
            `
          : nothing}
        ${p.gallery.length
          ? html`
              <div class="gallery-preview">
                ${p.gallery.map((img) => html`<img src=${img.url} alt="" />`)}
              </div>
            `
          : nothing}
        ${p.soldOut ? html`<span class="status-tag sold-out">Sold Out</span>` : nothing}
        ${!p.isListed ? html`<span class="status-tag unlisted">Hidden from Storefront</span>` : nothing}
        <p class="name">${p.name}</p>
        <p class="sub">${p.productCode ? `${p.productCode} · ` : ''}${p.category} · ${p.fabric}</p>

        <div class="row"><span>Price</span><span>₹${Number(p.price).toLocaleString('en-IN')}</span></div>
        ${p.mrp
          ? html`<div class="row"><span>MRP</span><span>₹${Number(p.mrp).toLocaleString('en-IN')}</span></div>`
          : nothing}
        <div class="row"><span>Rating</span><span>${Number(p.rating).toFixed(1)} ★ (${p.reviews})</span></div>
        ${p.badge ? html`<div class="row"><span>Badge</span><span>${p.badge}</span></div>` : nothing}
        <div class="row">
          <span>Blouse Piece</span><span>${p.blousePieceIncluded ? 'Included' : 'Not included'}</span>
        </div>
        <div class="row">
          <span>Delivery</span><span>${p.deliveryAvailable ? 'Available' : 'Not available'}</span>
        </div>
        <div class="row">
          <span>Container Background</span>
          <span class="colour-value">
            <span class="colour-dot" style="background:${p.hexColor}"></span>${p.hexColor}
          </span>
        </div>
        <div class="row">
          <span>Product Colour</span>
          <span class="colour-value">
            <span class="colour-dot" style="background:${p.productColor}"></span>${p.productColor}
          </span>
        </div>

        ${p.description ? html`<p class="desc">${p.description}</p>` : nothing}

        ${p.care.length
          ? html`
              <h3 class="care-title">Care Instructions</h3>
              <ul class="care-list">
                ${p.care.map((c) => html`<li>${c}</li>`)}
              </ul>
            `
          : nothing}

        <div class="actions">
          <button class="primary" @click=${this.startEdit}>Edit</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'product-edit-view': ProductEditView;
  }
}
