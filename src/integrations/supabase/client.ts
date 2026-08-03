import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

// In-memory dummy data store for the prototype
const dummySessions: any[] = [];
let listeners: any[] = [];

// A mock Supabase client for the prototype
export const supabase = {
  auth: {
    getUser: async () => {
      const user = auth.currentUser;
      return { data: { user: user ? { id: user.uid, email: user.email } : null } };
    },
    getSession: async () => {
      const user = auth.currentUser;
      return { data: { session: user ? { user: { id: user.uid, email: user.email } } : null } };
    },
    onAuthStateChange: (callback: any) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        const session = user ? { user: { id: user.uid, email: user.email } } : null;
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
        let chain = {
          eq: (field: string, value: any) => chain,
          gte: (field: string, value: any) => chain,
          order: (field: string, opts?: any) => chain,
          limit: (num: number) => chain,
          single: () => chain,
          then: (resolve: any) => resolve({ data: dummySessions.length ? dummySessions[0] : null, error: null })
        };
        return chain;
      },
      insert: (data: any) => {
        dummySessions.push({ ...data, id: Math.random().toString(), date: new Date().toISOString(), timestamp: new Date().toISOString() });
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