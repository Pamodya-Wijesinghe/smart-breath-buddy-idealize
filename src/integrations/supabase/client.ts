import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

const dummyDevices = [
  { id: 'dev1', user_id: 'mock', battery_level: 85, is_charging: false, last_sync: new Date().toISOString() }
];

const dummyLogs = [
  { id: 'log1', user_id: 'mock', timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), result: 'correct', inhalation_strength: 8.5, duration: 4.2 },
  { id: 'log2', user_id: 'mock', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), result: 'too_fast', inhalation_strength: 9.1, duration: 2.1 },
  { id: 'log3', user_id: 'mock', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), result: 'wrong_angle', inhalation_strength: 5.5, duration: 3.8 },
  { id: 'log4', user_id: 'mock', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), result: 'correct', inhalation_strength: 7.9, duration: 4.0 },
  { id: 'log5', user_id: 'mock', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), result: 'too_weak', inhalation_strength: 3.2, duration: 4.5 }
];

const dummyDiary = [
  { id: 'diary1', user_id: 'mock', date: new Date().toISOString(), symptom_notes: 'Felt short of breath after running.', triggers: 'Exercise', inhaler_uses: 2, symptom_severity: 6 }
];

let listeners: any[] = [];

// A mock Supabase client for the prototype
export const supabase = {
  auth: {
    getUser: async () => {
      const user = auth.currentUser;
      return { data: { user: user ? { id: user.uid, email: user.email } : { id: 'mock', email: 'demo@example.com' } } };
    },
    getSession: async () => {
      const user = auth.currentUser;
      return { data: { session: { user: user ? { id: user.uid, email: user.email } : { id: 'mock', email: 'demo@example.com' } } } };
    },
    onAuthStateChange: (callback: any) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        const session = { user: user ? { id: user.uid, email: user.email } : { id: 'mock', email: 'demo@example.com' } };
        callback('SIGNED_IN', session);
      });
      return { data: { subscription: { unsubscribe } } };
    },
    signOut: async () => {
      await firebaseSignOut(auth);
      return { error: null };
    }
  },
  from: (table: string) => {
    return {
      select: (columns?: string) => {
        let isSingle = false;
        let chain = {
          eq: (field: string, value: any) => chain,
          gte: (field: string, value: any) => chain,
          order: (field: string, opts?: any) => chain,
          limit: (num: number) => chain,
          single: () => { isSingle = true; return chain; },
          then: (resolve: any) => {
            let data: any = [];
            if (table === 'devices') data = dummyDevices;
            if (table === 'inhalation_logs') data = dummyLogs;
            if (table === 'asthma_diary') data = dummyDiary;
            
            if (isSingle) {
              resolve({ data: data.length > 0 ? data[0] : null, error: null });
            } else {
              resolve({ data: data, error: null });
            }
          }
        };
        return chain;
      },
      upsert: (data: any) => {
        if (table === 'asthma_diary') dummyDiary.push({ ...data, id: Math.random().toString() });
        let chain = {
          then: (resolve: any) => resolve({ data: null, error: null })
        };
        return chain;
      },
      insert: (data: any) => {
        if (table === 'inhalation_logs') dummyLogs.push({ ...data, id: Math.random().toString(), timestamp: new Date().toISOString() });
        listeners.forEach(l => l(data));
        let chain = {
          single: () => chain,
          then: (resolve: any) => resolve({ data: null, error: null })
        };
        return chain;
      }
    };
  },
  channel: (name: string) => ({
    on: (event: string, filter: any, callback: any) => {
      listeners.push(callback);
      return supabase.channel(name);
    },
    subscribe: () => supabase.channel(name),
  }),
  removeChannel: (channel: any) => {}
};