import React from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";

export default function LoadingState({ label = "Loading..." }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text variant="bodyMedium">{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
});
