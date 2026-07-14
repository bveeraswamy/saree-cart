import { PRODUCTS } from '../data/products';

export interface CartLine {
  productId: string;
  colorName: string;
  qty: number;
}

const STORAGE_KEY = 'RAGA Boutique:cart';

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

class CartStore extends EventTarget {
  private _lines: CartLine[] = load();

  get lines(): CartLine[] {
    return this._lines;
  }

  get count(): number {
    return this._lines.reduce((sum, l) => sum + l.qty, 0);
  }

  get subtotal(): number {
    return this._lines.reduce((sum, l) => {
      const product = PRODUCTS.find((p) => p.id === l.productId);
      return sum + (product ? product.price * l.qty : 0);
    }, 0);
  }

  get mrpTotal(): number {
    return this._lines.reduce((sum, l) => {
      const product = PRODUCTS.find((p) => p.id === l.productId);
      return sum + (product ? product.mrp * l.qty : 0);
    }, 0);
  }

  add(productId: string, colorName: string, qty = 1) {
    const existing = this._lines.find(
      (l) => l.productId === productId && l.colorName === colorName
    );
    if (existing) {
      existing.qty += qty;
    } else {
      this._lines = [...this._lines, { productId, colorName, qty }];
    }
    this.persist();
  }

  setQty(productId: string, colorName: string, qty: number) {
    if (qty <= 0) {
      this.remove(productId, colorName);
      return;
    }
    this._lines = this._lines.map((l) =>
      l.productId === productId && l.colorName === colorName ? { ...l, qty } : l
    );
    this.persist();
  }

  remove(productId: string, colorName: string) {
    this._lines = this._lines.filter(
      (l) => !(l.productId === productId && l.colorName === colorName)
    );
    this.persist();
  }

  clear() {
    this._lines = [];
    this.persist();
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._lines));
    this.dispatchEvent(new Event('change'));
  }
}

export const cartStore = new CartStore();
