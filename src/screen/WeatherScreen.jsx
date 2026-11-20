import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isLoggedIn, getErrorMessage } from "../../services/api/apiClient";
import { getFavorites, addFavorite } from "../../services/api/favoritesService";
import { recordSearch } from "../../services/api/historyService";
import { getWeatherByCoordinates } from "../../services/weather/weatherService";
import { getWeatherByCity } from "../../services/weather/weatherService";
import { ActivityIndicator, Appbar, Button } from "react-native-paper";
import moment from "moment";
import "moment/locale/fr";
moment.locale("fr");
import { DetailWeather } from "../components/details-weather.component";
import { useNavigation } from "@react-navigation/native";
import { setCurrentPlace } from "../state/currentPlace";

const WeatherScreen = (label) => {
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unit, setUnit] = useState("metric");
  const [lastUpdate, setLastUpdate] = useState(null);
  const navigation = useNavigation();
  const [isInFavorites, setIsInFavorites] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const toggleUnit = () => {
    setUnit(unit === "metric" ? "imperial" : "metric");
  };

  const selectedAddress = label?.route?.params?.paramKey;
  const paramLatitude = label?.route?.params?.latitude;
  const paramLongitude = label?.route?.params?.longitude;

  // On mappe désormais sur le code icône renvoyé par l'API (ex: "04d",
  // "10n"...) plutôt que sur le texte de description : ce code ne change
  // jamais selon la langue, contrairement à la description ("overcast
  // clouds" / "nuageux"), ce qui rend l'affichage de l'icône fiable même
  // maintenant que l'API répond en français (lang=fr).
  const getWeatherImage = (iconCode) => {
    if (!iconCode) return null;
    const baseCode = iconCode.slice(0, 2); // "04d" -> "04"
    const iconMapping = {
      "01": require("../assets/01d.png"),
      "02": require("../assets/02d.png"),
      "03": require("../assets/03d.png"),
      "04": require("../assets/04d.png"),
      "09": require("../assets/09d.png"),
      "10": require("../assets/10d.png"),
      "11": require("../assets/11d.png"),
      "13": require("../assets/13d.png"),
      "50": require("../assets/50d.png"),
    };

    return iconMapping[baseCode] || require("../assets/04d.png");
  };

  const shouldFetchData = () =>
    !lastUpdate || new Date().getTime() - lastUpdate > 30 * 60 * 1000;

  // Convertit un angle en degrés (0-360, fourni par l'API OpenWeatherMap
  // dans wind.deg) en direction cardinale lisible (français).
  const getCardinalDirection = (deg) => {
    if (deg === undefined || deg === null) return "";
    const directions = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        throw new Error("Permission to access location was denied");
      }

      const locationData = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      });
    } catch (error) {
      console.error(`Error getting location: ${error.message}`);
    }
  };

  const getWeatherData = async () => {
    try {
      if (location && shouldFetchData) {
        setErrorMessage(null);
        const { latitude, longitude } = location;
        const weatherData = await getWeatherByCoordinates(
          latitude,
          longitude,
          unit
        );

        setWeather(weatherData);
        setCurrentPlace(weatherData);
        setLoading(false);

        const updatedLastUpdate = new Date().getTime();
        setLastUpdate(updatedLastUpdate);
        await AsyncStorage.setItem(
          "lastUpdate",
          JSON.stringify(updatedLastUpdate)
        );
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      setErrorMessage(
        "Impossible de récupérer la météo de votre position. Vérifiez votre connexion et réessayez."
      );
    }
  };

  const getWeatherDataFromAddress = async () => {
    if (selectedAddress !== undefined) {
      setLoading(true);
      setErrorMessage(null);
      try {
        // On privilégie les coordonnées GPS de l'adresse (bien plus
        // fiables) quand elles sont disponibles ; sinon, on retombe sur
        // une recherche par nom de ville (cas des favoris déjà enregistrés
        // avant l'ajout des coordonnées).
        const weatherData =
          paramLatitude !== undefined && paramLongitude !== undefined
            ? await getWeatherByCoordinates(paramLatitude, paramLongitude, unit)
            : await getWeatherByCity(selectedAddress, unit);

        setWeather(weatherData);
        setCurrentPlace(weatherData);
        setLoading(false);
        // Mémorise la ville consultée dans l'historique (MongoDB), sans attendre.
        recordSearch(selectedAddress);
      } catch (err) {
        console.error(err);
        setLoading(false);
        setErrorMessage(
          `Météo introuvable pour « ${selectedAddress} ». Essayez une autre adresse.`
        );
      }
    }
  };

  const loadLastUpdate = async () => {
    try {
      const storedLastUpdate = await AsyncStorage.getItem("lastUpdate");
      if (storedLastUpdate) {
        setLastUpdate(JSON.parse(storedLastUpdate));
      }
    } catch (error) {
      console.error(
        "Error loading last update from AsyncStorage:",
        error.message
      );
    }
  };

  // Enregistre la ville en favori dans la base de données (via l'API).
  // Il faut être connecté : sinon on redirige vers l'écran de connexion.
  const saveToFavorites = async () => {
    if (!(await isLoggedIn())) {
      navigation.navigate("Auth");
      return;
    }
    try {
      await addFavorite(selectedAddress);
      setIsInFavorites(true);
      alert("Adresse enregistrée dans vos favoris !");
    } catch (error) {
      if (error.response?.status === 409) {
        // Règle garantie par la base : un même favori ne peut exister 2 fois.
        setIsInFavorites(true);
        alert("Cette adresse est déjà dans vos favoris !");
      } else if (error.response?.status === 401) {
        navigation.navigate("Auth"); // jeton expiré
      } else {
        alert(getErrorMessage(error));
      }
    }
  };

  const alreadyInFav = async (address) => {
    if (!address || !(await isLoggedIn())) {
      return false;
    }
    try {
      const favorites = await getFavorites();
      return favorites.some((fav) => fav.label === address);
    } catch (error) {
      console.error("Error checking favorites", getErrorMessage(error));
      return false;
    }
  };

  const navigateToFeedback = () => {
    // La ville est transmise pour savoir à quelle ville se rapporte le retour.
    navigation.navigate("Feedback", {
      city: weather?.name ?? selectedAddress,
    });
  };

  // Revenir à la météo de sa position GPS après avoir consulté une ville.
  const backToMyPosition = () => {
    navigation.setParams({
      paramKey: undefined,
      latitude: undefined,
      longitude: undefined,
    });
  };

  // Ouvre l'onglet Carte : il se centre sur le lieu affiché ici
  // (voir src/state/currentPlace.js).
  const navigateToMap = () => {
    navigation.navigate("Map");
  };

  useEffect(() => {
    getLocation();
    loadLastUpdate();
    if (selectedAddress !== undefined) {
      getWeatherDataFromAddress();
    } else {
      getWeatherData();
    }
  }, []);

  useEffect(() => {
    if (selectedAddress !== undefined) {
      getWeatherDataFromAddress();
    } else {
      getWeatherData();
    }
  }, [location, selectedAddress, unit]);

  useEffect(() => {
    const checkFavorites = async () => {
      const inFav = await alreadyInFav(selectedAddress);
      setIsInFavorites(inFav);
    };

    if (selectedAddress) {
      checkFavorites();
    }
  }, [selectedAddress]);

  return (
    <ImageBackground
      source={require("../assets/Background.png")}
      style={styles.container}
    >
      <View style={styles.topBar}>
        <View style={styles.brand}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            accessibilityLabel="Logo MeteoAPP"
          />
          <Text style={styles.appTitle}>MeteoAPP</Text>
        </View>
        {selectedAddress !== undefined && (
          <Button
            mode="text"
            compact
            textColor="#FFF"
            icon="crosshairs-gps"
            onPress={backToMyPosition}
          >
            Ma position
          </Button>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.city}>{weather?.name}</Text>
        {loading ? (
          <ActivityIndicator animating={true} color={"#FFF"} />
        ) : errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Button
              mode="contained"
              style={{ marginTop: 16 }}
              onPress={() => {
                setLoading(true);
                if (selectedAddress !== undefined) {
                  getWeatherDataFromAddress();
                } else {
                  getWeatherData();
                }
              }}
            >
              Réessayer
            </Button>
          </View>
        ) : (
          <View style={styles.weatherContainer}>
            <Text style={styles.weather}>
              {weather?.weather?.[0]?.description}
            </Text>
            <Image
              source={getWeatherImage(weather?.weather?.[0]?.icon)}
              style={styles.weatherImage}
            />
            <TouchableOpacity onPress={toggleUnit}>
              <Text style={styles.temperature}>
                {weather?.main?.temp} °{unit === "metric" ? "C" : "F"}
              </Text>
            </TouchableOpacity>
            <Text style={styles.date}>
              {moment().format("dddd, D MMMM YYYY | HH:mm")}
            </Text>
            <View style={styles.otherInfoContainer}>
              <DetailWeather
                img={require("../assets/parapluie.png")}
                label={"Précipitation"}
                value={weather?.rain?.["1h"] || 0}
                unit={"mm"}
              />
              <DetailWeather
                img={require("../assets/goutte.png")}
                label={"Humidité"}
                value={weather?.main?.humidity}
                unit={"%"}
              />
              <DetailWeather
                img={require("../assets/vent.png")}
                label={`Vent ${getCardinalDirection(weather?.wind?.deg)}`}
                value={weather?.wind?.speed}
                unit={"m/s"}
                directionDeg={weather?.wind?.deg}
              />
            </View>
            <View style={styles.actions}>
              {selectedAddress !== undefined && !isInFavorites && (
                <Button
                  mode="contained"
                  icon="star-outline"
                  onPress={saveToFavorites}
                  style={styles.actionButton}
                >
                  Ajouter aux favoris
                </Button>
              )}
              <Button
                mode="outlined"
                textColor="#FFF"
                icon="map-outline"
                onPress={navigateToMap}
                style={styles.actionButton}
              >
                Voir sur la carte
              </Button>
              <Button
                mode="outlined"
                textColor="#FFF"
                icon="message-text-outline"
                onPress={navigateToFeedback}
                style={styles.actionButton}
              >
                Donner mon avis
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 9,
    marginRight: 10,
  },
  appTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  actions: {
    marginTop: 24,
    width: 260,
  },
  actionButton: {
    marginTop: 10,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  city: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#FFF",
    textShadowColor: "black",
    textShadowRadius: 5,
  },
  weatherContainer: {
    alignItems: "center",
  },
  weather: {
    fontSize: 18,
    marginBottom: 10,
    color: "#FFF",
  },
  temperature: {
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#FFF",
    textShadowColor: "black",
    textShadowRadius: 5,
  },
  weatherImage: {
    width: 200,
    height: 200,
    marginTop: 10,
  },
  date: {
    fontSize: 16,
    marginTop: 5,
    color: "#FFF",
  },
  otherInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  errorContainer: {
    alignItems: "center",
    paddingHorizontal: 30,
    marginTop: 20,
  },
  errorText: {
    color: "#FFF",
    fontSize: 15,
    textAlign: "center",
  },
});

export default WeatherScreen;
