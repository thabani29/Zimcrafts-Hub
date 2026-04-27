import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

export default function StatCard({ label, value, accent = "#8a4b2a" }) {
  return (
    <View style={styles.card}>
      <Text variant="bodyMedium" style={styles.label}>
        {label}
      </Text>
      <Text variant="headlineSmall" style={[styles.value, { color: accent }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#fffdf9",
  },
  label: {
    color: "#7c5d48",
    marginBottom: 10,
  },
  value: {
    fontWeight: "800",
  },
});
