import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { UserProfile, Business, Branch } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  session: any | null;
  business: Business | null;
  branches: Branch[];
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: any }>;
  signUp: (email: string, pass: string, fullName: string, businessName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  business: null,
  branches: [],
  selectedBranch: null,
  setSelectedBranch: () => {},
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
  refreshBusiness: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBusinessAndBranches = async (userId: string) => {
    try {
      let bus: Business | null = null;
      // 1. Check if user owns a business (column in DB is owner_id)
      const { data: bData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (bData && bData.length > 0) {
        bus = bData[0] as Business;
      } else {
        // 2. Check if user is an organization member
        const { data: memberList } = await supabase
          .from('organization_members')
          .select('business_id, businesses(*)')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (memberList && memberList.length > 0 && (memberList[0] as any).businesses) {
          bus = (memberList[0] as any).businesses as Business;
        }
      }

      if (bus) {
        setBusiness(bus);
        // Fetch branches
        const { data: branchData } = await supabase
          .from('branches')
          .select('*')
          .eq('business_id', bus.id)
          .order('is_main', { ascending: false });

        if (branchData) {
          setBranches(branchData as Branch[]);
          if (branchData.length > 0) {
            setSelectedBranch(branchData[0] as Branch);
          } else {
            setSelectedBranch(null);
          }
        }
      } else {
        // 3. Create default business if none exists
        const { data: newB, error: createError } = await supabase
          .from('businesses')
          .insert({
            owner_id: userId,
            business_name: 'My Business',
            currency: 'SLL',
            business_type: 'retail',
          })
          .select()
          .single();

        if (newB) {
          setBusiness(newB as Business);
        } else {
          console.error('Failed to create default business:', createError);
        }
      }

      // Fetch profile to get first_name and last_name
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profData) {
        const fullName = profData.first_name
          ? `${profData.first_name}${profData.last_name ? ' ' + profData.last_name : ''}`
          : undefined;
        setUser((prev) => (prev ? { ...prev, full_name: fullName || prev.full_name } : prev));
      }
    } catch (e) {
      console.error('Error fetching business info:', e);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name,
        });
        fetchBusinessAndBranches(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name,
        });
        fetchBusinessAndBranches(session.user.id);
      } else {
        setUser(null);
        setBusiness(null);
        setBranches([]);
        setSelectedBranch(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    setLoading(false);
    return { error };
  };

  const signUp = async (email: string, pass: string, fullName: string, businessName: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (!error && data.user) {
      // Create initial business profile
      await supabase.from('businesses').insert({
        owner_id: data.user.id,
        business_name: businessName || 'My Business',
        currency: 'SLL',
        business_type: 'retail',
      });
    }

    setLoading(false);
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshBusiness = async () => {
    if (user?.id) {
      await fetchBusinessAndBranches(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        business,
        branches,
        selectedBranch,
        setSelectedBranch,
        loading,
        signIn,
        signUp,
        signOut,
        refreshBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
