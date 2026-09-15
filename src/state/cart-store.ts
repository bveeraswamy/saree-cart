const STORAGE_KEY = 'RAGA Boutique:cart';

type CartData = Record<string, number>;

export interface CartLine {
  productId: string;
  quantity: number;
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
    return [...this.items.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  }

  get count(): number {
    let total = 0;
    for (const qty of this.items.values()) total += qty;
    return total;
  }

  quantityOf(productId: string): number {
    return this.items.get(productId) ?? 0;
  }

  has(productId: string): boolean {
    return this.items.has(productId);
  }

  // Adds `delta` (default 1) units of a product, clamping at 0 (never goes
  // negative — use setQuantity(id, 0) or remove() to clear a line outright).
  add(productId: string, delta = 1) {
    this.setQuantity(productId, (this.items.get(productId) ?? 0) + delta);
  }

  setQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.items.delete(productId);
    } else {
      this.items.set(productId, quantity);
    }
    this.persist();
  }

  remove(productId: string) {
    this.items.delete(productId);
    this.persist();
  }

  clear() {
    this.items.clear();
    this.persist();
  }

  private persist() {
    const obj: CartData = {};
    for (const [id, qty] of this.items) obj[id] = qty;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    this.dispatchEvent(new Event('change'));
  }
}

export const cartStore = new CartStore();
