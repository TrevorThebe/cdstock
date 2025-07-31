import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({ 
    email: 'admin@cdstock.com', // Pre-filled for testing
    password: 'password'        // Pre-filled for testing
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Trim and validate inputs
      const email = formData.email.trim();
      const password = formData.password.trim();
      
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      console.log('Attempting login with:', { email, password }); // Debug log

      const result = await authService.login(email, password);
      console.log('Login result:', result); // Debug log

      if (result.error) {
        throw result.error;
      }

      toast({ 
        title: 'Success', 
        description: 'Logged in successfully',
        duration: 2000 
      });
      onSuccess();
      
    } catch (error: any) {
      console.error('Login error:', error); // Detailed error logging
      
      let errorMessage = 'Invalid credentials';
      if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email first';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({ 
        title: 'Login Failed', 
        description: errorMessage,
        variant: 'destructive',
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access CD Stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              placeholder="admin@cdstock.com"
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                placeholder="password"
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : 'Login'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={onSwitchToRegister}
          >
            Create New Account
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <button 
            type="button"
            className="text-blue-600 hover:underline"
            onClick={async () => {
              try {
                await authService.resetPassword(formData.email);
                toast({
                  title: 'Email Sent',
                  description: 'Check your inbox for password reset instructions',
                });
              } catch (error) {
                toast({
                  title: 'Error',
                  description: 'Failed to send reset email',
                  variant: 'destructive'
                });
              }
            }}
          >
            Forgot password?
          </button>
        </div>
      </CardContent>
    </Card>
  );
};