import { client, saveToken, clearToken } from "./apiClient";

// Crée un compte puis connecte directement l'utilisateur.
export const register = async (email, password) => {
  const { data } = await client.post("/api/auth/register", { email, password });
  await saveToken(data.token);
  return data.user;
};

export const login = async (email, password) => {
  const { data } = await client.post("/api/auth/login", { email, password });
  await saveToken(data.token);
  return data.user;
};

export const logout = () => clearToken();
