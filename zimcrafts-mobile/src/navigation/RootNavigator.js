import React from "react";
import { View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import * as Linking from "expo-linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import LoadingState from "../components/LoadingState";
import HeaderBanner from "../components/HeaderBanner";

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#f7f2eb",
    card: "#fffaf5",
    text: "#432818",
    primary: "#8a4b2a",
    border: "#ead7c0",
  },
};

const prefix = Linking.createURL("/");

const linking = {
  prefixes: [prefix, "zimcrafts://"],
  config: {
    screens: {
      Products: {
        screens: {
          PaymentStatus: {
            path: "payment/:status/:type",
            parse: {
              status: (status) => `${status}`,
              type: (type) => `${type}`,
            },
          },
        },
      },
      Wallet: {
        path: "wallet",
      },
    },
  },
};

export default function RootNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingState label="Preparing your studio..." />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme} linking={linking}>
        <View style={{ flex: 1 }}>
          {isAuthenticated && <HeaderBanner />}
          {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
        </View>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
