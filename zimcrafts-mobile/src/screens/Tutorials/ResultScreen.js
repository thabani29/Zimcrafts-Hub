import React from "react";
import { StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";
import AppButton from "../../components/AppButton";
import ScreenShell from "../../components/ScreenShell";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function ResultScreen({ route, navigation }) {
  const { tutorialId, score } = route.params || { tutorialId: "1", score: 100 };
  const passed = score >= 70;

  return (
    <ScreenShell>
      <Surface style={styles.card} elevation={1}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={passed ? "check-decagram" : "close-octagon"}
            size={80}
            color={passed ? "#4caf50" : "#d32f2f"}
          />
        </View>
        <Text variant="headlineMedium" style={styles.title}>
          {passed ? "Congratulations!" : "Keep Trying!"}
        </Text>
        <Text variant="titleLarge" style={[styles.score, { color: passed ? "#4caf50" : "#d32f2f" }]}>
          You scored {score}%
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          {passed 
            ? "You have successfully passed the examination for this tutorial." 
            : "You need at least 70% to pass. Review the material and try again."}
        </Text>

        <View style={styles.actions}>
          {passed ? (
            <AppButton onPress={() => navigation.navigate("Certificate", { tutorialId })} style={{ marginBottom: 12 }}>
              View Certificate
            </AppButton>
          ) : (
            <AppButton onPress={() => navigation.navigate("Exam", { tutorialId })} style={{ marginBottom: 12 }}>
              Retake Exam
            </AppButton>
          )}
          <AppButton mode="outlined" onPress={() => navigation.navigate("TutorialList")}>
            Back to Tutorials
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
  score: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    color: "#6b4f3a",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  actions: {
    width: "100%",
  },
});
