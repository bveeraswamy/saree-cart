export interface Category {
  id: string;
  label: string;
  icon: string;
}

export const CATEGORIES: Category[] = [
  { id: 'kanjivaram', label: 'Kanjivaram Silk', icon: '🟡' },
  { id: 'banarasi', label: 'Banarasi Silk', icon: '🔶' },
  { id: 'cotton', label: 'Cotton', icon: '🌿' },
  { id: 'chiffon', label: 'Chiffon', icon: '🎀' },
  { id: 'georgette', label: 'Georgette', icon: '✨' },
  { id: 'linen', label: 'Linen', icon: '🍃' },
  { id: 'wedding', label: 'Wedding Edit', icon: '💍' },
  { id: 'printed', label: 'Printed', icon: '🌸' },
];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
