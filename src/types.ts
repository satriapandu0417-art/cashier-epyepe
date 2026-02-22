export type Category = 'Coffee' | 'Tea' | 'Food' | 'Dessert' | 'Other';

export interface BundleConfig {
  enabled: boolean;
  buyQuantity: number;
  bundlePrice: number;
  showPromoLabel: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  basePrice: number;
  category: Category;
  image?: string;
  bundle?: BundleConfig;
}

export interface CartItem extends MenuItem {
  quantity: number;
  note?: string;
  isPrepared?: boolean;
}

export type OrderStatus = 'Pending' | 'Paid' | 'Completed' | 'Cancelled' | 'Preparing' | 'Picked Up';

export interface Order {
  id: string;
  customerName: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: 'Paid' | 'Unpaid';
  createdAt: string;
  note?: string;
}
