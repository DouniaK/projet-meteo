import React, { useState } from "react";
import { View, Text, StyleSheet, ImageBackground, Image } from "react-native";
import { Button, IconButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

/**
 * Écran pédagogique présentant le fonctionnement de l'application.
 * Composé de 3 pages navigables (Suivant / Précédent). Il s'ouvre depuis
 * l'onglet Compte (bouton « Comment ça marche ? »).
 */
const pages = [
  {
    key: "geoloc",
    title: "1. Votre météo, automatiquement",
    icon: require("../assets/01d.png"),
    text:
      "Dès l'ouverture, MeteoApp demande l'autorisation d'accéder à votre " +
      "position GPS. Grâce à elle, l'application affiche immédiatement la " +
      "météo actuelle (température, humidité, vent, précipitations) à " +
      "l'endroit où vous vous trouvez, sans aucune action de votre part.",
  },
  {
    key: "search",
    title: "2. Rechercher une autre adresse",
    icon: require("../assets/50d.png"),
    text:
      "Vous voulez connaître la météo ailleurs ? Ouvrez l'onglet " +
      "Recherche en bas de l'écran. Tapez une ville ou une adresse : les " +
      "suggestions apparaissent automatiquement grâce à l'API Adresse. " +
      "Sélectionnez la vôtre et sa météo s'affiche instantanément.",
  },
  {
    key: "favoris",
    title: "3. Favoris & unités",
    icon: require("../assets/goutte.png"),
    text:
      "Une adresse consultée vous intéresse ? Ajoutez-la aux favoris : " +
      "elle apparaîtra dans l'onglet Recherche. Vous pouvez aussi " +
      "appuyer sur la température pour basculer entre degrés Celsius et " +
      "Fahrenheit à tout moment.",
  },
];

const HowItWorksScreen = () => {
  const [pageIndex, setPageIndex] = useState(0);
  const navigation = useNavigation();
  const isLastPage = pageIndex === pages.length - 1;
  const isFirstPage = pageIndex === 0;
  const currentPage = pages[pageIndex];

  const handleNext = () => {
    if (isLastPage) {
      handleFinish();
    } else {
      setPageIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstPage) {
      setPageIndex((prev) => prev - 1);
    }
  };

  // On revient simplement à l'onglet Compte, d'où l'écran a été ouvert.
  const handleFinish = () => {
    navigation.goBack();
  };

  return (
    <ImageBackground
      source={require("../assets/Background.png")}
      style={styles.container}
    >
      <View style={styles.header}>
        <IconButton
          icon="close"
          iconColor="#FFF"
          size={24}
          onPress={handleFinish}
        />
      </View>

      <View style={styles.content}>
        <Image source={currentPage.icon} style={styles.icon} />
        <Text style={styles.title}>{currentPage.title}</Text>
        <Text style={styles.text}>{currentPage.text}</Text>
      </View>

      <View style={styles.dotsContainer}>
        {pages.map((page, index) => (
          <View
            key={page.key}
            style={[styles.dot, index === pageIndex && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.navContainer}>
        <Button
          mode="text"
          textColor="#FFF"
          onPress={handlePrevious}
          disabled={isFirstPage}
          style={{ opacity: isFirstPage ? 0 : 1 }}
        >
          Précédent
        </Button>
        <Button mode="contained" onPress={handleNext}>
          {isLastPage ? "Terminer" : "Suivant"}
        </Button>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 10,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  text: {
    color: "#FFF",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#FFF",
    width: 20,
  },
  navContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
});

export default HowItWorksScreen;
