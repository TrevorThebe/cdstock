import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/contexts/AppContext';
import { authService } from '@/lib/auth';
import { NotificationSender } from '@/components/admin/NotificationSender';
import { SingleUserNotificationSender } from '@/components/admin/SingleUserNotificationSender';
import { NotificationHistory } from '@/components/admin/NotificationHistory';
import { AllNotificationsViewer } from '@/components/admin/AllNotificationsViewer';
import { Shield, Bell, Users, History, Eye } from 'lucide-react';

export const Admin: React.FC = () => {
  const { currentUser } = useAppContext();
  
  // Get user from context or auth service
  const user = currentUser || authService.getCurrentUser();
  
  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Please log in to access admin panel.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== 'admin' && user.role !== 'super') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome, {user.name || user.email}
        </p>
      </div>
      
      <Tabs defaultValue="send-all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send-all" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Send to All
          </TabsTrigger>
          <TabsTrigger value="send-user" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Send to User
          </TabsTrigger>
          <TabsTrigger value="my-history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            My History
          </TabsTrigger>
          <TabsTrigger value="all-notifications" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            All Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send-all">
          <NotificationSender currentUser={user} />
        </TabsContent>

        <TabsContent value="send-user">
          <SingleUserNotificationSender currentUser={user} />
        </TabsContent>

        <TabsContent value="my-history">
          <NotificationHistory currentUser={user} />
        </TabsContent>

        <TabsContent value="all-notifications">
          <AllNotificationsViewer currentUser={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
};