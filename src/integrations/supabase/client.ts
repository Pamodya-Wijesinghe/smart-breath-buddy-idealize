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

const dummyNotifications: any[] = [
  { id: 'notif1', user_id: 'mock', title: 'Incorrect Inhaler Technique Detected', message: 'Your inhalation was too fast (2.1s). Aim for a slow, steady breath over 4–5 seconds for best medicine delivery.', type: 'alert', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'notif2', user_id: 'mock', title: 'Wrong Device Angle', message: 'Inhaler was tilted at 45°. Keep the inhaler upright (90°) when inhaling to ensure full dose delivery.', type: 'alert', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'notif3', user_id: 'mock', title: 'Weak Inhalation Detected', message: 'Inhalation strength was too low (3.2 L/min). Breathe in more forcefully to draw the medicine deep into your lungs.', type: 'alert', is_read: false, created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'notif4', user_id: 'mock', title: 'Perfect Technique! 🎉', message: 'Great job! Your last inhalation was perfect — correct angle, speed, and strength. Keep it up!', type: 'success', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString() },
  { id: 'notif5', user_id: 'mock', title: 'Battery Low — 15%', message: 'Your Smart Spacer device battery is running low. Please charge it soon to continue monitoring.', type: 'battery', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: 'notif6', user_id: 'mock', title: 'Medication Reminder', message: 'You have not logged your morning dose today. Remember to take your preventer inhaler as prescribed.', type: 'info', is_read: true, created_at: new Date(Date.now() - 1000 * 60 * 60 * 49).toISOString() },
];

const dummyDiary = [
  { id: 'diary1', user_id: 'mock', date: new Date().toISOString(), symptom_notes: 'Felt short of breath after morning run. Used inhaler before exercise as precaution.', triggers: 'Exercise, cold air', medication_time: '07:30', inhaler_uses: 2, symptom_severity: 6 },
  { id: 'diary2', user_id: 'mock', date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), symptom_notes: 'Mild wheezing in the evening. Possibly triggered by dust while cleaning the house.', triggers: 'Dust, household cleaning', medication_time: '18:00', inhaler_uses: 1, symptom_severity: 4 },
  { id: 'diary3', user_id: 'mock', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), symptom_notes: 'Good day overall! No significant symptoms. Breathing felt comfortable throughout the day.', triggers: 'None', medication_time: '08:00', inhaler_uses: 0, symptom_severity: 2 },
  { id: 'diary4', user_id: 'mock', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), symptom_notes: 'Chest tightness in the morning due to cold weather. Took reliever inhaler twice.', triggers: 'Cold weather, smoke from neighbors', medication_time: '06:45', inhaler_uses: 3, symptom_severity: 7 },
  { id: 'diary5', user_id: 'mock', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), symptom_notes: 'Visited a friend with a cat. Allergy symptoms developed within an hour. Had to leave early.', triggers: 'Pet dander (cat), pollen', medication_time: '14:30', inhaler_uses: 3, symptom_severity: 8 },
  { id: 'diary6', user_id: 'mock', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), symptom_notes: 'Slight coughing at night. Slept propped up on two pillows. Symptoms settled by morning.', triggers: 'Night-time, possible reflux', medication_time: '22:00', inhaler_uses: 1, symptom_severity: 3 },
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
          then: (resolve: any, reject?: any) => {
            const promise = new Promise((res) => {
              let data: any = [];
              if (table === 'devices') data = dummyDevices;
              if (table === 'inhalation_logs') data = dummyLogs;
              if (table === 'asthma_diary') data = dummyDiary;
              if (table === 'notifications') data = dummyNotifications;
              
              if (isSingle) {
                res({ data: data.length > 0 ? data[0] : null, error: null });
              } else {
                res({ data: data, error: null });
              }
            });
            return promise.then(resolve, reject);
          },
          catch: (reject: any) => {
            return Promise.resolve({ data: null, error: null }).catch(reject);
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
      update: (data: any) => {
        let filterField = '';
        let filterVal: any = '';
        let chain = {
          eq: (field: string, value: any) => {
            // apply update when we have enough info
            if (table === 'notifications') {
              if (field === 'id') {
                const idx = dummyNotifications.findIndex(n => n.id === value);
                if (idx !== -1) dummyNotifications[idx] = { ...dummyNotifications[idx], ...data };
              } else {
                dummyNotifications.forEach((n, i) => {
                  if (n[field] === value) dummyNotifications[i] = { ...n, ...data };
                });
              }
            }
            return chain;
          },
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