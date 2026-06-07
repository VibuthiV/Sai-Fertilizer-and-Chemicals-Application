// types/product.types.ts

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string;
  sku: string;
  unit: string;            // kg, litre, bag, etc.
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  category: string;
  sku?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductState {
  items: Product[];
  selectedProduct: Product | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
}

export type ProductCategory =
  | 'Fertilizer'
  | 'Pesticide'
  | 'Herbicide'
  | 'Seed'
  | 'Equipment'
  | 'Other';
