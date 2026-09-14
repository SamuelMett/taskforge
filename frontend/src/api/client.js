import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});

export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

// If a request that was sent with a token comes back 401, the session has
// expired or the token is otherwise invalid -- clear it and send the user
// back to login instead of leaving a raw "Invalid token" error on screen.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const hadAuthHeader = Boolean(error?.config?.headers?.Authorization);
    if (error?.response?.status === 401 && hadAuthHeader) {
      localStorage.removeItem("token");
      setAuthToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(error);
  }
);
