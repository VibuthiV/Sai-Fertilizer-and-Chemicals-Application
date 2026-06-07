// src/database/migrate.ts — Programmatic DB Migration & Seeding Runner

import fs from 'fs';
import path from 'path';
import pool from '../config/database';

const runMigrations = async () => {
  console.log('🚀 Starting database migrations and seeding...');
  const client = await pool.connect();
  try {
    // Helper to find the absolute path of a sql file (handles both dev ts-node and prod compiled node contexts)
    const getSqlFilePath = (relPath: string): string => {
      const pathInDir = path.join(__dirname, relPath);
      if (fs.existsSync(pathInDir)) {
        return pathInDir;
      }
      const pathInSrc = path.join(__dirname, '../../src/database', relPath);
      if (fs.existsSync(pathInSrc)) {
        return pathInSrc;
      }
      throw new Error(`Could not find SQL file: ${relPath} (checked ${pathInDir} and ${pathInSrc})`);
    };

    // 1. Run initial migrations schema
    const migrationsPath = getSqlFilePath('migrations/001_initial_schema.sql');
    console.log(`Reading migration file: ${migrationsPath}`);
    const migrationsSql = fs.readFileSync(migrationsPath, 'utf8');
    
    console.log('Executing migrations SQL...');
    await client.query(migrationsSql);
    console.log('✅ Migrations completed successfully.');

    // 2. Run default admin user seeds
    const seedsPath = getSqlFilePath('seeds/001_admin_user.sql');
    console.log(`Reading seeds file: ${seedsPath}`);
    const seedsSql = fs.readFileSync(seedsPath, 'utf8');
    
    console.log('Executing seeds SQL...');
    await client.query(seedsSql);
    console.log('✅ Seeding completed successfully.');

    console.log('🎉 Database migration & seeding finished successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrations();
