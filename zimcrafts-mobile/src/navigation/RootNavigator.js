import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import LoadingState from "../components/LoadingState";

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

export default function RootNavigator() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingState label="Preparing your studio..." />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
