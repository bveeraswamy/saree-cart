const STORAGE_KEY = 'RAGA Boutique:wishlist';

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

class WishlistStore extends EventTarget {
  private ids: Set<string> = load();

  get all(): string[] {
    return [...this.ids];
  }

  get count(): number {
    return this.ids.size;
  }

  has(productId: string): boolean {
    return this.ids.has(productId);
  }

  toggle(productId: string) {
    if (this.ids.has(productId)) {
      this.ids.delete(productId);
    } else {
      this.ids.add(productId);
    }
    this.persist();
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.ids]));
    this.dispatchEvent(new Event('change'));
  }
}

export const wishlistStore = new WishlistStore();
