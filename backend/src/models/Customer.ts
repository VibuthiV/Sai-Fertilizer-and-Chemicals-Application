// src/models/Customer.ts

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  village: string | null;
  totalPurchases: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  village?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
