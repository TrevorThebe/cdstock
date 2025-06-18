import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;
}

interface UserSelectorProps {
  onUserSelect: (userId: string) => void;
  selectedUserId?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ 
  onUserSelect, 
  selectedUserId 
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .neq('role', 'admin')
        .order('name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Loading Users...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select User to Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {users.map((user) => (
          <Button
            key={user.id}
            variant={selectedUserId === user.id ? 'default' : 'outline'}
            className="w-full justify-start h-auto p-3"
            onClick={() => onUserSelect(user.id)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback>
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                {user.role}
              </Badge>
            </div>
          </Button>
        ))}
        {users.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No users available
          </p>
        )}
      </CardContent>
    </Card>
  );
};