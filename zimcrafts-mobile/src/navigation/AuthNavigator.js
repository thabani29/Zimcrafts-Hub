import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/Auth/LoginScreen";
import RegisterScreen from "../screens/Auth/RegisterScreen";
import VerifyEmailScreen from "../screens/Auth/VerifyEmailScreen";
import ForgotPasswordScreen from "../screens/Auth/ForgotPasswordScreen";

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#f7f2eb" },
        headerShadowVisible: false,
        headerTintColor: "#432818",
        contentStyle: { backgroundColor: "#f7f2eb" },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Welcome back" }} />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: "Create account" }}
      />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        options={{ title: "Verify Email", headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ title: "Forgot Password" }}
      />
    </Stack.Navigator>
  );
}
