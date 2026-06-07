// src/services/billService.ts — Billing Business Logic

import { query, getClient } from '../config/database';
import { createError } from '../middlewares/errorHandler';
import { Bill, CreateBillDto } from '../models/Bill';
import { camelizeKeys } from '../utils/dbMapper';

export const billService = {
  /**
   * Fetch all bills with optional pagination and filters
   */
  getAll: async (params: {
    page: number;
    limit: number;
    search?: string;
    customerId?: number;
  }) => {
    const { page, limit, search, customerId } = params;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];

    if (customerId) {
      values.push(customerId);
      conditions.push(`customer_id = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(bill_number ILIKE $${values.length} OR customer_name ILIKE $${values.length} OR customer_phone ILIKE $${values.length} OR customer_aadhar ILIKE $${values.length})`);
    }


    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) FROM bills ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    values.push(limit, offset);
    const billsResult = await query<any>(
      `SELECT * FROM bills ${whereClause} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    // Fetch items for each bill
    const bills = billsResult.rows;
    for (const bill of bills) {
      const itemsResult = await query(
        'SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY id ASC',
        [bill.id]
      );
      bill.items = camelizeKeys(itemsResult.rows);
    }

    return { items: camelizeKeys(bills), total, page, limit };
  },

  /**
   * Fetch single bill by ID
   */
  getById: async (id: number): Promise<Bill> => {
    const result = await query<any>(
      'SELECT * FROM bills WHERE id = $1',
      [id]
    );
    if (!result.rows[0]) throw createError('Bill not found', 404);

    const bill = result.rows[0];
    const itemsResult = await query(
      'SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY id ASC',
      [id]
    );
    bill.items = camelizeKeys(itemsResult.rows);

    return camelizeKeys(bill);
  },

  /**
   * Create a new bill in a transaction
   */
  create: async (dto: CreateBillDto): Promise<Bill> => {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      let subtotal = 0;
      const verifiedItems: any[] = [];

      // Validate products and stock
      for (const item of dto.items) {
        const prodRes = await client.query(
          'SELECT * FROM products WHERE id = $1 AND is_active = true',
          [item.productId]
        );
        const product = prodRes.rows[0];
        if (!product) {
          throw createError(`Product not found or inactive (ID: ${item.productId})`, 404);
        }

        const quantity = parseFloat(item.quantity.toString());
        const currentStock = parseFloat(product.current_stock.toString());
        if (currentStock < quantity) {
          throw createError(`Insufficient stock for product '${product.name}'. Available: ${currentStock}, Requested: ${quantity}`, 400);
        }

        const pricePerUnit = parseFloat(item.pricePerUnit.toString());
        const discount = parseFloat((item.discount || 0).toString());
        const totalPrice = (pricePerUnit - discount) * quantity;
        subtotal += totalPrice;

        verifiedItems.push({
          productId: item.productId,
          productName: product.name,
          quantity,
          unit: product.unit,
          pricePerUnit,
          discount,
          totalPrice,
        });
      }

      const discountAmount = parseFloat((dto.discountAmount || 0).toString());
      const taxAmount = 0.00; // default tax
      const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

      // Insert Bill
      const billRes = await client.query<any>(
        `INSERT INTO bills (customer_id, customer_name, customer_phone, customer_aadhar, subtotal, discount_amount, tax_amount, total_amount, payment_method, payment_status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          dto.customerId || null,
          dto.customerName,
          dto.customerPhone,
          dto.customerAadhar || null,
          subtotal,
          discountAmount,
          taxAmount,
          totalAmount,
          dto.paymentMethod || 'cash',
          'paid', // default to paid
          dto.notes || null,
        ]
      );


      const bill = billRes.rows[0];

      // Insert Bill Items and deduct stock
      for (const item of verifiedItems) {
        // Insert item
        await client.query(
          `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, unit, price_per_unit, discount, total_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            bill.id,
            item.productId,
            item.productName,
            item.quantity,
            item.unit,
            item.pricePerUnit,
            item.discount,
            item.totalPrice,
          ]
        );

        // Deduct stock
        await client.query(
          `UPDATE products SET current_stock = current_stock - $1 WHERE id = $2`,
          [item.quantity, item.productId]
        );
      }

      // Update customer total purchases if customer exists
      if (dto.customerId) {
        await client.query(
          `UPDATE customers SET total_purchases = total_purchases + $1 WHERE id = $2`,
          [totalAmount, dto.customerId]
        );
      }

      await client.query('COMMIT');

      // Fetch items to return full object
      const itemsRes = await query(
        'SELECT * FROM bill_items WHERE bill_id = $1 ORDER BY id ASC',
        [bill.id]
      );
      bill.items = camelizeKeys(itemsRes.rows);

      return camelizeKeys(bill);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
