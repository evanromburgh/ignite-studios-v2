import { supabase } from './supabase';
import { AppUser } from '../types';

async function fetchRole(userId: string): Promise<AppUser['role']> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) return 'user';
    return (data.role as AppUser['role']) ?? 'user';
  } catch {
    return 'user';
  }
}

function mapUserSync(supabaseUser: any): AppUser | null {
  if (!supabaseUser) return null;
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? null,
    displayName: supabaseUser.user_metadata?.display_name ?? null,
    role: 'user',
  };
}

export const authService = {
  subscribeToAuth(callback: (user: AppUser | null) => void) {
    const resolveUser = async (supabaseUser: any) => {
      const user = mapUserSync(supabaseUser);
      if (!user) {
        callback(null);
        return;
      }
      callback(user);
      const role = await fetchRole(user.id);
      if (role !== user.role) {
        callback({ ...user, role });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      resolveUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      resolveUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  },

  async signUp(email: string, password: string, name: string, firstName?: string, lastName?: string, phone?: string) {
    console.log('Signing up user:', { email, hasPassword: !!password, name, firstName, lastName });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });
    
    if (error) {
      console.error('Supabase signup error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      throw error;
    }
    
    console.log('Signup successful:', { userId: data.user?.id, email: data.user?.email });

    // Create Lead in Zoho CRM (fire-and-forget, don't block on errors)
    if (data.user && firstName && lastName) {
      console.log('Attempting to create Zoho Lead for:', email);
      console.log('User data:', { userId: data.user.id, email: data.user.email });
      
      // Use the session from signup response if available, otherwise wait for auth state
      const createLead = async () => {
        try {
          // Get current session - try multiple times if needed
          let session = null;
          let attempts = 0;
          while (!session && attempts < 5) {
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('Session error:', sessionError);
              break;
            }
            
            if (currentSession) {
              session = currentSession;
              break;
            }
            
            attempts++;
            if (attempts < 5) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
          
          if (!session) {
            console.warn('No session available after signup - user may need to confirm email first');
            return;
          }
          
          console.log('Session available, calling create-lead function');
          console.log('Session token present:', !!session.access_token);
          
          const { data: responseData, error: invokeError } = await supabase.functions.invoke('create-lead', {
            body: {
              firstName,
              lastName,
              email,
              phone: phone || '',
            },
          });
          
          if (invokeError) {
            console.error('Zoho Lead creation error:', invokeError);
            console.error('Error details:', JSON.stringify(invokeError, null, 2));
          } else {
            console.log('Zoho Lead created successfully:', responseData);
          }
        } catch (err: any) {
          console.error('Failed to invoke create-lead function:', err);
          console.error('Error details:', err.message, err.stack);
        }
      };
      
      // Start immediately, but it will retry if session isn't ready
      createLead();
    } else {
      console.warn('Cannot create Zoho Lead - missing data:', { 
        hasUser: !!data.user, 
        firstName, 
        lastName 
      });
    }

    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
