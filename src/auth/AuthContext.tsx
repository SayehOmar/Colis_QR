import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AuthUser,
  authGoogle,
  authLogin,
  authMe,
  authRegister,
  clearToken,
  readStoredToken,
  storeToken,
} from "./api";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, name?: string) => Promise<AuthUser>;
  loginWithGoogle: (input: {
    idToken?: string;
    accessToken?: string;
  }) => Promise<AuthUser>;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const existing = readStoredToken();
      if (!existing) {
        if (!cancelled) {
          setLoading(false);
        }
        return;
      }
      try {
        const profile = await authMe(existing);
        if (!cancelled) {
          setToken(existing);
          setUser(profile);
        }
      } catch {
        clearToken();
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyAuth = useCallback((accessToken: string, nextUser: AuthUser) => {
    storeToken(accessToken);
    setToken(accessToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authLogin({ email, password });
      applyAuth(result.access_token, result.user);
      return result.user;
    },
    [applyAuth]
  );

  const register = useCallback(
    async (email: string, password: string, name?: string) => {
      const result = await authRegister({ email, password, name });
      applyAuth(result.access_token, result.user);
      return result.user;
    },
    [applyAuth]
  );

  const loginWithGoogle = useCallback(
    async (input: { idToken?: string; accessToken?: string }) => {
      const result = await authGoogle(input);
      applyAuth(result.access_token, result.user);
      return result.user;
    },
    [applyAuth]
  );

  const refreshUser = useCallback(async () => {
    const existing = readStoredToken();
    if (!existing) {
      setUser(null);
      setToken(null);
      return null;
    }
    const profile = await authMe(existing);
    setToken(existing);
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      loginWithGoogle,
      refreshUser,
      logout,
    }),
    [user, token, loading, login, register, loginWithGoogle, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
