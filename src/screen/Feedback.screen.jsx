import { View } from "react-native";
import { Text } from "react-native-paper";
import { ImageBackground } from "react-native";
import { StyleSheet } from "react-native";
import { FeedbackElement } from "../components/feedback-element.component";
import { isLoggedIn, getErrorMessage } from "../../services/api/apiClient";
import { sendFeedback } from "../../services/api/feedbackService";

export const FeedBack = ({ route, navigation }) => {
  const city = route?.params?.city;

  const feedBackElements = [
    {
      label: "Ensoleillé",
      code: "01d",
      img: require("../assets/01d.png"),
    },
    {
      label: "Quelques nuages",
      code: "02d",
      img: require("../assets/02d.png"),
    },
    {
      label: "Nuages épars",
      code: "03d",
      img: require("../assets/03d.png"),
    },
    {
      label: "Nuages fragmentés",
      code: "04d",
      img: require("../assets/04d.png"),
    },
    {
      label: "Bruine",
      code: "09d",
      img: require("../assets/09d.png"),
    },
    {
      label: "Pluie légère",
      code: "10d",
      img: require("../assets/10d.png"),
    },
    {
      label: "Orage",
      code: "11d",
      img: require("../assets/11d.png"),
    },
    {
      label: "Neige",
      code: "13d",
      img: require("../assets/13d.png"),
    },
    {
      label: "Brume / Fumée",
      code: "50d",
      img: require("../assets/50d.png"),
    },
  ];

  // Un appui = « voici la météo que j'observe dans cette ville ».
  const handleFeedback = async (element) => {
    if (!(await isLoggedIn())) {
      navigation.navigate("Tabs", { screen: "Auth" });
      return;
    }
    if (!city) {
      alert("Ville inconnue : ouvrez cet écran depuis la météo d'une ville.");
      return;
    }
    try {
      await sendFeedback(city, element.code);
      alert("Merci pour votre retour !");
    } catch (error) {
      if (error.response?.status === 401) {
        navigation.navigate("Tabs", { screen: "Auth" });
      } else {
        alert(getErrorMessage(error));
      }
    }
  };

  return (
    <ImageBackground
      source={require("../assets/Background.png")}
      style={styles.container}
    >
      <View>
        <Text style={styles.title}>
          Votre retour aide chacun à voir des conditions météo plus précises !
        </Text>
        <View style={styles.elementContainer}>
          {feedBackElements.map((element) => (
            <FeedbackElement
              img={element.img}
              label={element.label}
              onPress={() => handleFeedback(element)}
              key={element.label}
            />
          ))}
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 20,
    paddingLeft: 20,
  },
  title: {
    color: "#FFF",
    marginTop: 20,
    fontWeight: 600,
    fontSize: 16,
  },
  elementContainer: {
    display: "flex",
    flexDirection: "row",
    gap: 20,
    flexWrap: "wrap",
    marginTop: 30,
  },
});

export default FeedBack;
