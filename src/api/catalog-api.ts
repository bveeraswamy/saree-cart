import { AuthApiError } from './auth-api';
import { API_BASE } from './config';

export interface GalleryImage {
  id: number;
  url: string;
}

export interface InventoryProduct {
  id: number;
  productCode: string | null;
  name: string;
  category: string;
  fabric: string;
  price: string;
  mrp: string | null;
  description: string;
  rating: string;
  reviews: number;
  badge: string;
  blousePieceIncluded: boolean;
  deliveryAvailable: boolean;
  soldOut: boolean;
  isListed: boolean;
  hexColor: string;
  productColor: string;
  care: string[];
  image: string | null;
  gallery: GalleryImage[];
  createdAt: string;
}

export interface NewProductInput {
  productCode: string;
  name: string;
  category: string;
  fabric: string;
  price: string;
  mrp: string;
  description: string;
  soldOut?: boolean;
  isListed?: boolean;
  rating?: string;
  reviews?: string;
  badge?: string;
  blousePieceIncluded?: boolean;
  deliveryAvailable?: boolean;
  hexColor?: string;
  productColor?: string;
  care?: string;
}

function toUpdateFormData(input: NewProductInput, existingOrder: string[], newImages: File[]): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(input)) {
    formData.append(key, typeof value === 'boolean' ? String(value) : value);
  }
  formData.append('existingOrder', JSON.stringify(existingOrder));
  for (const file of newImages) {
    formData.append('images', file);
  }
  return formData;
}

function toCreateFormData(input: NewProductInput, images: File[]): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(input)) {
    formData.append(key, typeof value === 'boolean' ? String(value) : value);
  }
  for (const file of images) {
    formData.append('images', file);
  }
  return formData;
}

export async function listProducts(token?: string): Promise<InventoryProduct[]> {
  const res = await fetch(`${API_BASE}/api/catalog/products/`, {
    headers: token ? { Authorization: `Token ${token}` } : {},
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthApiError(body.detail ?? 'Could not load products.');
  }
  return body as InventoryProduct[];
}

export async function createProduct(
  token: string,
  input: NewProductInput,
  images: File[] = []
): Promise<InventoryProduct> {
  const res = await fetch(`${API_BASE}/api/catalog/products/`, {
    method: 'POST',
    headers: { Authorization: `Token ${token}` },
    body: toCreateFormData(input, images),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errors = body.errors as Record<string, string> | undefined;
    const message = errors ? Object.values(errors).join(' ') : 'Could not add product.';
    throw new AuthApiError(message);
  }
  return body as InventoryProduct;
}

export async function deleteProduct(token: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/catalog/products/${id}/`, {
    method: 'DELETE',
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new AuthApiError(body.detail ?? 'Could not remove product.');
  }
}

export async function getProduct(id: number | string, token?: string): Promise<InventoryProduct> {
  const res = await fetch(`${API_BASE}/api/catalog/products/${id}/`, {
    headers: token ? { Authorization: `Token ${token}` } : {},
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthApiError(body.detail ?? 'Could not load this product.');
  }
  return body as InventoryProduct;
}

export async function updateProduct(
  token: string,
  id: number | string,
  input: NewProductInput,
  existingOrder: string[],
  newImages: File[] = []
): Promise<InventoryProduct> {
  const res = await fetch(`${API_BASE}/api/catalog/products/${id}/`, {
    method: 'PATCH',
    headers: { Authorization: `Token ${token}` },
    body: toUpdateFormData(input, existingOrder, newImages),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errors = body.errors as Record<string, string> | undefined;
    const message = errors ? Object.values(errors).join(' ') : 'Could not save changes.';
    throw new AuthApiError(message);
  }
  return body as InventoryProduct;
}
