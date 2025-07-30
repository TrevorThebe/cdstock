// components/UserProfile.tsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const UserProfile = ({ userId }: { userId: string }) => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // Get profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Get last 5 logins
      const { data: statsData } = await supabase
        .from('user_login_stats')
        .select('*')
        .eq('user_id', userId)
        .order('login_time', { ascending: false })
        .limit(5);

      setProfile(profileData);
      setStats(statsData || []);
    };

    loadData();
  }, [userId]);

  return (
    <div>
      <h2>Profile</h2>
      {profile && (
        <div>
          <p>Username: {profile.username}</p>
          <p>Name: {profile.full_name}</p>
        </div>
      )}

      <h3>Recent Logins</h3>
      <ul>
        {stats.map(stat => (
          <li key={stat.id}>
            {new Date(stat.login_time).toLocaleString()} - {stat.ip_address}
          </li>
        ))}
      </ul>
    </div>
  );
};