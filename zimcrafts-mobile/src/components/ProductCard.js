import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { formatCurrency, getProductImage } from "../utils/formatters";

export default function ProductCard({ product, onPress }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <Card.Cover source={{ uri: getProductImage(product) }} style={styles.cover} />
        <Card.Content style={styles.content}>
          <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
            {product.name}
          </Text>
          <Text variant="bodySmall" style={styles.meta}>
            {product.category?.name || "Handcrafted item"}
          </Text>
          <View style={styles.footer}>
            <Text variant="titleMedium" style={styles.price}>
              {formatCurrency(product.price)}
            </Text>
            <Text variant="bodySmall" style={styles.stock}>
              {product.stock ?? 0} in stock
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
    overflow: "hidden",
    marginBottom: 14,
  },
  cover: {
    backgroundColor: "#ead7c0",
  },
  content: {
    paddingTop: 14,
    gap: 6,
  },
  title: {
    fontWeight: "700",
    color: "#3f2d20",
  },
  meta: {
    color: "#7c5d48",
  },
  footer: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    color: "#8a4b2a",
    fontWeight: "800",
  },
  stock: {
    color: "#7c5d48",
  },
});
