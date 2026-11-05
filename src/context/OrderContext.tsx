import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './ToastContext';

export type PaymentMethod = 'qris' | 'bank_transfer' | 'cash_on_delivery' | 'cash_in_store';
export type PaymentStatus = 'pending' | 'verifying' | 'paid' | 'failed' | 'refunded';
export type OrderStatus =
  | 'pending_prescription'
  | 'prescription_rejected'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled';
export type DeliveryMethod = 'delivery' | 'pickup';

export interface OrderItem {
  medicineId: string;
  medicineName: string;
  dosageForm: string;
  strength: string;
  category?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  requiresPrescription: boolean;
  instructions?: string;
}

export interface OrderTransaction {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentProofUrl?: string;
  prescriptionUrl?: string;
  paidAt?: string;
  deliveryMethod: DeliveryMethod;
  shippingAddress?: string;
  courierNotes?: string;
  orderStatus: OrderStatus;
  staffVerifierName?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface OrderContextType {
  orders: OrderTransaction[];
  isLoading: boolean;
  createOrder: (payload: {
    items: OrderItem[];
    deliveryMethod: DeliveryMethod;
    shippingAddress?: string;
    courierNotes?: string;
    paymentMethod: PaymentMethod;
    paymentProofUrl?: string;
    prescriptionUrl?: string;
    customerName?: string;
    customerPhone?: string;
  }) => Promise<OrderTransaction>;
  verifyPayment: (orderId: string, isAccepted: boolean, reason?: string) => Promise<void>;
  verifyPrescription: (orderId: string, isAccepted: boolean, reason?: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  refreshOrders: () => Promise<void>;
  exportExcel: () => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<OrderTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('vitaria_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  // Fetch orders from API with Bearer token
  const refreshOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/orders', { headers: getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrders(json.data);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend API unavailable, using local state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem('vitaria_orders');
    } catch {}
    refreshOrders();
  }, []);

  const createOrder = async (payload: {
    items: OrderItem[];
    deliveryMethod: DeliveryMethod;
    shippingAddress?: string;
    courierNotes?: string;
    paymentMethod: PaymentMethod;
    paymentProofUrl?: string;
    prescriptionUrl?: string;
    customerName?: string;
    customerPhone?: string;
  }): Promise<OrderTransaction> => {
    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setOrders((prev) => [json.data, ...prev]);
          showToast(`Pesanan ${json.data.invoiceNumber} berhasil dibuat & tersimpan di database!`, 'success');
          return json.data;
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.message || errJson.error || 'Gagal memproses pesanan di database.';
        showToast(msg, 'danger');
        throw new Error(msg);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      throw err;
    }

    throw new Error('Gagal memproses pesanan');
  };

  const verifyPayment = async (orderId: string, isAccepted: boolean, reason = '') => {
    try {
      await fetch(`/api/orders/${orderId}/verify-payment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isAccepted, reason })
      });
    } catch {}

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            paymentStatus: isAccepted ? 'paid' : 'failed',
            orderStatus: isAccepted ? 'processing' : o.orderStatus,
            paidAt: isAccepted ? new Date().toISOString() : o.paidAt,
            courierNotes: !isAccepted && reason ? `${o.courierNotes || ''} [Penolakan: ${reason}]` : o.courierNotes
          };
        }
        return o;
      })
    );

    showToast(
      isAccepted ? 'Pembayaran berhasil diverifikasi (Lunas).' : 'Bukti pembayaran ditolak.',
      isAccepted ? 'success' : 'warning'
    );
  };

  const verifyPrescription = async (orderId: string, isAccepted: boolean, reason = '') => {
    try {
      await fetch(`/api/orders/${orderId}/verify-prescription`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isAccepted, reason, staffVerifierName: 'apt. Sarinah Cantika, S.Farm.' })
      });
    } catch {}

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: isAccepted ? 'processing' : 'prescription_rejected',
            staffVerifierName: 'apt. Sarinah Cantika, S.Farm.',
            courierNotes: !isAccepted && reason ? `${o.courierNotes || ''} [Penolakan Resep: ${reason}]` : o.courierNotes,
            updatedAt: new Date().toISOString()
          };
        }
        return o;
      })
    );

    showToast(
      isAccepted
        ? 'Resep dokter berhasil diverifikasi & disetujui APJ.'
        : 'Resep dokter ditolak oleh APJ.',
      isAccepted ? 'success' : 'warning'
    );
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ orderStatus: status, staffVerifierName: 'apt. Sarinah Cantika, S.Farm.' })
      });
    } catch {}

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: status,
            paymentStatus: status === 'completed' ? 'paid' : o.paymentStatus,
            completedAt: status === 'completed' ? new Date().toISOString() : o.completedAt
          };
        }
        return o;
      })
    );

    showToast(`Status pesanan diperbarui menjadi: ${status}`, 'success');
  };

  const exportExcel = () => {
    window.open('/api/reports/export-excel', '_blank');
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        createOrder,
        verifyPayment,
        verifyPrescription,
        updateOrderStatus,
        refreshOrders,
        exportExcel
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
