import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@env";

// Client HTTP unique vers l'API MeteoAPP (backend Node/Express + PostgreSQL).
// Le jeton de connexion (JWT) est la SEULE chose conservée sur le téléphone :
// les favoris et feedbacks, eux, vivent en base de données.
const TOKEN_KEY = "authToken";

export const client = axios.create({
  baseURL: API_URL,
  // 60 s : l'API gratuite s'endort après 15 min sans trafic et met jusqu'à
  // ~1 minute à se réveiller à la première requête.
  timeout: 60000,
});

// Ajoute automatiquement "Authorization: Bearer <jeton>" à chaque requête.
client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const saveToken = (token) => AsyncStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => AsyncStorage.removeItem(TOKEN_KEY);
export const getToken = () => AsyncStorage.getItem(TOKEN_KEY);
export const isLoggedIn = async () => (await getToken()) !== null;

// Message lisible pour l'utilisateur, quelle que soit la cause de l'erreur.
export const getErrorMessage = (error) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.request) {
    return "Serveur injoignable. Vérifiez votre connexion.";
  }
  return "Une erreur est survenue.";
};
