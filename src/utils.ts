import { MenuItem } from './types';

export const calculateItemTotal = (item: MenuItem, quantity: number): number => {
  if (!item.bundle?.enabled || !item.bundle.buyQuantity || !item.bundle.bundlePrice) {
    return item.basePrice * quantity;
  }

  const { buyQuantity, bundlePrice } = item.bundle;
  const bundleCount = Math.floor(quantity / buyQuantity);
  const remaining = quantity % buyQuantity;

  return (bundleCount * bundlePrice) + (remaining * item.basePrice);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
