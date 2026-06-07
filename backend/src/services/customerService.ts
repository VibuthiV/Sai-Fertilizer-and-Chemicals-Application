// src/services/customerService.ts — Customer Business Logic

import { query } from '../config/database';
import { createError } from '../middlewares/errorHandler';
import { Customer, CreateCustomerDto, UpdateCustomerDto } from '../models/Customer';
import { camelizeKeys } from '../utils/dbMapper';


export const customerService = {
  getAll: async (params: { search?: string; page: number; limit: number }) => {
    const { search, page, limit } = params;
    const offset = (page - 1) * limit;
    const values: any[] = [];
    const conditions: string[] = ['is_active = true'];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(name ILIKE $${values.length} OR phone ILIKE $${values.length})`);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) FROM customers ${whereClause}`, values
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    values.push(limit, offset);
    const itemsResult = await query<Customer>(
      `SELECT * FROM customers ${whereClause} ORDER BY name ASC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { items: camelizeKeys(itemsResult.rows), total, page, limit };
  },


  getById: async (id: number): Promise<Customer> => {
    const result = await query<Customer>(
      'SELECT * FROM customers WHERE id = $1 AND is_active = true', [id]
    );
    if (!result.rows[0]) throw createError('Customer not found', 404);
    return camelizeKeys(result.rows[0]);
  },


  create: async (dto: CreateCustomerDto): Promise<Customer> => {
    const result = await query<Customer>(
      `INSERT INTO customers (name, phone, email, address, village)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [dto.name, dto.phone, dto.email || null, dto.address || null, dto.village || null]
    );
    return camelizeKeys(result.rows[0]);
  },


  update: async (id: number, dto: UpdateCustomerDto): Promise<Customer> => {
    await customerService.getById(id);
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.name !== undefined) { values.push(dto.name); fields.push(`name = $${values.length}`); }
    if (dto.phone !== undefined) { values.push(dto.phone); fields.push(`phone = $${values.length}`); }
    if (dto.email !== undefined) { values.push(dto.email); fields.push(`email = $${values.length}`); }
    if (dto.address !== undefined) { values.push(dto.address); fields.push(`address = $${values.length}`); }
    if (dto.village !== undefined) { values.push(dto.village); fields.push(`village = $${values.length}`); }

    if (fields.length === 0) throw createError('No fields to update', 400);

    values.push(id);
    const result = await query<Customer>(
      `UPDATE customers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );
    return camelizeKeys(result.rows[0]);
  },


  delete: async (id: number): Promise<void> => {
    await customerService.getById(id);
    await query('UPDATE customers SET is_active = false WHERE id = $1', [id]);
  },
};
