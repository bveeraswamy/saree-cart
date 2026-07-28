export interface ColorOption {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  productCode?: string | null;
  name: string;
  category: string;
  fabric: string;
  price: number;
  mrp: number | null;
  rating: number;
  reviews: number;
  badge?: 'New' | 'Bestseller' | 'Sale' | 'Limited';
  colors: ColorOption[];
  containerColor: string;
  description: string;
  care: string[];
  blousePieceIncluded: boolean;
  soldOut?: boolean;
  image?: string | null;
  gallery: string[];
}

// Product data now lives in saree-ecart-backend (catalog app) and is
// fetched via src/state/catalog-store.ts. The original demo catalog was
// ported into catalog/management/commands/seed_products.py.
