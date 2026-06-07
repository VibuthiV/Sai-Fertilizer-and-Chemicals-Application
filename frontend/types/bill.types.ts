// types/bill.types.ts

export interface BillItem {
  id: number;
  billId: number;
  productId: number;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  discount: number;
  totalPrice: number;
}

export interface Bill {
  id: number;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  customerAadhar: string | null;
  items: BillItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'upi' | 'credit';
  paymentStatus: 'paid' | 'pending' | 'partial';
  notes: string | null;
  createdAt: string;
}

export interface CreateBillItemDto {
  productId: number;
  quantity: number;
  pricePerUnit: number;
  discount?: number;
}

export interface CreateBillDto {
  customerName: string;
  customerPhone: string;
  customerAadhar?: string;
  items: CreateBillItemDto[];
  discountAmount?: number;
  paymentMethod: 'cash' | 'upi' | 'credit';
  notes?: string;
}


export interface BillState {
  items: Bill[];
  selectedBill: Bill | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
}
