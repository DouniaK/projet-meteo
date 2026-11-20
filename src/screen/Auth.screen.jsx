import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ImageBackground, ScrollView } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { isLoggedIn, getErrorMessage } from "../../services/api/apiClient";
import { login, register, logout } from "../../services/api/authService";

// Onglet "Compte" : connexion / création de compte, déconnexion,
// et accès aux pages d'explication de l'application.
const AuthScreen = () => {
  const navigation = useNavigation();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  // L'onglet reste ouvert en arrière-plan : on vérifie l'état de
  // connexion à chaque fois qu'on y revient.
  useFocusEffect(
    useCallback(() => {
      isLoggedIn().then(setConnected);
    }, [])
  );

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const action = mode === "login" ? login : register;
      await action(email.trim(), password);
      setPassword("");
      setConnected(true);
      // Retour à la météo (par exemple pour finir d'ajouter un favori).
      navigation.navigate("Weather");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setConnected(false);
  };

  return (
    <ImageBackground
      source={require("../assets/Background.png")}
      resizeMode="cover"
      style={styles.background}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>Mon compte</Text>

        <View style={styles.card}>
          {connected ? (
            <>
              <Text style={styles.title}>Vous êtes connecté(e)</Text>
              <Text style={styles.subtitle}>
                Vos favoris et vos recherches récentes sont enregistrés.
              </Text>
              <Button mode="contained" icon="logout" onPress={handleLogout}>
                Se déconnecter
              </Button>
            </>
          ) : (
            <>
              <Text style={styles.title}>
                {mode === "login" ? "Connexion" : "Créer un compte"}
              </Text>
              <Text style={styles.subtitle}>
                Un compte permet de retrouver vos favoris, vos recherches
                récentes et d'envoyer vos avis.
              </Text>
              <TextInput
                label="Email"
                mode="flat"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                label="Mot de passe (8 caractères minimum)"
                mode="flat"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />
              {error && <Text style={styles.error}>{error}</Text>}
              <Button
                mode="contained"
                onPress={submit}
                loading={loading}
                disabled={loading || !email || !password}
                style={styles.button}
              >
                {mode === "login" ? "Se connecter" : "Créer mon compte"}
              </Button>
              <Button
                onPress={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError(null);
                }}
                textColor="#FFF"
              >
                {mode === "login"
                  ? "Pas de compte ? Créer un compte"
                  : "Déjà un compte ? Se connecter"}
              </Button>
            </>
          )}
        </View>

        <Button
          mode="outlined"
          textColor="#FFF"
          icon="information-outline"
          style={styles.help}
          onPress={() => navigation.navigate("HowItWorks")}
        >
          Comment ça marche ?
        </Button>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { paddingTop: 55, paddingHorizontal: 24, paddingBottom: 40 },
  pageTitle: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 16,
    padding: 24,
  },
  title: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    color: "#FFF",
    textAlign: "center",
    marginBottom: 16,
  },
  input: { marginBottom: 12 },
  button: { marginTop: 8, marginBottom: 8 },
  error: { color: "#FFB4A9", marginBottom: 8, textAlign: "center" },
  help: { marginTop: 24 },
});

export default AuthScreen;
