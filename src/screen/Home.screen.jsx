import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native";
import { TextInput } from "react-native-paper";
import { ImageBackground, ScrollView } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { getAddressesByQuery } from "../../services/address/addressService";
import { isLoggedIn, getErrorMessage } from "../../services/api/apiClient";
import { getFavorites, removeFavorite } from "../../services/api/favoritesService";
import { getRecentSearches, clearHistory } from "../../services/api/historyService";
import { useFocusEffect } from "@react-navigation/native";

const HomeScreen = () => {
  const [addressFormatToCity, setAddressFormatToCity] = useState("");
  const [address, setAddress] = useState("");
  const [addressOptions, setAddressOptions] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [connected, setConnected] = useState(false);
  const [recent, setRecent] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    if (address !== "") {
      getAddressesByQuery(address)
        .then((d) => {
          setAddressOptions(d);
        })
        .catch((err) => console.log(err));
    }
  }, [address]);

  // Les favoris sont lus en base de données (API) à chaque retour sur l'écran.
  // Sans compte connecté, la liste est vide et on propose de se connecter.
  useFocusEffect(
    React.useCallback(() => {
      const loadFavorites = async () => {
        try {
          const logged = await isLoggedIn();
          setConnected(logged);
          if (!logged) {
            setFavorites([]);
            setRecent([]);
            return;
          }
          setFavorites(await getFavorites());
          setRecent(await getRecentSearches(5));
        } catch (error) {
          console.error("Error loading favorites", getErrorMessage(error));
        }
      };

      loadFavorites();
    }, [])
  );

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      setRecent([]);
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };

  const handleRemoveFavorite = async (fav) => {
    try {
      await removeFavorite(fav.id);
      setFavorites((current) => current.filter((f) => f.id !== fav.id));
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };

  const handleSelectAddress = (feature) => {
    const { label, city } = feature.properties;
    // Les coordonnées précises (lon, lat) sont fournies par l'API
    // adresse.gouv.fr dans "geometry.coordinates" : on les utilise pour
    // interroger la météo par position GPS plutôt que par nom de ville,
    // ce qui évite les erreurs sur les arrondissements, petites communes
    // ou libellés que l'API météo ne reconnaît pas telle quelle.
    const [longitude, latitude] = feature.geometry.coordinates;
    setAddress(label);
    setSelectedAddress(label);
    setAddressFormatToCity(city);
    setSelectedCoords({ latitude, longitude });
    setVisible(false);
  };

  // Retour à la météo de la position GPS (on efface la ville choisie).
  const navigateToWeatherScreenWithGeo = () => {
    navigation.navigate("Weather", {
      paramKey: undefined,
      latitude: undefined,
      longitude: undefined,
    });
  };

  const navigateToWeatherScreen = () => {
    navigation.navigate("Weather", {
      paramKey: addressFormatToCity,
      latitude: selectedCoords?.latitude,
      longitude: selectedCoords?.longitude,
    });
  };

  const navigateToWeatherScreenWithFav = (fav) => {
    navigation.navigate("Weather", {
      paramKey: fav,
      latitude: undefined,
      longitude: undefined,
    });
  };

  return (
    <ImageBackground
      source={require("../../assets/imgBackground.png")}
      resizeMode="cover"
      style={styles.image}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Rechercher</Text>
        <Button
          onPress={navigateToWeatherScreenWithGeo}
          mode="outlined"
          textColor="#FFF"
          icon="crosshairs-gps"
        >
          Météo de ma position
        </Button>
        <TextInput
          label="Adresse"
          mode="flat"
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            setVisible(true);
          }}
          style={styles.input}
        />
        {addressOptions && visible !== false && (
          <View style={styles.autocompleteContainer}>
            {addressOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.option}
                onPress={() => handleSelectAddress(option)}
              >
                <Text style={styles.optionText}>{option.properties.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {selectedAddress !== "" && (
          <Button
            onPress={navigateToWeatherScreen}
            mode="contained"
            style={styles.weatherBtn}
          >
            Voir la météo
          </Button>
        )}
        {!connected && (
          <Button
            mode="outlined"
            textColor="#FFF"
            style={styles.weatherBtn}
            onPress={() => navigation.navigate("Auth")}
          >
            Se connecter pour retrouver mes favoris
          </Button>
        )}
        {favorites.length > 0 && (
          <Text style={styles.sectionTitle}>Mes favoris</Text>
        )}
        {favorites.map((fav) => (
          <View key={`fav-${fav.id}`} style={styles.favRow}>
            <TouchableOpacity
              style={styles.favTouchable}
              onPress={() => navigateToWeatherScreenWithFav(fav.label)}
            >
              <View style={styles.fav}>
                <Text style={styles.favLabel}>{fav.label}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleRemoveFavorite(fav)}>
              <Text style={styles.favRemove}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {recent.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Recherches récentes</Text>
            {recent.map((item) => (
              <TouchableOpacity
                key={`recent-${item.city}`}
                onPress={() => navigateToWeatherScreenWithFav(item.city)}
              >
                <View style={styles.fav}>
                  <Text style={styles.favLabel}>{item.city}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <Button textColor="#FFF" onPress={handleClearHistory}>
              Effacer l'historique
            </Button>
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  appbar: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  container: {
    paddingTop: 55,
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  pageTitle: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },
  image: {
    flex: 1,
  },
  title: {
    marginTop: 50,
    fontWeight: "600",
    fontSize: 18,
    textAlign: "center",
    color: "#fff",
  },
  input: {
    marginTop: 20,
  },
  autocompleteContainer: {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 20,
  },
  optionText: {
    color: "white",
  },
  weatherBtn: {
    marginTop: 20,
  },
  fav: {
    width: 260,
    height: 40,
    backgroundColor: "rgba(1,1,1, 0.2)",
    borderRadius: 10,
    marginTop: 10,
  },
  favRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  favTouchable: {
    flex: 0,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 4,
  },
  favRemove: {
    color: "#fff",
    fontSize: 20,
    marginLeft: 12,
    marginTop: 10,
  },
  favLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: 600,
    marginLeft: 15,
    marginTop: 10,
  },
});

export default HomeScreen;
