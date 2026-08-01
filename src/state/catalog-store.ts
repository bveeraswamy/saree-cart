import type { Product } from '../data/products';
import { listProducts, type InventoryProduct } from '../api/catalog-api';

export interface CategoryOption {
  id: string;
  label: string;
}

function capitalize(word: string): string {
  return word ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

function mapProduct(p: InventoryProduct): Product {
  return {
    id: String(p.id),
    productCode: p.productCode,
    name: p.name,
    category: p.category,
    fabric: p.fabric,
    price: Number(p.price),
    mrp: p.mrp != null ? Number(p.mrp) : null,
    rating: Number(p.rating),
    reviews: p.reviews,
    badge: (p.badge || undefined) as Product['badge'],
    colors: [{ name: capitalize(p.productColor), hex: p.productColor }],
    containerColor: p.hexColor,
    description: p.description,
    care: p.care,
    blousePieceIncluded: p.blousePieceIncluded,
    deliveryAvailable: p.deliveryAvailable,
    soldOut: p.soldOut,
    image: p.image,
    gallery: p.gallery.map((img) => img.url),
  };
}

class CatalogStore extends EventTarget {
  private _products: Product[] = [];
  private _loading = false;
  private _error = '';
  private _loaded = false;
  private _loadPromise: Promise<void> | null = null;

  get products(): Product[] {
    return this._products;
  }

  get loading(): boolean {
    return this._loading;
  }

  get error(): string {
    return this._error;
  }

  get loaded(): boolean {
    return this._loaded;
  }

  get categories(): CategoryOption[] {
    const seen = new Map<string, string>();
    for (const p of this._products) {
      const raw = p.category.trim();
      if (!raw) continue;
      const id = raw.toLowerCase();
      if (!seen.has(id)) seen.set(id, raw);
    }
    return [...seen.entries()]
      .map(([id, raw]) => ({ id, label: capitalize(raw) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  categoryLabel(id: string): string {
    return this.categories.find((c) => c.id === id)?.label ?? id;
  }

  load(): Promise<void> {
    if (this._loaded || this._loading) return this._loadPromise ?? Promise.resolve();
    return this.fetchNow();
  }

  refresh(): Promise<void> {
    return this.fetchNow();
  }

  // Used only when the live API is unreachable; loads the last catalog
  // snapshot admins exported via the "Export Catalog JSON" dev tool.
  private async loadFallback(): Promise<boolean> {
    try {
      const res = await fetch('/catalog-fallback.json');
      if (!res.ok) return false;
      const items = (await res.json()) as InventoryProduct[];
      if (!Array.isArray(items) || !items.length) return false;
      this._products = items.map(mapProduct);
      this._loaded = true;
      this._error = 'Showing saved catalog data — live server is unreachable.';
      return true;
    } catch {
      return false;
    }
  }

  private fetchNow(): Promise<void> {
    this._loading = true;
    this._error = '';
    this.dispatchEvent(new Event('change'));
    this._loadPromise = listProducts()
      .then((items) => {
        this._products = items.map(mapProduct);
        this._loaded = true;
      })
      .catch(async (err) => {
        const fallback = await this.loadFallback();
        if (fallback) return;
        this._error = err instanceof Error ? err.message : 'Could not load products.';
      })
      .finally(() => {
        this._loading = false;
        this.dispatchEvent(new Event('change'));
      });
    return this._loadPromise;
  }
}

export const catalogStore = new CatalogStore();
