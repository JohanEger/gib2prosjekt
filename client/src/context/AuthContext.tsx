import {
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { AuthContext, type User } from "./authContextValue";

const API_BASE = import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5001";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token"),
  );
  const [loading, setLoading] = useState(true);

  // On mount (or when token changes), fetch the current user
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const fetchUser = async () => {
      if (!token) {
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Invalid token");
        const data: User = await res.json();
        if (!cancelled) setUser(data);
      } catch {
        // Token expired or invalid — clear it
        localStorage.removeItem("token");
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      }
    };

    fetchUser().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? "Innlogging feilet");
    }

    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ?? "Registrering feilet");
    }

    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
