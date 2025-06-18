import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

export const CreateUsersButton: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createUsers = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(
        'https://zvamtuczyfpbmnfmsijm.supabase.co/functions/v1/00ef33fe-891a-43c4-a233-ecfe9f57022b',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            users: [
              {
                email: 'strevor@uwiniwin.co.za',
                password: 'trevor',
                name: 'Trevor Stevens',
                role: 'super'
              },
              {
                email: 'cosmodumpling1@gmail.com',
                password: 'petunia',
                name: 'Cosmo Dumpling',
                role: 'admin'
              }
            ]
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Success',
          description: 'Users created successfully',
        });
      } else {
        throw new Error('Failed to create users');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create users',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button 
      onClick={createUsers} 
      disabled={isCreating}
      className="mb-4"
    >
      {isCreating ? 'Creating...' : 'Create Admin Users'}
    </Button>
  );
};