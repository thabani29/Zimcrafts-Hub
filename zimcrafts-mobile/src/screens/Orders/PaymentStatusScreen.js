import React from "react";
import { StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";
import AppButton from "../../components/AppButton";
import ScreenShell from "../../components/ScreenShell";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function PaymentStatusScreen({ route, navigation }) {
  // Extract params from deep link or navigation
  const { status, type, reference } = route.params || { status: "success", type: "product", reference: "" };
  const isSuccess = status === "success";

  return (
    <ScreenShell>
      <Surface style={styles.card} elevation={1}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={isSuccess ? "check-circle" : "alert-circle"}
            size={80}
            color={isSuccess ? "#4caf50" : "#d32f2f"}
          />
        </View>
        <Text variant="headlineMedium" style={styles.title}>
          {isSuccess ? "Payment Successful!" : "Payment Failed"}
        </Text>
        
        {reference ? (
          <Text variant="bodyMedium" style={styles.reference}>
            Ref: {reference}
          </Text>
        ) : null}

        <Text variant="bodyLarge" style={styles.subtitle}>
          {isSuccess 
            ? `Your ${type} payment has been processed successfully.` 
            : `We could not process your ${type} payment. Please try again.`}
        </Text>

        <View style={styles.actions}>
          {isSuccess ? (
            <AppButton 
              onPress={() => navigation.navigate(type === "tutorial" ? "Tutorials" : "Orders")} 
              style={{ marginBottom: 12 }}
            >
              {type === "tutorial" ? "Go to My Tutorials" : "View My Orders"}
            </AppButton>
          ) : (
            <AppButton 
              onPress={() => navigation.navigate(type === "tutorial" ? "Tutorials" : "Cart")} 
              style={{ marginBottom: 12 }}
            >
              {type === "tutorial" ? "Back to Tutorials" : "Return to Cart"}
            </AppButton>
          )}
          <AppButton mode="outlined" onPress={() => navigation.navigate("Home")}>
            Back to Home
          </AppButton>
        </View>
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    color: "#432818",
    fontWeight: "900",
    marginBottom: 8,
    textAlign: "center",
  },
  reference: {
    color: "#8b7d72",
    marginBottom: 12,
  },
  subtitle: {
    color: "#6b4f3a",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  actions: {
    width: "100%",
  },
});
