const WHATSAPP_NUMBER = '919842577782';

// Plain contact details for desktop/web visitors who may not have WhatsApp
// linked in their browser (wa.me falls back to WhatsApp Web, which needs an
// already-paired session) — shown alongside the WhatsApp button so there's
// always a way to reach the boutique.
export const CONTACT_PHONE_DISPLAY = '+91 98425 77782';
export const CONTACT_PHONE_TEL = `tel:+${WHATSAPP_NUMBER}`;

export function whatsappOrderLink(
  productName: string,
  productCode: string | null | undefined,
  price: string | number
): string {
  const lines = [
    "Hi, I'd like to order this saree from RAGA Boutique:",
    productName,
    productCode ? `Product Code: ${productCode}` : '',
    `Price: ₹${price}`,
  ].filter(Boolean);
  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}

export interface CartOrderItem {
  name: string;
  productCode?: string | null;
  price: number;
  quantity: number;
}

export function whatsappCartOrderLink(items: CartOrderItem[], total: number): string {
  const lines = [
    "Hi, I'd like to order these sarees from RAGA Boutique:",
    '',
    ...items.map((item) => {
      const code = item.productCode ? ` (${item.productCode})` : '';
      const lineTotal = (item.price * item.quantity).toLocaleString('en-IN');
      return `• ${item.name}${code} x${item.quantity} — ₹${lineTotal}`;
    }),
    '',
    `Total: ₹${total.toLocaleString('en-IN')}`,
  ];
  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
