// types/customer.types.ts

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  village: string | null;
  totalPurchases: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  village?: string;
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}

export interface CustomerState {
  items: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
}
