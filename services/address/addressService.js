import axios from "axios";
import { BASE_URL_ADDRESS } from "@env";

// Le service d'adresses refuse les recherches de moins de 3 caractères
// (erreur 400). On n'appelle donc l'API qu'à partir de 3 caractères.
const MIN_QUERY_LENGTH = 3;

const getAddressesByQuery = async (query) => {
  const text = (query || "").trim();
  if (text.length < MIN_QUERY_LENGTH) {
    return [];
  }
  try {
    const response = await axios.get(BASE_URL_ADDRESS, {
      params: {
        q: text,
      },
    });

    return response.data.features;
  } catch (error) {
    console.error("Error fetching address data:", error);
    throw error;
  }
};

export { getAddressesByQuery };
