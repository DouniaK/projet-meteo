import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { PaperProvider, MD3DarkTheme, Icon } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import WeatherScreen from "./src/screen/WeatherScreen";
import HomeScreen from "./src/screen/Home.screen";
import HowItWorksScreen from "./src/screen/HowItWorks.screen";
import MapScreen from "./src/screen/WeatherMap.screen";
import { FeedBack } from "./src/screen/Feedback.screen";
import AuthScreen from "./src/screen/Auth.screen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Thème turquoise de l'application (remplace le violet par défaut de
// react-native-paper sur tous les boutons "contained", FAB, etc.)
const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#2FB6A3",
    onPrimary: "#0A3A38",
    secondary: "#7FD9CB",
    background: "#0A3A38",
  },
};

// Icône d'un onglet (icônes Material fournies par react-native-paper)
const tabIcon = (name) => ({ color, size }) =>
  <Icon source={name} color={color} size={size} />;

/**
 * Navigation principale : une barre d'onglets en bas de l'écran, comme
 * dans les applications du quotidien (YouTube, Instagram...).
 * L'application s'ouvre directement sur l'onglet Météo (position GPS).
 * Les noms techniques des onglets (Weather, Home, Map, Auth) sont ceux
 * déjà utilisés dans le code ; seuls les libellés affichés changent.
 */
function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Weather"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#FFD84D",
        tabBarInactiveTintColor: "rgba(255,255,255,0.7)",
        tabBarStyle: {
          backgroundColor: "#0A3A38",
          borderTopColor: "rgba(127,217,203,0.25)",
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tab.Screen
        name="Weather"
        component={WeatherScreen}
        options={{ title: "Météo", tabBarIcon: tabIcon("weather-partly-cloudy") }}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Recherche", tabBarIcon: tabIcon("magnify") }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: "Carte", tabBarIcon: tabIcon("map-outline") }}
      />
      <Tab.Screen
        name="Auth"
        component={AuthScreen}
        options={{ title: "Compte", tabBarIcon: tabIcon("account-circle-outline") }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <NavigationContainer>
        {/*
          Les onglets sont l'écran principal. Les écrans ponctuels
          (donner son avis, explications) s'ouvrent par-dessus, avec un
          bouton retour.
        */}
        <Stack.Navigator>
          <Stack.Screen
            name="Tabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Feedback"
            component={FeedBack}
            options={{
              title: "Donner mon avis",
              headerStyle: { backgroundColor: "#0A3A38" },
              headerTintColor: "#FFF",
            }}
          />
          <Stack.Screen
            name="HowItWorks"
            component={HowItWorksScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
