import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  setSession: (session) => set({ session }),
  
  signIn: async (username, password) => {
    const email = `${username.toLowerCase()}@fitnesschallenge.local`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    set({ session: data.session });
  },
  
  signUp: async (username, password) => {
    // First check if username exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('username')
      .eq('username', username.toLowerCase());
      
    if (existingUsers && existingUsers.length > 0) {
      throw new Error('Username already taken');
    }
    
    // Create auth user
    const email = `${username.toLowerCase()}@fitnesschallenge.local`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase()
        }
      }
    });
    
    if (error) throw error;
    
    if (data.user) {
      // Create user record
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          username: username.toLowerCase()
        });

      if (userError) throw userError;
    }
    
    set({ session: data.session });
  },
  
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));