// Mémorise le dernier lieu affiché sur l'écran Météo (coordonnées, nom,
// vent) pour que l'onglet Carte s'ouvre directement au bon endroit.
// Un simple module partagé suffit : pas besoin d'une bibliothèque de state.
let currentPlace = null;

export const setCurrentPlace = (weather) => {
  if (!weather?.coord) return;
  currentPlace = {
    latitude: weather.coord.lat,
    longitude: weather.coord.lon,
    cityName: weather.name,
    windDeg: weather.wind?.deg,
    windSpeed: weather.wind?.speed,
  };
};

export const getCurrentPlace = () => currentPlace;
