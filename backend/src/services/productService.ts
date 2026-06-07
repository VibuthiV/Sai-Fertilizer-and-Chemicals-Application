// src/services/productService.ts — Product Business Logic

import { query } from '../config/database';
import { createError } from '../middlewares/errorHandler';
import { Product, CreateProductDto, UpdateProductDto } from '../models/Product';
import { camelizeKeys } from '../utils/dbMapper';


export const productService = {
  getAll: async (params: {
    search?: string;
    category?: string;
    lowStock?: boolean;
    page: number;
    limit: number;
  }) => {
    const { search, category, lowStock, page, limit } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = ['is_active = true'];
    const values: any[] = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(name ILIKE $${values.length} OR sku ILIKE $${values.length})`);
    }
    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }
    if (lowStock) {
      conditions.push('current_stock <= low_stock_threshold');
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) FROM products ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    values.push(limit, offset);
    const itemsResult = await query<Product>(
      `SELECT * FROM products ${whereClause} ORDER BY name ASC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { items: camelizeKeys(itemsResult.rows), total, page, limit };

  },

  getById: async (id: number): Promise<Product> => {
    const result = await query<Product>(
      'SELECT * FROM products WHERE id = $1 AND is_active = true',
      [id]
    );
    if (!result.rows[0]) throw createError('Product not found', 404);
    return camelizeKeys(result.rows[0]);
  },


  create: async (dto: CreateProductDto): Promise<Product> => {
    // Check for duplicate name (case-insensitive)
    const existingName = await query(
      'SELECT id FROM products WHERE LOWER(name) = LOWER($1) AND is_active = true',
      [dto.name]
    );
    if (existingName.rows.length > 0) {
      throw createError('Product with this name already exists. Please edit the existing product instead.', 409);
    }

    // Check or generate unique SKU
    let finalSku = dto.sku;
    if (!finalSku) {
      let isUnique = false;
      while (!isUnique) {
        finalSku = `PROD-${Math.floor(10000 + Math.random() * 90000)}`;
        const checkSku = await query('SELECT id FROM products WHERE sku = $1', [finalSku]);
        if (checkSku.rows.length === 0) {
          isUnique = true;
        }
      }
    } else {
      const existing = await query('SELECT id FROM products WHERE sku = $1', [finalSku]);
      if (existing.rows.length > 0) throw createError('SKU already exists', 409);
    }

    const result = await query<Product>(
      `INSERT INTO products (name, description, category, sku, unit, purchase_price, selling_price, current_stock, low_stock_threshold)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [dto.name, dto.description, dto.category, finalSku, dto.unit,
       dto.purchasePrice, dto.sellingPrice, dto.currentStock, dto.lowStockThreshold]
    );
    return camelizeKeys(result.rows[0]);
  },


  update: async (id: number, dto: UpdateProductDto): Promise<Product> => {
    await productService.getById(id); // ensure exists

    const fields: string[] = [];
    const values: any[] = [];

    if (dto.name !== undefined) { values.push(dto.name); fields.push(`name = $${values.length}`); }
    if (dto.description !== undefined) { values.push(dto.description); fields.push(`description = $${values.length}`); }
    if (dto.category !== undefined) { values.push(dto.category); fields.push(`category = $${values.length}`); }
    if (dto.sellingPrice !== undefined) { values.push(dto.sellingPrice); fields.push(`selling_price = $${values.length}`); }
    if (dto.purchasePrice !== undefined) { values.push(dto.purchasePrice); fields.push(`purchase_price = $${values.length}`); }
    if (dto.currentStock !== undefined) { values.push(dto.currentStock); fields.push(`current_stock = $${values.length}`); }
    if (dto.lowStockThreshold !== undefined) { values.push(dto.lowStockThreshold); fields.push(`low_stock_threshold = $${values.length}`); }

    if (fields.length === 0) throw createError('No fields to update', 400);

    values.push(id);
    const result = await query<Product>(
      `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    return camelizeKeys(result.rows[0]);
  },


  delete: async (id: number): Promise<void> => {
    await productService.getById(id);
    await query('UPDATE products SET is_active = false WHERE id = $1', [id]);
  },
};
