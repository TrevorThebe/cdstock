import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User } from '@/types';
import { storage } from '@/lib/storage';
import { Search, Shield, ShieldCheck, ShieldX, Trash2, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AdminProps {
  currentUser: User;
}

export const Admin: React.FC<AdminProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const allUsers = storage.getUsers();
    setUsers(allUsers);
  };

  const handleRoleChange = (userId: string, newRole: 'normal' | 'admin' | 'super') => {
    if (userId === currentUser.id && newRole !== 'super') {
      toast({
        title: 'Error',
        description: 'Cannot change your own super admin role',
        variant: 'destructive'
      });
      return;
    }

    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, role: newRole, updatedAt: new Date().toISOString() }
        : user
    );
    
    storage.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    
    toast({
      title: 'Success',
      description: `User role updated to ${newRole}`
    });
  };

  const handleBlockUser = (userId: string, block: boolean) => {
    if (userId === currentUser.id) {
      toast({
        title: 'Error',
        description: 'Cannot block yourself',
        variant: 'destructive'
      });
      return;
    }

    const updatedUsers = users.map(user => 
      user.id === userId 
        ? { ...user, isBlocked: block, updatedAt: new Date().toISOString() }
        : user
    );
    
    storage.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    
    toast({
      title: 'Success',
      description: `User ${block ? 'blocked' : 'unblocked'} successfully`
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      toast({
        title: 'Error',
        description: 'Cannot delete yourself',
        variant: 'destructive'
      });
      return;
    }

    const updatedUsers = users.filter(user => user.id !== userId);
    storage.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    
    toast({
      title: 'Success',
      description: 'User deleted successfully'
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super': return <ShieldCheck className="h-4 w-4 text-red-500" />;
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <ShieldX className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super': return <Badge variant="destructive">Super Admin</Badge>;
      case 'admin': return <Badge variant="default">Admin</Badge>;
      default: return <Badge variant="secondary">Normal User</Badge>;
    }
  };

  const roleStats = {
    total: users.length,
    super: users.filter(u => u.role === 'super').length,
    admin: users.filter(u => u.role === 'admin').length,
    normal: users.filter(u => u.role === 'normal').length,
    blocked: users.filter(u => u.isBlocked).length
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            {roleStats.total} total users • {roleStats.blocked} blocked
          </p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{roleStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Super Admins</p>
                <p className="text-2xl font-bold">{roleStats.super}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{roleStats.admin}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserX className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Blocked</p>
                <p className="text-2xl font-bold">{roleStats.blocked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredUsers.map(user => (
          <Card key={user.id} className={`${user.isBlocked ? 'border-red-200 bg-red-50' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{user.name}</span>
                      {user.id === currentUser.id && (
                        <Badge variant="outline">You</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                    <p className="text-xs text-muted-foreground">
                      {user.phone || 'No phone number'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(user.role)}
                    {getRoleBadge(user.role)}
                  </div>
                  {user.isBlocked && (
                    <Badge variant="destructive">Blocked</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                  <p>Updated: {new Date(user.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-2">
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value as any)}
                    disabled={user.id === currentUser.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super">Super</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant={user.isBlocked ? "default" : "destructive"}
                    size="sm"
                    onClick={() => handleBlockUser(user.id, !user.isBlocked)}
                    disabled={user.id === currentUser.id}
                  >
                    {user.isBlocked ? 'Unblock' : 'Block'}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={user.id === currentUser.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {user.name}? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found matching your search.</p>
        </div>
      )}
    </div>
  );
};