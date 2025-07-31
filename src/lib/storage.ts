import { User, Product, LoginRecord, Notification } from '@/types';

interface ChatMessage {
  id: string;
  user_id: string;
  recipient_id: string;
  message: string;
  created_at: string;
}

interface ReadNotification {
  user_id: string;
  notification_id: string;
}

class LocalStorage {
  private getItem<T>(key: string): T[] {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  }

  private setItem<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Users
  getUsers(): User[] {
    return this.getItem<User>('cd-stock-users');
  }

  saveUsers(users: User[]): void {
    this.setItem('cd-stock-users', users);
  }

  // Products
  getProducts(): Product[] {
    return this.getItem<Product>('cd-stock-products');
  }

  saveProducts(products: Product[]): void {
    this.setItem('cd-stock-products', products);
  }

  // Current User
  getCurrentUser(): User | null {
    const user = localStorage.getItem('cd-stock-current-user');
    return user ? JSON.parse(user) : null;
  }

  setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem('cd-stock-current-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cd-stock-current-user');
    }
  }

  clearCurrentUser(): void {
    localStorage.removeItem('cd-stock-current-user');
  }

  // Other methods remain the same...
}

export const storage = new LocalStorage();