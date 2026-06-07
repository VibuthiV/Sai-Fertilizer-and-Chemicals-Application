-- ============================================================
-- Migration: 001_initial_schema.sql
-- Database: fertilizer_shop_db
-- Description: Creates all initial tables for the Fertilizer
--              Shop Stock & Billing System
-- ============================================================

-- Create database (run this separately as superuser if needed)
-- CREATE DATABASE fertilizer_shop_db;

-- Connect to the database before running this file:
-- \c fertilizer_shop_db

-- Enable UUID extension (optional, for future use)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- Table: users
-- Only admin users. No public signup.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    username         VARCHAR(50)  NOT NULL UNIQUE,
    password_hash    TEXT         NOT NULL,
    role             VARCHAR(20)  NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
    is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ─────────────────────────────────────────────────────────────
-- Table: customers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(100) NOT NULL,
    phone            VARCHAR(20)  NOT NULL,
    email            VARCHAR(100),
    address          TEXT,
    village          VARCHAR(100),
    total_purchases  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_active        BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_name    ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone   ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_active  ON customers(is_active);

-- ─────────────────────────────────────────────────────────────
-- Table: products
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id                   SERIAL PRIMARY KEY,
    name                 VARCHAR(150)  NOT NULL,
    description          TEXT,
    category             VARCHAR(50)   NOT NULL,
    sku                  VARCHAR(50)   NOT NULL UNIQUE,
    unit                 VARCHAR(20)   NOT NULL,           -- kg, litre, bag, piece
    purchase_price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    selling_price        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    current_stock        DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    low_stock_threshold  DECIMAL(10,3) NOT NULL DEFAULT 10.000,
    is_active            BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku      ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock    ON products(current_stock, low_stock_threshold);

-- ─────────────────────────────────────────────────────────────
-- Table: bills
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
    id               SERIAL PRIMARY KEY,
    bill_number      VARCHAR(30)   NOT NULL UNIQUE,
    customer_id      INTEGER       REFERENCES customers(id) ON DELETE SET NULL,
    customer_name    VARCHAR(100)  NOT NULL,
    customer_phone   VARCHAR(20)   NOT NULL,
    subtotal         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount_amount  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_method   VARCHAR(20)   NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'credit')),
    payment_status   VARCHAR(20)   NOT NULL DEFAULT 'paid' CHECK (payment_status IN ('paid', 'pending', 'partial')),
    notes            TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_customer_id     ON bills(customer_id);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number     ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_created_at      ON bills(created_at);
CREATE INDEX IF NOT EXISTS idx_bills_payment_status  ON bills(payment_status);

-- ─────────────────────────────────────────────────────────────
-- Table: bill_items
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bill_items (
    id             SERIAL PRIMARY KEY,
    bill_id        INTEGER       NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    product_id     INTEGER       NOT NULL REFERENCES products(id),
    product_name   VARCHAR(150)  NOT NULL,  -- denormalized for history
    quantity       DECIMAL(10,3) NOT NULL,
    unit           VARCHAR(20)   NOT NULL,
    price_per_unit DECIMAL(10,2) NOT NULL,
    discount       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price    DECIMAL(12,2) NOT NULL,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id    ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_product_id ON bill_items(product_id);

-- ─────────────────────────────────────────────────────────────
-- Function: Auto-update updated_at timestamp
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tables with updated_at
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['users', 'customers', 'products', 'bills'] LOOP
        EXECUTE format(
            'DROP TRIGGER IF EXISTS set_updated_at ON %I;
             CREATE TRIGGER set_updated_at
             BEFORE UPDATE ON %I
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
            tbl, tbl
        );
    END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- Function: Auto-generate bill number (BILL-YYYY-NNNN)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS TRIGGER AS $$
DECLARE
    year_str    TEXT;
    seq_num     INTEGER;
    bill_num    TEXT;
BEGIN
    year_str := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SPLIT_PART(bill_number, '-', 3) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM bills
    WHERE bill_number LIKE 'BILL-' || year_str || '-%';

    bill_num := 'BILL-' || year_str || '-' || LPAD(seq_num::TEXT, 4, '0');
    NEW.bill_number := bill_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_bill_number ON bills;
CREATE TRIGGER auto_bill_number
BEFORE INSERT ON bills
FOR EACH ROW
WHEN (NEW.bill_number IS NULL OR NEW.bill_number = '')
EXECUTE FUNCTION generate_bill_number();

SELECT 'Schema created successfully ✅' AS result;
