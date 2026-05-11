import React, { useMemo } from "react";
import { StyleSheet, View, Image } from "react-native";
import { Surface, Text, IconButton } from "react-native-paper";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import ScreenShell from "../../components/ScreenShell";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatters";

export default function CartScreen({ navigation }) {
  const { items, subtotal, updateItemQuantity, removeFromCart, clearCart } = useCart();

  if (!items.length) {
    return (
      <ScreenShell>
        <EmptyState
          title="Your cart is empty"
          subtitle="Add products from the marketplace to start shopping."
        />
        <AppButton onPress={() => navigation.navigate("Explore", { screen: "ProductList" })} style={{ marginTop: 24 }}>
          Browse Products
        </AppButton>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <Surface style={styles.card} elevation={1}>
        <Text variant="titleLarge" style={styles.title}>
          Shopping Cart
        </Text>
        {items.map((item) => (
          <View key={item._id} style={styles.itemRow}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
              <View style={[styles.image, { backgroundColor: "#ead7c0" }]} />
            )}
            <View style={styles.itemInfo}>
              <Text variant="titleSmall" numberOfLines={2}>{item.name}</Text>
              <Text variant="bodySmall">{formatCurrency(item.price)} each</Text>
            </View>
            <View style={styles.quantityControl}>
              <IconButton
                icon="minus"
                size={16}
                onPress={() => updateItemQuantity(item._id, item.quantity - 1)}
              />
              <Text variant="bodyMedium" style={{ minWidth: 20, textAlign: "center" }}>{item.quantity}</Text>
              <IconButton
                icon="plus"
                size={16}
                onPress={() => updateItemQuantity(item._id, item.quantity + 1)}
              />
            </View>
            <IconButton
              icon="delete-outline"
              iconColor="#d32f2f"
              size={20}
              onPress={() => removeFromCart(item._id)}
            />
          </View>
        ))}
        <View style={styles.summaryRow}>
          <Text variant="titleMedium" style={styles.totalLabel}>Subtotal</Text>
          <Text variant="titleMedium" style={styles.totalAmount}>
            {formatCurrency(subtotal)}
          </Text>
        </View>
        
        <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
          <AppButton mode="outlined" onPress={clearCart} style={{ flex: 1 }}>
            Clear
          </AppButton>
          <AppButton onPress={() => navigation.navigate("Checkout")} style={{ flex: 2 }}>
            Proceed to Checkout
          </AppButton>
        </View>
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    gap: 12,
  },
  title: {
    color: "#432818",
    fontWeight: "800",
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f0e6db",
    paddingBottom: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f2eb",
    borderRadius: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  totalLabel: {
    color: "#432818",
    fontWeight: "bold",
  },
  totalAmount: {
    color: "#8a4b2a",
    fontWeight: "900",
  },
});
