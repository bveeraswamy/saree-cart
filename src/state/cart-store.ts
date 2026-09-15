import type { Product } from '../data/products';

const STORAGE_KEY = 'RAGA Boutique:cart';

type CartData = Record<string, number>;

export interface CartLine {
  productCode: string;
  quantity: number;
}

// Each product code currently represents one physical, one-of-a-kind
// saree — not a stock count — so a customer can only ever have exactly
// one of it in the cart. Raising this (once the catalog supports several
// identical sarees under one code) is meant to be exactly this one line.
const MAX_QUANTITY_PER_PRODUCT = 1;

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

  // Adds `delta` (default 1) units of a product, clamped to
  // [0, MAX_QUANTITY_PER_PRODUCT] — so with today's one-of-a-kind-per-code
  // catalog, calling this again once a product is already in the cart is a
  // harmless no-op rather than piling up a quantity that could never
  // actually be fulfilled.
  add(productCode: string, delta = 1) {
    this.setQuantity(productCode, (this.items.get(productCode) ?? 0) + delta);
  }

  setQuantity(productCode: string, quantity: number) {
    const clamped = Math.min(quantity, MAX_QUANTITY_PER_PRODUCT);
    if (clamped <= 0) {
      this.items.delete(productCode);
    } else {
      this.items.set(productCode, clamped);
    }
    this.persist();
  }

  remove(productCode: string) {
    this.items.delete(productCode);
    this.persist();
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
