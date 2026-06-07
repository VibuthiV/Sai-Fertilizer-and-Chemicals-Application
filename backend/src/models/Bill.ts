// src/models/Bill.ts

export type PaymentMethod = 'cash' | 'upi' | 'credit';
export type PaymentStatus = 'paid' | 'pending' | 'partial';

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
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  paymentMethod: PaymentMethod;
  notes?: string;
}

