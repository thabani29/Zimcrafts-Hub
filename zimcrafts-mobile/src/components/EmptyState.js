import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

export default function EmptyState({ title, subtitle }) {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="bodyMedium" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#f1e5d5",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontWeight: "700",
    color: "#432818",
    textAlign: "center",
  },
  subtitle: {
    color: "#6b4f3a",
    textAlign: "center",
  },
});
