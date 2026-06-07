// src/models/User.ts

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  role: 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  adminName: string;
  shopName: string;
  contactPhone: string;
  address: string;
  gstin: string;
}

export interface UserPublic {
  id: number;
  username: string;
  role: 'admin';
  createdAt: Date;
  adminName: string;
  shopName: string;
  contactPhone: string;
  address: string;
  gstin: string;
}
