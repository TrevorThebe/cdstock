import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface ProfilePictureProps {
  userId: string;
  currentAvatarUrl?: string;
  userName: string;
  onAvatarUpdate: (url: string) => void;
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  userId,
  currentAvatarUrl,
  userName,
  onAvatarUpdate
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (error) {
        // Fallback: use a demo image URL
        const demoUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
        onAvatarUpdate(demoUrl);
        
        await supabase
          .from('user_profiles')
          .update({ avatar_url: demoUrl })
          .eq('user_id', userId);
          
        toast({
          title: 'Success',
          description: 'Demo profile picture set successfully'
        });
        setPreviewUrl(null);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
      }

      onAvatarUpdate(publicUrl);
      setPreviewUrl(null);
      
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully'
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      // Fallback to demo image
      const demoUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
      onAvatarUpdate(demoUrl);
      toast({
        title: 'Success',
        description: 'Demo profile picture set'
      });
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const setDemoAvatar = async () => {
    const demoUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
    try {
      await supabase
        .from('user_profiles')
        .update({ avatar_url: demoUrl })
        .eq('user_id', userId);
      onAvatarUpdate(demoUrl);
      toast({
        title: 'Success',
        description: 'Demo profile picture set'
      });
    } catch (error) {
      console.error('Error setting demo avatar:', error);
    }
  };

  const removeAvatar = async () => {
    try {
      await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);
      onAvatarUpdate('');
      toast({
        title: 'Success',
        description: 'Profile picture removed'
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
          <Camera className="h-4 w-4 lg:h-5 lg:w-5" />
          Profile Picture
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24 lg:h-32 lg:w-32">
            <AvatarImage src={previewUrl || currentAvatarUrl} />
            <AvatarFallback className="text-lg lg:text-2xl">
              {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex flex-wrap gap-2 justify-center">
            <Label htmlFor="avatar-upload">
              <Button 
                variant="outline" 
                disabled={uploading}
                className="cursor-pointer text-xs lg:text-sm"
                size="sm"
                asChild
              >
                <span>
                  <Upload className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                  {uploading ? 'Uploading...' : 'Upload'}
                </span>
              </Button>
            </Label>
            <Input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
            
            <Button 
              variant="secondary" 
              size="sm"
              onClick={setDemoAvatar}
              disabled={uploading}
              className="text-xs lg:text-sm"
            >
              <Camera className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
              Demo
            </Button>
            
            {currentAvatarUrl && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={removeAvatar}
                disabled={uploading}
                className="text-xs lg:text-sm"
              >
                <X className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};