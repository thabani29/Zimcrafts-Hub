import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { formatCurrency } from "../utils/formatters";

export default function TutorialCard({ tutorial, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Text variant="titleMedium" style={styles.title}>
            {tutorial.title}
          </Text>
          <Text variant="bodyMedium" numberOfLines={3} style={styles.description}>
            {tutorial.description}
          </Text>
          <View style={styles.footer}>
            <Text variant="titleMedium" style={styles.price}>
              {formatCurrency(tutorial.price)}
            </Text>
            <Text variant="bodySmall" style={styles.meta}>
              {tutorial.artisanId?.name || tutorial.artisan?.name || "Artisan tutorial"}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    backgroundColor: "#fffdf9",
    marginBottom: 14,
  },
  content: {
    gap: 10,
  },
  title: {
    fontWeight: "800",
    color: "#3f2d20",
  },
  description: {
    color: "#6b4f3a",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    color: "#8a4b2a",
    fontWeight: "800",
  },
  meta: {
    color: "#7c5d48",
  },
});
