// src/models/Product.ts

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category: string;
  sku: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
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
