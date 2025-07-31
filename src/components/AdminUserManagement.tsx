// components/AdminUserManagement.tsx
import { useEffect, useState } from 'react';
import { userService } from '@/lib/userService';
import { useUser } from '@/context/UserContext';

export default function AdminUserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'super') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await userService.updateUserRole(userId, newRole);
      loadUsers(); // Refresh list
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleToggleBlock = async (userId: string, isBlocked: boolean) => {
    try {
      await userService.toggleUserBlock(userId, isBlocked);
      loadUsers(); // Refresh list
    } catch (error) {
      console.error('Failed to toggle block:', error);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'super')) {
    return <div>Unauthorized</div>;
  }

  return (
    <div className="admin-panel">
      <h2>User Management</h2>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                    disabled={user.role === 'super' && user.role !== 'super'}
                  >
                    <option value="normal">Normal</option>
                    <option value="admin">Admin</option>
                    {user.role === 'super' && <option value="super">Super</option>}
                  </select>
                </td>
                <td>{user.is_blocked ? 'Blocked' : 'Active'}</td>
                <td>
                  <button onClick={() => handleToggleBlock(user.id, !user.is_blocked)}>
                    {user.is_blocked ? 'Unblock' : 'Block'}
                  </button>
                  {user.role !== 'super' && (
                    <button onClick={() => userService.deleteUser(user.id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}