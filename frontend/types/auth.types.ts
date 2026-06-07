// types/auth.types.ts

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  role: 'admin';
  createdAt: string;
  adminName?: string;
  shopName?: string;
  contactPhone?: string;
  address?: string;
  gstin?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  expiresIn: number;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
