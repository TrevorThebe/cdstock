import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone } from 'lucide-react';
import { authService } from '@/lib/auth';
import { databaseService } from '@/lib/database';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: string;
}

export const Profile: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const user = authService.getCurrentUser();
      if (user) {
        const profile = await databaseService.getUserProfile(user.id);
        const userData = { ...user, ...profile };
        setCurrentUser(userData);
        setFormData({ name: userData.name, phone: userData.phone || '' });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsLoading(true);
    try {
      await databaseService.saveUserProfile({
        user_id: currentUser.id,
        name: formData.name,
        phone: formData.phone
      });
      
      const updatedUser = { ...currentUser, name: formData.name, phone: formData.phone };
      setCurrentUser(updatedUser);
      
      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Unable to load profile</p>
          <Button onClick={getCurrentUser} className="mt-4">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <Avatar className="h-16 w-16 lg:h-20 lg:w-20 mx-auto sm:mx-0">
          <AvatarImage src={currentUser.avatar_url} />
          <AvatarFallback className="text-base lg:text-lg">
            {currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left">
          <h1 className="text-xl lg:text-2xl font-bold">{currentUser.name}</h1>
          <div className="flex items-center justify-center sm:justify-start text-muted-foreground text-sm lg:text-base mt-1">
            <Mail className="h-4 w-4 mr-1" />
            {currentUser.email}
          </div>
          {currentUser.phone && (
            <div className="flex items-center justify-center sm:justify-start text-muted-foreground text-sm mt-1">
              <Phone className="h-4 w-4 mr-1" />
              {currentUser.phone}
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1234567890"
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};