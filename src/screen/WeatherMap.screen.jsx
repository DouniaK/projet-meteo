import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  TextInput,
  Keyboard,
} from "react-native";
import { WebView } from "react-native-webview";
import { Appbar, ActivityIndicator } from "react-native-paper";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { getCurrentPlace } from "../state/currentPlace";
import { API_KEY } from "@env";
import {
  getCoordinatesByCityName,
  getWeatherByCoordinates,
} from "../../services/weather/weatherService";

/**
 * Écran "Carte météo" : carte interactive du monde (fond CARTO Voyager,
 * basé sur les données OpenStreetMap)
 * avec une couche météo en temps réel superposée (vent, température ou
 * précipitations), fournie par les tuiles gratuites d'OpenWeatherMap.
 *
 * Les couleurs de la légende reprennent EXACTEMENT les paliers officiels
 * publiés par OpenWeatherMap (openweathermap.org/api/map_legend), pour que
 * la légende corresponde vraiment aux couleurs affichées sur la carte.
 *
 * La direction du vent (flèche) n'est pas fournie par les tuiles gratuites :
 * elle est donc dessinée nous-mêmes sur la carte, à partir de la donnée
 * wind.deg déjà récupérée par l'application (WeatherScreen), ce qui reste
 * 100% gratuit et fiable.
 */

const LAYERS = [
  { key: "wind_new", label: "Vent", icon: "weather-windy", accent: "#2FB6A3" },
  { key: "temp_new", label: "Température", icon: "thermometer", accent: "#FF8A3D" },
  { key: "precipitation_new", label: "Précipitations", icon: "weather-rainy", accent: "#4A90E2" },
];

// Paliers officiels OpenWeatherMap (source : openweathermap.org/api/map_legend)
const LEGENDS = {
  temp_new: {
    unit: "°C",
    stops: [
      { value: "-40°C et moins", color: "#821692" },
      { value: "-20°C", color: "#208cec" },
      { value: "0°C", color: "#23dddd" },
      { value: "20°C", color: "#fff028" },
      { value: "30°C et plus", color: "#fc8014" },
    ],
  },
  wind_new: {
    unit: "m/s",
    stops: [
      { value: "1-5 m/s", color: "#eecece" },
      { value: "5-15 m/s", color: "#b364bc" },
      { value: "15-25 m/s", color: "#3f213b" },
      { value: "25-50 m/s", color: "#744cac" },
      { value: "50 m/s et plus", color: "#4600af" },
    ],
  },
  precipitation_new: {
    unit: "mm",
    stops: [
      { value: "Faible (< 1mm)", color: "#6e6ecd" },
      { value: "Modérée (1-10mm)", color: "#5050e1" },
      { value: "Forte (> 10mm)", color: "#1414ff" },
    ],
  },
};

function buildHtml(latitude, longitude, cityName, apiKey, initialLayer, windDeg) {
  const lat = latitude ?? 48.8566;
  const lon = longitude ?? 2.3522;
  const safeCity = (cityName || "Position actuelle").replace(/"/g, "'");
  const hasWind = windDeg !== undefined && windDeg !== null;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #0A3A38; }
    .leaflet-control-attribution { font-size: 9px; }
    .wind-arrow {
      font-size: 34px;
      color: #FFEB3B;
      text-shadow: 0 0 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9);
      transform-origin: center center;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([${lat}, ${lon}], 6);

    // Fond de carte CARTO Voyager : rendu moderne et coloré (routes, villes,
    // eau bien distinguées), gratuit et sans clé API, contrairement au style
    // "brut" des tuiles OpenStreetMap par défaut.
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    let marker = L.marker([${lat}, ${lon}]).addTo(map).bindPopup("${safeCity}").openPopup();
    let windMarker = null;

    function setWindArrow(lat, lon, deg) {
      if (windMarker) {
        map.removeLayer(windMarker);
        windMarker = null;
      }
      if (deg === null || deg === undefined) return;
      const windIcon = L.divIcon({
        className: '',
        html: '<div class="wind-arrow" style="transform: rotate(' + deg + 'deg);">&#8593;</div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      windMarker = L.marker([lat, lon], { icon: windIcon, interactive: false }).addTo(map);
    }

    setWindArrow(${lat}, ${lon}, ${hasWind ? windDeg : "null"});

    // Permet au composant React Native de déplacer la carte vers une
    // nouvelle ville recherchée (France ou étranger), sans recharger toute
    // la WebView : on repositionne juste la vue, le marqueur et la flèche.
    window.setLocation = function (lat, lon, name, deg) {
      map.setView([lat, lon], 6);
      marker.setLatLng([lat, lon]).bindPopup(name).openPopup();
      setWindArrow(lat, lon, deg);
    };

    let weatherLayer = null;

    function setLayer(layerKey) {
      if (weatherLayer) {
        map.removeLayer(weatherLayer);
      }
      weatherLayer = L.tileLayer(
        'https://tile.openweathermap.org/map/' + layerKey + '/{z}/{x}/{y}.png?appid=${apiKey}',
        { opacity: 0.7, maxZoom: 18 }
      );
      weatherLayer.addTo(map);
    }

    setLayer("${initialLayer}");
    window.setLayer = setLayer;
  </script>
</body>
</html>
`;
}

const MapScreen = () => {
  const route = useRoute();
  // Lieu de départ : celui affiché dans l'onglet Météo (ou Paris par défaut).
  const { latitude, longitude, cityName, windDeg, windSpeed } =
    route.params || getCurrentPlace() || {};
  const [activeLayer, setActiveLayer] = useState("wind_new");
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [displayedCity, setDisplayedCity] = useState(cityName);
  const [displayedWindDeg, setDisplayedWindDeg] = useState(windDeg);
  const [displayedWindSpeed, setDisplayedWindSpeed] = useState(windSpeed);
  const webviewRef = useRef(null);
  const shownPlaceRef = useRef(getCurrentPlace());

  // À chaque ouverture de l'onglet Carte : si l'onglet Météo affiche
  // désormais un autre lieu, la carte s'y déplace (sans se recharger).
  useFocusEffect(
    useCallback(() => {
      const place = getCurrentPlace();
      if (!place || place === shownPlaceRef.current) return;
      shownPlaceRef.current = place;
      setDisplayedCity(place.cityName);
      setDisplayedWindDeg(place.windDeg ?? null);
      setDisplayedWindSpeed(place.windSpeed ?? null);
      webviewRef.current?.injectJavaScript(
        `window.setLocation && window.setLocation(${place.latitude}, ${place.longitude}, ${JSON.stringify(
          place.cityName ?? ""
        )}, ${place.windDeg ?? "null"}); true;`
      );
    }, [])
  );

  const activeLayerInfo = LAYERS.find((l) => l.key === activeLayer);
  const legend = LEGENDS[activeLayer];

  // La carte est construite une seule fois avec la position initiale
  // (celle de l'écran météo) ; les recherches suivantes déplacent la vue
  // via window.setLocation, sans jamais recharger la WebView.
  const html = useMemo(
    () => buildHtml(latitude, longitude, cityName, API_KEY, activeLayer, windDeg),
    []
  );

  const handleSelectLayer = (layerKey) => {
    setActiveLayer(layerKey);
    webviewRef.current?.injectJavaScript(
      `window.setLayer && window.setLayer("${layerKey}"); true;`
    );
  };

  const handleSearchCity = async () => {
    if (!searchText.trim()) return;
    Keyboard.dismiss();
    setSearching(true);
    setSearchError(null);
    try {
      // Recherche mondiale (pas limitée à la France) via le géocodage
      // OpenWeatherMap, puis récupération de la météo (dont le vent) à
      // cet endroit pour mettre à jour la flèche de direction.
      const place = await getCoordinatesByCityName(searchText.trim());
      const weatherAtPlace = await getWeatherByCoordinates(
        place.lat,
        place.lon,
        "metric"
      );
      const label = place.country
        ? `${place.name}, ${place.country}`
        : place.name;

      setDisplayedCity(label);
      setDisplayedWindDeg(weatherAtPlace?.wind?.deg ?? null);
      setDisplayedWindSpeed(weatherAtPlace?.wind?.speed ?? null);
      webviewRef.current?.injectJavaScript(
        `window.setLocation && window.setLocation(${place.lat}, ${place.lon}, ${JSON.stringify(
          label
        )}, ${weatherAtPlace?.wind?.deg ?? "null"}); true;`
      );
      setSearchText("");
    } catch (error) {
      setSearchError(
        "Ville introuvable. Vérifiez l'orthographe (ex : « Tokyo », « New York »)."
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.appbarWrapper}>
        <Appbar.Header style={styles.appbar} statusBarHeight={0}>
          <Appbar.Content
            title={displayedCity ? `Carte météo — ${displayedCity}` : "Carte météo"}
            color="#FFF"
            titleStyle={styles.appbarTitle}
          />
        </Appbar.Header>
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearchCity}
          placeholder="Chercher une ville, n'importe où dans le monde…"
          placeholderTextColor="rgba(255,255,255,0.55)"
          style={styles.searchInput}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchCity}
          disabled={searching}
        >
          {searching ? (
            <ActivityIndicator size={16} color="#0A3A38" />
          ) : (
            <Text style={styles.searchButtonText}>OK</Text>
          )}
        </TouchableOpacity>
      </View>
      {searchError && <Text style={styles.searchErrorText}>{searchError}</Text>}

      <View style={styles.layerSwitcher}>
        {LAYERS.map((l) => (
          <TouchableOpacity
            key={l.key}
            style={[
              styles.layerButton,
              activeLayer === l.key && {
                backgroundColor: l.accent,
                borderColor: l.accent,
              },
            ]}
            onPress={() => handleSelectLayer(l.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.layerButtonText,
                activeLayer === l.key && styles.layerButtonTextActive,
              ]}
            >
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {displayedWindDeg !== undefined && displayedWindDeg !== null && (
        <View style={styles.windBanner}>
          <Text style={styles.windArrow}>↑</Text>
          <Text style={styles.windBannerText}>
            Vent actuel : {displayedWindSpeed ?? "?"} m/s — la flèche jaune
            sur la carte indique sa direction
          </Text>
        </View>
      )}

      <View style={styles.mapWrapper}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator animating color="#FFF" size="large" />
            <Text style={styles.loadingText}>Chargement de la carte…</Text>
          </View>
        )}
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>

      <View style={[styles.legendContainer, { borderTopColor: activeLayerInfo.accent }]}>
        <Text style={styles.legendTitle}>
          Légende — {activeLayerInfo.label} ({legend.unit})
        </Text>
        <View style={styles.gradientBarWrapper}>
          <View style={styles.gradientBar}>
            {legend.stops.map((s) => (
              <View
                key={s.value}
                style={[styles.gradientSegment, { backgroundColor: s.color, flex: 1 }]}
              />
            ))}
          </View>
        </View>
        <View style={styles.legendRow}>
          {legend.stops.map((item) => (
            <Text key={item.value} style={styles.legendLabel}>
              {item.value}
            </Text>
          ))}
        </View>
        <Text style={styles.legendNote}>
          Paliers officiels OpenWeatherMap · fond de carte OpenStreetMap.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A3A38",
  },
  appbarWrapper: {
    paddingTop: 45,
  },
  appbar: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  appbarTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  layerSwitcher: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 10,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 5,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    height: 34,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#0A3A38",
    fontWeight: "700",
    fontSize: 12,
  },
  searchErrorText: {
    color: "#FFB4B4",
    fontSize: 12,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  layerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  layerButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },
  layerButtonTextActive: {
    color: "#0A3A38",
  },
  windBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,235,59,0.15)",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  windArrow: {
    fontSize: 18,
    color: "#FFEB3B",
    marginRight: 8,
    fontWeight: "900",
  },
  windBannerText: {
    color: "#FFF",
    fontSize: 11.5,
    flex: 1,
  },
  mapWrapper: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 18,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A3A38",
    zIndex: 1,
    gap: 10,
  },
  loadingText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  legendContainer: {
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 10,
    borderTopWidth: 3,
  },
  legendTitle: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 13.5,
    marginBottom: 10,
  },
  gradientBarWrapper: {
    marginBottom: 6,
  },
  gradientBar: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  gradientSegment: {
    height: 12,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 9.5,
    flexShrink: 1,
    textAlign: "center",
  },
  legendNote: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 10,
  },
});

export default MapScreen;
