import { View } from "react-native";
import { StyleSheet } from "react-native";
import { Image } from "react-native";
import { Text } from "react-native-paper";

// directionDeg (optionnel) : si fourni, une flèche pivote pour indiquer une
// direction (utilisé pour la direction du vent). Sinon, l'icône classique
// (img) est affichée comme avant.
export const DetailWeather = ({ label, value, img, unit, directionDeg }) => {
  return (
    <View style={styles.container}>
      {directionDeg !== undefined && directionDeg !== null ? (
        <View style={styles.arrowWrapper}>
          <Text
            style={[
              styles.arrow,
              { transform: [{ rotate: `${directionDeg}deg` }] },
            ]}
          >
            ↑
          </Text>
        </View>
      ) : (
        <Image source={img} style={styles.infoImage} />
      )}
      <Text style={styles.value}>
        {value} {unit}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 115,
    width: 115,
    backgroundColor: "rgba(102, 98, 185, 0.2)",
    alignItems: "center",
    marginBottom: 10,
  },
  infoImage: {
    width: 40,
    height: 40,
    marginBottom: 10,
    marginTop: 15,
  },
  arrowWrapper: {
    height: 40,
    width: 40,
    marginBottom: 10,
    marginTop: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  arrow: {
    fontSize: 30,
    color: "#FFF",
    fontWeight: "900",
  },
  value: {
    color: "#FFF",
    fontWeight: "700",
  },
  label: {
    color: "#FFF",
  },
});
