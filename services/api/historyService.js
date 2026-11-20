import { client, isLoggedIn } from "./apiClient";

// Historique des recherches, stocké côté serveur dans MongoDB (NoSQL).
// Ces fonctions ne font jamais échouer l'appli : l'historique est un confort,
// pas une fonction vitale. En cas de problème, on renvoie simplement une
// liste vide ou on ignore l'erreur.

// Enregistre qu'une ville vient d'être consultée (si l'utilisateur est connecté).
export const recordSearch = async (city) => {
  try {
    if (!city || !(await isLoggedIn())) {
      return;
    }
    await client.post("/api/history", { city });
  } catch (error) {
    console.warn("Historique non enregistré", error.message);
  }
};

// Dernières villes consultées : [{ city, count, searchedAt }]
export const getRecentSearches = async (limit = 5) => {
  try {
    const { data } = await client.get("/api/history", { params: { limit } });
    return data;
  } catch (error) {
    console.warn("Historique indisponible", error.message);
    return [];
  }
};

export const clearHistory = async () => {
  await client.delete("/api/history");
};
