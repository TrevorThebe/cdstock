import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardNotificationsProps {
    count: number;
}

export const DashboardNotifications: React.FC<DashboardNotificationsProps> = ({ count }) => (
    <Link to="/notifications" className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <Badge variant={count > 0 ? "destructive" : "secondary"}>{count}</Badge>
        <span>Notifications</span>
    </Link>
);
