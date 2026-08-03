import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Device {
  id: string;
  battery_level: number;
  is_charging: boolean;
  last_sync: string;
  esp32_id: string;
  firmware_version: string | null;
}

export const useRealtimeDevice = (userId: string | undefined) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Fetch device data
    const fetchDevice = async () => {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        setDevice(data);
      }
      setLoading(false);
    };

    fetchDevice();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('device_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setDevice(payload.new as Device);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { device, loading };
};
