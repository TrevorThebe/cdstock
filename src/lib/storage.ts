// Empty storage service - all data is now stored in Supabase only
// This file is kept for backward compatibility but no longer stores data locally

export const storage = {
  // Deprecated methods - return empty data
  getUsers: () => [],
  saveUsers: () => {},
  getProducts: () => [],
  saveProducts: () => {},
  getLoginRecords: () => [],
  saveLoginRecords: () => {},
  getNotifications: () => [],
  saveNotifications: () => {},
  getReadNotifications: () => [],
  saveReadNotifications: () => {},
  getChatMessages: () => [],
  saveChatMessages: () => {},
  
  // Current user session - only store session info, not full user data
  getCurrentUser: () => {
    const session = sessionStorage.getItem('cd-stock-session');
    return session ? JSON.parse(session) : null;
  },
  
  setCurrentUser: (user: any) => {
    if (user) {
      // Only store minimal session data
      const sessionData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      };
      sessionStorage.setItem('cd-stock-session', JSON.stringify(sessionData));
    } else {
      sessionStorage.removeItem('cd-stock-session');
    }
  },
  
  clearCurrentUser: () => {
    sessionStorage.removeItem('cd-stock-session');
  }
};