import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem, Order } from '../types';
import { generateId } from '../utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DEFAULT_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Espresso',
    basePrice: 25000,
    category: 'Coffee',
    bundle: { enabled: false, buyQuantity: 0, bundlePrice: 0, showPromoLabel: false }
  },
  {
    id: '2',
    name: 'Iced Latte',
    basePrice: 35000,
    category: 'Coffee',
    bundle: { enabled: true, buyQuantity: 2, bundlePrice: 60000, showPromoLabel: true }
  },
  {
    id: '3',
    name: 'Croissant',
    basePrice: 20000,
    category: 'Food',
    bundle: { enabled: true, buyQuantity: 3, bundlePrice: 50000, showPromoLabel: true }
  },
  {
    id: '4',
    name: 'Green Tea',
    basePrice: 30000,
    category: 'Tea',
    bundle: { enabled: false, buyQuantity: 0, bundlePrice: 0, showPromoLabel: false }
  }
];

interface StoreContextType {
  menu: MenuItem[];
  orders: Order[];
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  deleteOrder: (id: string) => void;
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => Order | Promise<Order | null>;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  updateOrderPaymentStatus: (id: string, paymentStatus: Order['paymentStatus']) => void;
  toggleOrderItemPrepared: (orderId: string, itemId: string) => void;
  isRealtime: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isRealtime, setIsRealtime] = useState(false);

  // Initial Load & Subscription
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      setIsRealtime(true);
      
      // Fetch initial data
      const fetchData = async () => {
        const { data: menuData } = await supabase.from('menu_items').select('*').order('created_at');
        const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        
        if (menuData) setMenu(menuData.map(mapDbMenuItem));
        if (ordersData) setOrders(ordersData.map(mapDbOrder));
      };
      
      fetchData();

      // Subscribe to changes
      const menuSub = supabase
        .channel('menu_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setMenu(prev => [...prev, mapDbMenuItem(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
            setMenu(prev => prev.map(item => item.id === payload.new.id ? mapDbMenuItem(payload.new) : item));
          } else if (payload.eventType === 'DELETE') {
            setMenu(prev => prev.filter(item => item.id !== payload.old.id));
          }
        })
        .subscribe();

      const ordersSub = supabase
        .channel('orders_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [mapDbOrder(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(order => order.id === payload.new.id ? mapDbOrder(payload.new) : order));
          }
        })
        .subscribe();

      return () => {
        menuSub.unsubscribe();
        ordersSub.unsubscribe();
      };
    } else {
      // Fallback to Local Storage
      const savedMenu = localStorage.getItem('pos_menu');
      const savedOrders = localStorage.getItem('pos_orders');
      setMenu(savedMenu ? JSON.parse(savedMenu) : DEFAULT_MENU);
      setOrders(savedOrders ? JSON.parse(savedOrders) : []);
    }
  }, []);

  // Sync to Local Storage (only if not realtime, or as backup)
  useEffect(() => {
    if (!isRealtime) {
      localStorage.setItem('pos_menu', JSON.stringify(menu));
    }
  }, [menu, isRealtime]);

  useEffect(() => {
    if (!isRealtime) {
      localStorage.setItem('pos_orders', JSON.stringify(orders));
    }
  }, [orders, isRealtime]);

  // Actions
  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    if (isRealtime && supabase) {
      const dbItem = {
        name: item.name,
        base_price: item.basePrice,
        category: item.category,
        bundle_config: item.bundle
      };
      await supabase.from('menu_items').insert(dbItem);
    } else {
      const newItem = { ...item, id: generateId() };
      setMenu(prev => [...prev, newItem]);
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    if (isRealtime && supabase) {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.basePrice) dbUpdates.base_price = updates.basePrice;
      if (updates.category) dbUpdates.category = updates.category;
      if (updates.bundle) dbUpdates.bundle_config = updates.bundle;
      
      await supabase.from('menu_items').update(dbUpdates).eq('id', id);
    } else {
      setMenu(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    }
  };

  const deleteMenuItem = async (id: string) => {
    if (isRealtime && supabase) {
      await supabase.from('menu_items').delete().eq('id', id);
    } else {
      setMenu(prev => prev.filter(item => item.id !== id));
    }
  };

  const deleteOrder = async (id: string) => {
    if (isRealtime && supabase) {
      await supabase.from('orders').delete().eq('id', id);
    } else {
      setOrders(prev => prev.filter(order => order.id !== id));
    }
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status'>) => {
    const newOrderLocal: Order = {
      ...orderData,
      items: orderData.items.map(item => ({ ...item, isPrepared: false })),
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: orderData.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
    };

    if (isRealtime && supabase) {
      const dbOrder = {
        customer_name: orderData.customerName,
        items: newOrderLocal.items,
        total: orderData.total,
        status: newOrderLocal.status,
        payment_status: orderData.paymentStatus,
        note: orderData.note
      };
      const { data, error } = await supabase.from('orders').insert(dbOrder).select().single();
      if (data) return mapDbOrder(data);
      return null;
    } else {
      setOrders(prev => [newOrderLocal, ...prev]);
      return newOrderLocal;
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    if (isRealtime && supabase) {
      await supabase.from('orders').update({ status }).eq('id', id);
    } else {
      setOrders(prev => prev.map(order => order.id === id ? { ...order, status } : order));
    }
  };

  const updateOrderPaymentStatus = async (id: string, paymentStatus: Order['paymentStatus']) => {
    if (isRealtime && supabase) {
      await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', id);
    } else {
      setOrders(prev => prev.map(order => order.id === id ? { ...order, paymentStatus } : order));
    }
  };

  const toggleOrderItemPrepared = async (orderId: string, itemId: string) => {
    // We need to find the order, update the item, calculate new status, then save.
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map(item =>
      item.id === itemId ? { ...item, isPrepared: !item.isPrepared } : item
    );

    const totalItems = updatedItems.length;
    const preparedCount = updatedItems.filter(i => i.isPrepared).length;

    let newStatus: Order['status'] = order.status;
    if (order.status !== 'Cancelled' && order.status !== 'Picked Up') {
      if (preparedCount === 0) {
         newStatus = 'Pending';
      } else if (preparedCount === totalItems) {
        newStatus = 'Completed';
      } else {
        newStatus = 'Preparing';
      }
    }

    if (isRealtime && supabase) {
      await supabase.from('orders').update({ 
        items: updatedItems,
        status: newStatus 
      }).eq('id', orderId);
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: updatedItems, status: newStatus } : o));
    }
  };

  return (
    <StoreContext.Provider value={{
      menu,
      orders,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      deleteOrder,
      createOrder,
      updateOrderStatus,
      updateOrderPaymentStatus,
      toggleOrderItemPrepared,
      isRealtime
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

// Helpers to map DB snake_case to App camelCase
function mapDbMenuItem(dbItem: any): MenuItem {
  return {
    id: dbItem.id,
    name: dbItem.name,
    basePrice: dbItem.base_price,
    category: dbItem.category,
    image: dbItem.image,
    bundle: dbItem.bundle_config
  };
}

function mapDbOrder(dbOrder: any): Order {
  return {
    id: dbOrder.id,
    customerName: dbOrder.customer_name,
    items: dbOrder.items,
    total: dbOrder.total,
    status: dbOrder.status,
    paymentStatus: dbOrder.payment_status,
    createdAt: dbOrder.created_at,
    note: dbOrder.note
  };
}
