import type { AuthContextType } from "@/context/authContextValue";

const API_BASE = import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:5001";

export async function fetchUserId(token: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Kunne ikke hente bruker");
  }

  const data = await res.json();

  return data.id; 
}