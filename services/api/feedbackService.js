import { client } from "./apiClient";

// Envoie la condition météo réellement observée dans une ville.
// conditionCode : code d'icône OpenWeatherMap ("01d", "10d", ...)
export const sendFeedback = async (city, conditionCode) => {
  const { data } = await client.post("/api/feedbacks", { city, conditionCode });
  return data;
};
