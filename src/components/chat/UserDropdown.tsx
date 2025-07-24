import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Users } from 'lucide-react';
import { storage } from '@/lib/storage';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface UserDropdownProps {
  onUserSelect: (userId: string) => void;
  selectedUserId?: string;
  currentUser?: any;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({ 
  onUserSelect, 
  selectedUserId,
  currentUser
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      // First try to load from Supabase
      let supabaseUsers: User[] = [];
      try {
        let query = supabase
          .from('user_profiles')
          .select('*')
          .order('name');

        if (currentUser?.profile?.role === 'admin' || currentUser?.profile?.role === 'super') {
          query = query.neq('user_id', currentUser.id);
        } else {
          query = query.in('role', ['admin', 'super']);
        }

        const { data, error } = await query;

        if (!error && data) {
          supabaseUsers = data.map(profile => ({
            id: profile.user_id,
            name: profile.name,
            email: profile.email || '',
            role: profile.role,
            avatar_url: profile.avatar_url
          }));
        }
      } catch (supabaseError) {
        console.log('Supabase not available, using localStorage');
      }

      // Fallback to localStorage users
      const localUsers = storage.getUsers();
      const localUsersFormatted = localUsers
        .filter(user => {
          if (!currentUser) return true;
          if (currentUser.role === 'admin' || currentUser.role === 'super') {
            return user.id !== currentUser.id;
          } else {
            return user.role === 'admin' || user.role === 'super';
          }
        })
        .map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar_url: undefined
        }));

      // Combine and deduplicate users
      const allUsers = [...supabaseUsers];
      localUsersFormatted.forEach(localUser => {
        if (!allUsers.find(u => u.email === localUser.email)) {
          allUsers.push(localUser);
        }
      });
      
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(user => user.id === selectedUserId);

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>Loading users...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs">
      <Select value={selectedUserId || ''} onValueChange={onUserSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select user to chat with">
            {selectedUser && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedUser.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedUser.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedUser.role}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
              </div>
            </SelectItem>
          ))}
          {users.length === 0 && (
            <SelectItem value="no-users" disabled>
              No users available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};