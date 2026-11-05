import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { supabase, signInWithGoogleOAuth } from '../lib/supabase';

const EMPTY_USER: User = {
  id: '',
  name: 'Tamu',
  email: '',
  phone: '',
  role: 'customer',
  registeredAt: new Date().toISOString().slice(0, 10),
  status: 'active'
};

const sendClientDebug = (tag: string, details: any = {}) => {
  try {
    fetch('/api/debug-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag,
        ...details,
        url: window.location.href,
        search: window.location.search,
        hash: window.location.hash,
        userAgent: navigator.userAgent
      })
    }).catch(() => {});
  } catch {}
};

interface AuthContextType {
  currentUser: User;
  role: Role;
  isAuthenticated: boolean;
  token: string | null;
  switchRole: (newRole: Role) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  register: (payload: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role?: Role;
  }) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('vitaria_token');
  });

  const [role, setRole] = useState<Role>(() => {
    return (localStorage.getItem('vitaria_role') as Role) || 'customer';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('vitaria_current_user');
    return saved ? JSON.parse(saved) : EMPTY_USER;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('vitaria_token');
  });

  // Verify server-side JWT session on load
  useEffect(() => {
    const storedToken = localStorage.getItem('vitaria_token');
    if (storedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Invalid session');
        })
        .then((json) => {
          if (json.success && json.user) {
            setCurrentUser(json.user);
            setRole(json.user.role);
            setIsAuthenticated(true);
          }
        })
        .catch(() => {
          localStorage.removeItem('vitaria_token');
          localStorage.removeItem('vitaria_current_user');
          localStorage.removeItem('vitaria_role');
          setIsAuthenticated(false);
          setCurrentUser(EMPTY_USER);
        });
    }
  }, []);

  // Listen to Supabase Google OAuth callback redirect & exchange PKCE code
  useEffect(() => {
    sendClientDebug('PAGE_LOAD_STATE', {
      hasStoredToken: !!localStorage.getItem('vitaria_token'),
      rawSearch: window.location.search,
      rawHash: window.location.hash
    });

    const handleOAuthCallback = async () => {
      // 1. Check for error in hash or query
      const hash = window.location.hash;
      const search = window.location.search;

      if (hash.includes('error=') || search.includes('error=')) {
        const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : search);
        const errorDesc = params.get('error_description') || params.get('error') || 'Gagal login via Google';
        console.warn('Supabase OAuth Error:', errorDesc);
        sendClientDebug('OAUTH_ERROR_RETURNED', { errorDesc });
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      // 2. Handle PKCE code exchange if ?code= is present in URL
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      if (code) {
        sendClientDebug('PKCE_CODE_DETECTED_IN_URL', { codeSnippet: code.slice(0, 10) + '...' });
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.warn('PKCE exchangeCodeForSession error:', error.message);
            sendClientDebug('PKCE_EXCHANGE_ERROR', { error: error.message });
          } else if (data?.session?.user) {
            sendClientDebug('PKCE_EXCHANGE_SUCCESS', { email: data.session.user.email });
            await handleSupabaseOAuthUser(data.session.user);
          }
        } catch (e: any) {
          console.warn('Exchange code exception:', e);
          sendClientDebug('PKCE_EXCHANGE_EXCEPTION', { exception: e?.message });
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }

      // 3. Check existing or active Supabase session
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          sendClientDebug('ACTIVE_SESSION_DETECTED', { email: session.user.email });
          await handleSupabaseOAuthUser(session.user);
        }
      } catch (e: any) {
        console.warn('getSession error:', e);
        sendClientDebug('GET_SESSION_ERROR', { error: e?.message });
      }
    };

    handleOAuthCallback();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      sendClientDebug('AUTH_STATE_CHANGE_EVENT', { event, email: session?.user?.email });
      if (session && session.user) {
        await handleSupabaseOAuthUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSupabaseOAuthUser = async (sbUser: any) => {
    try {
      const email = sbUser.email;
      const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0];
      const avatarUrl = sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || '';
      sendClientDebug('SYNCING_GOOGLE_USER_TO_DB', { email, name });

      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, avatarUrl, role: 'customer' })
      });

      const json = await res.json();
      sendClientDebug('SYNC_RESULT', { status: res.status, success: json.success, user: json.user });

      if (res.ok && json.success && json.user) {
        applyAuthSuccess(json.token, json.user);
      }
    } catch (err: any) {
      console.warn('OAuth session sync error:', err);
      sendClientDebug('SYNC_CATCH_ERROR', { error: err?.message });
    }
  };

  const applyAuthSuccess = (authToken: string, user: User) => {
    setToken(authToken);
    setCurrentUser(user);
    setRole(user.role);
    setIsAuthenticated(true);
    localStorage.setItem('vitaria_token', authToken);
    localStorage.setItem('vitaria_current_user', JSON.stringify(user));
    localStorage.setItem('vitaria_role', user.role);

    // Clean up Supabase OAuth hash fragments from URL
    if (window.location.hash && window.location.hash.includes('access_token')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const switchRole = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem('vitaria_role', newRole);
    if (currentUser) {
      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
      localStorage.setItem('vitaria_current_user', JSON.stringify(updated));
    }
  };

  // Real Email & Password Login
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, message: json.message || 'Gagal masuk. Periksa email dan kata sandi.' };
      }

      applyAuthSuccess(json.token, json.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  };

  // Real Registration
  const register = async (payload: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role?: Role;
  }): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name.trim(),
          email: payload.email.trim(),
          phone: payload.phone?.trim() || '',
          password: payload.password,
          role: payload.role || 'customer'
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, message: json.message || 'Pendaftaran gagal.' };
      }

      applyAuthSuccess(json.token, json.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: 'Server backend tidak dapat dihubungi.' };
    }
  };

  // Real Google Sign In via Supabase OAuth
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    sendClientDebug('CLICK_GOOGLE_LOGIN_BUTTON', { origin: window.location.origin, href: window.location.href });
    return await signInWithGoogleOAuth();
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setToken(null);
    setCurrentUser(EMPTY_USER);
    setIsAuthenticated(false);
    localStorage.removeItem('vitaria_token');
    localStorage.removeItem('vitaria_current_user');
  };

  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    try {
      const storedToken = localStorage.getItem('vitaria_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          id: currentUser?.id,
          name: data.name,
          phone: data.phone,
          avatarUrl: data.avatarUrl
        })
      });

      const json = await res.json();
      if (res.ok && json.success && json.user) {
        setCurrentUser(json.user);
        localStorage.setItem('vitaria_current_user', JSON.stringify(json.user));
        return { success: true, message: json.message || 'Profil berhasil diperbarui.' };
      }
    } catch (err: any) {
      console.warn('Backend updateProfile error:', err);
    }

    if (currentUser) {
      const updated = { ...currentUser, ...data };
      setCurrentUser(updated);
      localStorage.setItem('vitaria_current_user', JSON.stringify(updated));
    }
    return { success: true, message: 'Profil berhasil diperbarui secara lokal.' };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        token,
        switchRole,
        login,
        loginWithGoogle,
        logout,
        register,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
