import type { Product } from '../data/products';

const STORAGE_KEY = 'RAGA Boutique:cart';

type CartData = Record<string, number>;

export interface CartLine {
  productCode: string;
  quantity: number;
}

// Cart lines are keyed by product code, not database id — the backend
// already enforces unique codes for every real product, so this is the
// stable, human-meaningful identity for "the same saree", and guarantees
// the cart can never show two lines for one code even if a data slip ever
// produced two rows sharing it. Falls back to id only for the (invalid,
// shouldn't happen) case of a product with no code at all.
export function cartKey(product: Pick<Product, 'id' | 'productCode'>): string {
  return product.productCode?.trim() || product.id;
}

function load(): Map<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartData) : {};
    return new Map(Object.entries(parsed).filter(([, qty]) => Number.isFinite(qty) && qty > 0));
  } catch {
    return new Map();
  }
}

class CartStore extends EventTarget {
  private items: Map<string, number> = load();

  get lines(): CartLine[] {
    return [...this.items.entries()].map(([productCode, quantity]) => ({ productCode, quantity }));
  }

  get count(): number {
    let total = 0;
    for (const qty of this.items.values()) total += qty;
    return total;
  }

  quantityOf(productCode: string): number {
    return this.items.get(productCode) ?? 0;
  }

  has(productCode: string): boolean {
    return this.items.has(productCode);
  }

  // Adds `delta` (default 1) units of a product, clamping at 0 (never goes
  // negative — use setQuantity(code, 0) or remove() to clear a line outright).
  add(productCode: string, delta = 1) {
    this.setQuantity(productCode, (this.items.get(productCode) ?? 0) + delta);
  }

  setQuantity(productCode: string, quantity: number) {
    if (quantity <= 0) {
      this.items.delete(productCode);
    } else {
      this.items.set(productCode, quantity);
    }
    this.persist();
  }

  remove(productCode: string) {
    this.items.delete(productCode);
    this.persist();
  }

  // Drops any line whose code isn't in the current catalog — a product
  // deleted/delisted since it was added, or (one-time) a cart saved under
  // the old id-keyed scheme before this store switched to codes. Without
  // this, `count` keeps summing quantities that can never resolve to a
  // real product, so the badge shows a number the cart page can't back up.
  // Called once the real catalog has loaded (see app-shell.ts).
  reconcile(validCodes: Iterable<string>) {
    const valid = new Set(validCodes);
    let changed = false;
    for (const code of this.items.keys()) {
      if (!valid.has(code)) {
        this.items.delete(code);
        changed = true;
      }
    }
    if (changed) this.persist();
  }

  clear() {
    this.items.clear();
    this.persist();
  }

  private persist() {
    const obj: CartData = {};
    for (const [code, qty] of this.items) obj[code] = qty;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    this.dispatchEvent(new Event('change'));
  }
}

export const cartStore = new CartStore();
