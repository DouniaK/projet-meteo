import axios from "axios";
import { API_KEY, BASE_URL } from "@env";

/**
 * API Call => retrieve weather informations by city
 * @param city string
 * @returns Object
 */
const getWeatherByCity = async (city, metric) => {
  try {
    const response = await axios.get(`${BASE_URL}weather`, {
      params: {
        q: city,
        units: metric,
        lang: "fr",
        appid: API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
};

/**
 * Récupère les informations météorologiques par coordonnées géographiques
 * @param {number} latitude Latitude
 * @param {number} longitude Longitude
 * @returns {Promise<Object>}
 */
const getWeatherByCoordinates = async (latitude, longitude, metric) => {
  try {
    const response = await axios.get(`${BASE_URL}weather`, {
      params: {
        lat: latitude,
        lon: longitude,
        units: metric,
        lang: "fr",
        appid: API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données météorologiques :",
      error
    );
    throw error;
  }
};

/**
 * Recherche une ville n'importe où dans le monde (pas seulement en France,
 * contrairement à l'API adresse.gouv.fr utilisée sur l'écran d'accueil) et
 * retourne ses coordonnées GPS. Utilisé par la carte météo pour permettre
 * de consulter une autre ville, y compris à l'étranger.
 * @param {string} city Nom de la ville recherchée
 * @returns {Promise<{name: string, lat: number, lon: number, country: string}>}
 */
const getCoordinatesByCityName = async (city) => {
  try {
    const response = await axios.get(
      "https://api.openweathermap.org/geo/1.0/direct",
      {
        params: { q: city, limit: 1, appid: API_KEY },
      }
    );
    if (!response.data || response.data.length === 0) {
      throw new Error("Ville introuvable");
    }
    return response.data[0];
  } catch (error) {
    console.error("Erreur lors du géocodage de la ville :", error);
    throw error;
  }
};

export {
  getWeatherByCity,
  getWeatherByCoordinates,
  getCoordinatesByCityName,
};
