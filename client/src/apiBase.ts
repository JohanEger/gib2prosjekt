/** Backend-URL for fetch fra nettleseren. Tom build-time env (f.eks. Docker uten ARG) skal ikke gi relativ URL mot nginx. */
const raw = import.meta.env.VITE_BACKEND_BASE_URL;
export const API_BASE =
  typeof raw === "string" && raw.trim() !== ""
    ? raw.trim()
    : "http://localhost:5001";
