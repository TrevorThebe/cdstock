import { useEffect, useState } from 'react';
import { authService } from '@/lib/supabase/auth';

export const UserProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profileData = await authService.getProfile(user.id);
      setProfile(profileData);

      // Get login stats
      const { data: statsData } = await supabase
        .from('user_login_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('login_time', { ascending: false })
        .limit(5);

      setStats(statsData || []);
    };

    loadData();
  }, []);

  if (!profile) return <div>Loading profile...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h2>Profile</h2>
        <p>Username: {profile.username}</p>
        <p>Name: {profile.full_name}</p>
      </div>
      
      <div>
        <h3>Recent Logins</h3>
        <ul className="space-y-2">
          {stats.map(stat => (
            <li key={stat.id} className="text-sm">
              {new Date(stat.login_time).toLocaleString()} - {stat.user_agent}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};