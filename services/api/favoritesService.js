import { client } from "./apiClient";

// Chaque favori : { id, label }
export const getFavorites = async () => {
  const { data } = await client.get("/api/favorites");
  return data;
};

// Lève une erreur avec response.status === 409 si le favori existe déjà.
export const addFavorite = async (label) => {
  const { data } = await client.post("/api/favorites", { label });
  return data;
};

export const removeFavorite = async (cityId) => {
  await client.delete(`/api/favorites/${cityId}`);
};
