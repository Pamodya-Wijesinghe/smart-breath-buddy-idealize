import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface InhalationLog {
  id: string;
  timestamp: string;
  result: string;
  inhalation_strength: number;
  duration: number;
  orientation_angle: number;
  feedback_message: string | null;
}

export const useRealtimeInhalationLogs = (userId: string | undefined) => {
  const [logs, setLogs] = useState<InhalationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Fetch initial logs
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('inhalation_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!error && data) {
        setLogs(data);
      }
      setLoading(false);
    };

    fetchLogs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('inhalation_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inhalation_logs',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setLogs((current) => [payload.new as InhalationLog, ...current].slice(0, 10));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { logs, loading };
};
