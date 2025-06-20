import { User, Product, LoginRecord, Notification } from '@/types';

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

  // Login Records
  getLoginRecords(): LoginRecord[] {
    return this.getItem<LoginRecord>('cd-stock-logins');
  }

  saveLoginRecords(records: LoginRecord[]): void {
    this.setItem('cd-stock-logins', records);
  }

  // Notifications
  getNotifications(): Notification[] {
    return this.getItem<Notification>('cd-stock-notifications');
  }

  saveNotifications(notifications: Notification[]): void {
    this.setItem('cd-stock-notifications', notifications);
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
}

export const storage = new LocalStorage();