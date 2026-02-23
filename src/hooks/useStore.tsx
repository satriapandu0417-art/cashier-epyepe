import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MenuItem, Order } from '../types';
import { generateId } from '../utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from 'sonner';
import { playNotificationSound } from '../utils/sounds';

const DEFAULT_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'Espresso',
    basePrice: 25000,
    category: 'Coffee',
    bundle: { enabled: false, buyQuantity: 0, bundlePrice: 0, showPromoLabel: false },
    stock: 50,
    minStock: 10
  },
  {
    id: '2',
    name: 'Iced Latte',
    basePrice: 35000,
    category: 'Coffee',
    bundle: { enabled: true, buyQuantity: 2, bundlePrice: 60000, showPromoLabel: true },
    stock: 30,
    minStock: 5
  },
  {
    id: '3',
    name: 'Croissant',
    basePrice: 20000,
    category: 'Food',
    bundle: { enabled: true, buyQuantity: 3, bundlePrice: 50000, showPromoLabel: true },
    stock: 20,
    minStock: 5
  },
  {
    id: '4',
    name: 'Green Tea',
    basePrice: 30000,
    category: 'Tea',
    bundle: { enabled: false, buyQuantity: 0, bundlePrice: 0, showPromoLabel: false },
    stock: 40,
    minStock: 10
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
  updateOrder: (id: string, updates: Partial<Order>) => Promise<boolean>;
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
    try {
      if (isRealtime && supabase) {
        const dbItem = {
          name: item.name,
          base_price: item.basePrice,
          category: item.category,
          bundle_config: item.bundle,
          stock: item.stock,
          min_stock: item.minStock
        };
        const { error } = await supabase.from('menu_items').insert(dbItem);
        if (error) throw error;
      } else {
        const newItem = { ...item, id: generateId() };
        setMenu(prev => [...prev, newItem]);
      }
      toast.success(`Menu item "${item.name}" added successfully`);
      playNotificationSound('success');
    } catch (error: any) {
      console.error('Error adding menu item:', error);
      toast.error(`Failed to add menu item: ${error.message || 'Unknown error'}`);
      playNotificationSound('error');
    }
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      if (isRealtime && supabase) {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.basePrice) dbUpdates.base_price = updates.basePrice;
        if (updates.category) dbUpdates.category = updates.category;
        if (updates.bundle) dbUpdates.bundle_config = updates.bundle;
        if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
        if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
        
        const { error } = await supabase.from('menu_items').update(dbUpdates).eq('id', id);
        if (error) throw error;
      } else {
        setMenu(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      }
      toast.success('Menu item updated successfully');
      playNotificationSound('success');
    } catch (error: any) {
      console.error('Error updating menu item:', error);
      toast.error(`Failed to update menu item: ${error.message || 'Unknown error'}`);
      playNotificationSound('error');
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      if (isRealtime && supabase) {
        const { error } = await supabase.from('menu_items').delete().eq('id', id);
        if (error) throw error;
      } else {
        setMenu(prev => prev.filter(item => item.id !== id));
      }
      toast.success('Menu item deleted successfully');
      playNotificationSound('success');
    } catch (error: any) {
      console.error('Error deleting menu item:', error);
      toast.error(`Failed to delete menu item: ${error.message || 'Unknown error'}`);
      playNotificationSound('error');
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      if (isRealtime && supabase) {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (error) throw error;
      } else {
        setOrders(prev => prev.filter(order => order.id !== id));
      }
      toast.success('Order deleted successfully');
      playNotificationSound('success');
    } catch (error: any) {
      console.error('Error deleting order:', error);
      toast.error(`Failed to delete order: ${error.message || 'Unknown error'}`);
      playNotificationSound('error');
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
      
      if (error) {
        console.error('Error creating order:', error);
        toast.error(`Failed to create order: ${error.message}`);
        playNotificationSound('error');
        return null;
      }

      if (data) {
        // Insert into order_items table for relational consistency
        const itemsToInsert = newOrderLocal.items.map(item => ({
          order_id: data.id,
          menu_item_id: item.id,
          name: item.name,
          quantity: item.quantity,
          base_price: item.basePrice,
          is_prepared: false,
          note: item.note
        }));
        await supabase.from('order_items').insert(itemsToInsert);

        // Update stock in DB
        for (const item of orderData.items) {
          const menuItem = menu.find(m => m.id === item.id);
          if (menuItem && menuItem.stock !== undefined) {
            await supabase.from('menu_items')
              .update({ stock: menuItem.stock - item.quantity })
              .eq('id', item.id);
          }
        }

        toast.success('Order created successfully');
        playNotificationSound('success');
        return mapDbOrder(data);
      }
      return null;
    } else {
      // Update stock locally
      setMenu(prev => prev.map(m => {
        const orderItem = orderData.items.find(oi => oi.id === m.id);
        if (orderItem && m.stock !== undefined) {
          return { ...m, stock: m.stock - orderItem.quantity };
        }
        return m;
      }));
      setOrders(prev => [newOrderLocal, ...prev]);
      toast.success('Order created successfully (Offline)');
      playNotificationSound('success');
      return newOrderLocal;
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(order => order.id === id ? { ...order, status } : order));

      if (isRealtime && supabase) {
        const { error } = await supabase.from('orders').update({ status }).eq('id', id);
        if (error) throw error;
      }
      toast.success(`Order status updated to ${status}`);
      playNotificationSound('success');
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(`Failed to update status: ${error.message || 'Unknown error'}`);
      playNotificationSound('error');
    }
  };

  const updateOrderPaymentStatus = async (id: string, paymentStatus: Order['paymentStatus']) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(order => order.id === id ? { ...order, paymentStatus } : order));

      if (isRealtime && supabase) {
        const { error } = await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', id);
        if (error) throw error;
      }
      toast.success(`Payment status updated to ${paymentStatus}`);
      playNotificationSound('success');
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast.error(`Failed to update payment status: ${error.message || 'Unknown error'}`);
      playNotificationSound('error');
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>): Promise<boolean> => {
    const oldOrder = orders.find(o => o.id === id);
    
    // Optimistic update
    setOrders(prev => prev.map(order => order.id === id ? { ...order, ...updates } : order));

    if (isRealtime && supabase) {
      const dbUpdates: any = {};
      if (updates.customerName) dbUpdates.customer_name = updates.customerName;
      if (updates.items) dbUpdates.items = updates.items;
      if (updates.total !== undefined) dbUpdates.total = updates.total;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.paymentStatus) dbUpdates.payment_status = updates.paymentStatus;
      if (updates.note !== undefined) dbUpdates.note = updates.note;
      // Temporarily disabled edit_history update to prevent potential schema errors
      // if (updates.editHistory) dbUpdates.edit_history = updates.editHistory;

      const { error } = await supabase.from('orders').update(dbUpdates).eq('id', id);
      
      if (error) {
        console.error('Supabase update error:', error.message, error.details, error.hint);
        toast.error(`Failed to update order: ${error.message}`);
        playNotificationSound('error');
        // Re-fetch orders to sync state if update failed
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (data) setOrders(data.map(mapDbOrder));
        return false;
      }

      // Sync order_items table
      if (updates.items) {
        try {
          // 1. Delete existing items
          await supabase.from('order_items').delete().eq('order_id', id);
          
          // 2. Insert updated items
          const itemsToInsert = updates.items.map(item => ({
            order_id: id,
            menu_item_id: item.id,
            name: item.name,
            quantity: item.quantity,
            base_price: item.basePrice,
            is_prepared: item.isPrepared,
            note: item.note
          }));
          await supabase.from('order_items').insert(itemsToInsert);
        } catch (syncError) {
          console.error('Error syncing order items:', syncError);
          // We don't return false here because the main order was updated
        }
      }

      // Update stock in DB
      if (updates.items && oldOrder) {
        try {
          const diffs: Record<string, number> = {};
          
          // Items removed or quantity decreased
          oldOrder.items.forEach(oldItem => {
            const newItem = updates.items?.find(i => i.id === oldItem.id);
            if (!newItem) {
              diffs[oldItem.id] = (diffs[oldItem.id] || 0) + oldItem.quantity;
            } else if (newItem.quantity < oldItem.quantity) {
              diffs[oldItem.id] = (diffs[oldItem.id] || 0) + (oldItem.quantity - newItem.quantity);
            }
          });

          // Items added or quantity increased
          updates.items.forEach(newItem => {
            const oldItem = oldOrder.items.find(i => i.id === newItem.id);
            if (!oldItem) {
              diffs[newItem.id] = (diffs[newItem.id] || 0) - newItem.quantity;
            } else if (newItem.quantity > oldItem.quantity) {
              diffs[newItem.id] = (diffs[newItem.id] || 0) - (newItem.quantity - oldItem.quantity);
            }
          });

          for (const [itemId, diff] of Object.entries(diffs)) {
            if (diff === 0) continue;
            const menuItem = menu.find(m => m.id === itemId);
            if (menuItem && menuItem.stock !== undefined) {
               await supabase.from('menu_items')
                .update({ stock: menuItem.stock + diff })
                .eq('id', itemId);
            }
          }
        } catch (stockError) {
          console.error('Error updating stock:', stockError);
        }
      }
      toast.success('Order updated successfully');
      playNotificationSound('success');
      return true;
    } else {
      // Local stock update
      if (updates.items && oldOrder) {
        setMenu(prev => prev.map(m => {
          const oldItem = oldOrder.items.find(oi => oi.id === m.id);
          const newItem = updates.items?.find(ni => ni.id === m.id);
          
          let diff = 0;
          if (oldItem && !newItem) diff = oldItem.quantity;
          else if (oldItem && newItem) diff = oldItem.quantity - newItem.quantity;
          else if (!oldItem && newItem) diff = -newItem.quantity;

          if (diff !== 0 && m.stock !== undefined) {
            return { ...m, stock: m.stock + diff };
          }
          return m;
        }));
      }
      toast.success('Order updated successfully (Offline)');
      playNotificationSound('success');
      return true;
    }
  };

  const toggleOrderItemPrepared = async (orderId: string, itemId: string) => {
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

    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: updatedItems, status: newStatus } : o));

    try {
      if (isRealtime && supabase) {
        const { error } = await supabase.from('orders').update({ 
          items: updatedItems,
          status: newStatus 
        }).eq('id', orderId);
        if (error) throw error;
      }
      toast.success('Item status updated');
      playNotificationSound('success');
    } catch (error: any) {
      console.error('Error toggling item prepared status:', error);
      toast.error(`Failed to update item status: ${error.message || 'Unknown error'}`);
      playNotificationSound('error');
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
      updateOrder,
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
    bundle: dbItem.bundle_config,
    stock: dbItem.stock,
    minStock: dbItem.min_stock
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
    note: dbOrder.note,
    editHistory: dbOrder.edit_history
  };
}
