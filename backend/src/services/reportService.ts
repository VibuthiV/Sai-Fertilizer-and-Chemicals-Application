// src/services/reportService.ts — Reports Business Logic

import { query } from '../config/database';
import { camelizeKeys } from '../utils/dbMapper';


export const reportService = {
  getDaily: async (date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const result = await query(
      `SELECT
        DATE(created_at) as date,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as total_orders,
        COALESCE(AVG(total_amount), 0) as avg_order_value
       FROM bills
       WHERE DATE(created_at) = $1
       GROUP BY DATE(created_at)`,
      [targetDate]
    );
    return camelizeKeys(result.rows[0]) || {
      date: targetDate,
      totalSales: 0,
      totalOrders: 0,
      avgOrderValue: 0,
    };
  },


  getWeekly: async (startDate?: string) => {
    const start = startDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay());
      return d.toISOString().split('T')[0];
    })();

    const result = await query(
      `SELECT
        DATE(created_at) as date,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as total_orders
       FROM bills
       WHERE DATE(created_at) >= $1 AND DATE(created_at) < ($1::date + interval '7 days')
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [start]
    );

    const camelizedRows = camelizeKeys(result.rows);
    const totalSales = camelizedRows.reduce((s: number, r: any) => s + parseFloat(r.totalSales), 0);
    const totalOrders = camelizedRows.reduce((s: number, r: any) => s + parseInt(r.totalOrders), 0);

    return {
      weekStart: start,
      weekEnd: camelizedRows[camelizedRows.length - 1]?.date || start,
      totalSales,
      totalOrders,
      dailyBreakdown: camelizedRows,
    };
  },


  getMonthly: async (month?: number, year?: number) => {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const result = await query(
      `SELECT
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as total_orders,
        COALESCE(AVG(total_amount), 0) as avg_order_value
       FROM bills
       WHERE EXTRACT(MONTH FROM created_at) = $1
         AND EXTRACT(YEAR FROM created_at) = $2`,
      [targetMonth, targetYear]
    );

    const camelized = camelizeKeys(result.rows[0]);
    return {
      month: targetMonth,
      year: targetYear,
      totalSales: parseFloat(camelized?.totalSales || '0'),
      totalOrders: parseInt(camelized?.totalOrders || '0'),
      avgOrderValue: parseFloat(camelized?.avgOrderValue || '0'),
    };
  },


  getYearly: async (year?: number) => {
    const targetYear = year || new Date().getFullYear();

    const result = await query(
      `SELECT
        EXTRACT(MONTH FROM created_at) as month,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(*) as total_orders
       FROM bills
       WHERE EXTRACT(YEAR FROM created_at) = $1
       GROUP BY month
       ORDER BY month ASC`,
      [targetYear]
    );

    const camelizedRows = camelizeKeys(result.rows);
    const totalSales = camelizedRows.reduce((s: number, r: any) => s + parseFloat(r.totalSales), 0);
    const totalOrders = camelizedRows.reduce((s: number, r: any) => s + parseInt(r.totalOrders), 0);

    return { year: targetYear, totalSales, totalOrders, monthlyBreakdown: camelizedRows };
  },


  getSummary: async () => {
    const [salesResult, topProducts, productsResult] = await Promise.all([
      query(
        `SELECT
          COALESCE(SUM(total_amount), 0) as total_sales,
          COUNT(*) as total_orders,
          COALESCE(AVG(total_amount), 0) as avg_order_value
         FROM bills`
      ),
      query(
        `SELECT
          bi.product_id,
          bi.product_name,
          SUM(bi.quantity) as total_quantity_sold,
          SUM(bi.total_price) as total_revenue,
          p.unit
         FROM bill_items bi
         JOIN products p ON p.id = bi.product_id
         GROUP BY bi.product_id, bi.product_name, p.unit
         ORDER BY total_revenue DESC
         LIMIT 5`
      ),
      query(
        `SELECT COUNT(*) as total_products FROM products WHERE is_active = true`
      ),
    ]);

    const camelizedSales = camelizeKeys(salesResult.rows[0]);
    const totalProducts = parseInt(productsResult.rows[0]?.total_products || '0', 10);
    return {
      totalSales: parseFloat(camelizedSales?.totalSales || '0'),
      totalOrders: parseInt(camelizedSales?.totalOrders || '0'),
      avgOrderValue: parseFloat(camelizedSales?.avgOrderValue || '0'),
      topProducts: camelizeKeys(topProducts.rows),
      totalProducts,
    };
  },

  getTrend: async (timeline: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let type: 'week' | 'month' | 'year';

    if (timeline === 'this_week') {
      type = 'week';
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (timeline === 'last_week') {
      type = 'week';
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (timeline === 'this_month') {
      type = 'month';
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (timeline === 'last_month') {
      type = 'month';
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (timeline === 'this_year') {
      type = 'year';
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (timeline === 'last_year') {
      type = 'year';
      startDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    } else {
      type = 'week';
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    }

    const billsResult = await query(
      `SELECT
        created_at,
        total_amount
       FROM bills
       WHERE created_at >= $1 AND created_at <= $2
       ORDER BY created_at ASC`,
      [startDate.toISOString(), endDate.toISOString()]
    );

    const bills = billsResult.rows;
    const totalSales = bills.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const totalOrders = bills.length;

    let dataPoints: { label: string; sales: number }[] = [];

    if (type === 'week') {
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        
        const daySales = bills
          .filter(b => {
            const bDate = new Date(b.created_at);
            return bDate.getFullYear() === d.getFullYear() &&
                   bDate.getMonth() === d.getMonth() &&
                   bDate.getDate() === d.getDate();
          })
          .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

        dataPoints.push({
          label: dayNames[i],
          sales: daySales,
        });
      }
    } else if (type === 'month') {
      const weekRanges = [
        { label: 'W1', start: 1, end: 7 },
        { label: 'W2', start: 8, end: 14 },
        { label: 'W3', start: 15, end: 21 },
        { label: 'W4', start: 22, end: 28 },
        { label: 'W5', start: 29, end: 31 },
      ];

      weekRanges.forEach(wr => {
        const weekSales = bills
          .filter(b => {
            const bDate = new Date(b.created_at);
            const bDay = bDate.getDate();
            return bDate.getMonth() === startDate.getMonth() &&
                   bDate.getFullYear() === startDate.getFullYear() &&
                   bDay >= wr.start && bDay <= wr.end;
          })
          .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

        dataPoints.push({
          label: wr.label,
          sales: weekSales,
        });
      });
    } else if (type === 'year') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        const monthSales = bills
          .filter(b => {
            const bDate = new Date(b.created_at);
            return bDate.getMonth() === i && bDate.getFullYear() === startDate.getFullYear();
          })
          .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

        dataPoints.push({
          label: monthNames[i],
          sales: monthSales,
        });
      }
    }

    return {
      timeline,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalSales,
      totalOrders,
      trend: dataPoints,
    };
  },
};
