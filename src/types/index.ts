export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  profilePicture?: string;
  role: 'normal' | 'admin' | 'super';
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  quantity: number;
  minQuantity: number;
  price: number;
  location: 'restaurant' | 'bakery';
  createdAt: string;
  updatedAt: string;
}

export interface LoginRecord {
  id: string;
  userId: string;
  deviceId: string;
  location: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  message: string;
  type: 'low-stock' | 'info' | 'warning';
  read: boolean;
  createdAt: string;
}
