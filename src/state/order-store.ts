export interface OrderSummary {
  id: string;
  itemCount: number;
  total: number;
  eta: string;
  email?: string;
}

let lastOrder: OrderSummary | null = null;

export function setLastOrder(order: OrderSummary) {
  lastOrder = order;
}

export function getOrder(id: string): OrderSummary | null {
  return lastOrder && lastOrder.id === id ? lastOrder : null;
}
