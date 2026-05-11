import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Surface, Text, Divider } from "react-native-paper";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import EmptyState from "../../components/EmptyState";
import ScreenShell from "../../components/ScreenShell";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatters";

const emptyAddress = {
  name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "Zimbabwe",
};

export default function CheckoutScreen({ navigation }) {
  const { items, subtotal, clearCart } = useCart();
  const [address, setAddress] = useState(emptyAddress);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const payloadItems = useMemo(
    () => items.map((item) => ({ product: item._id, quantity: item.quantity })),
    [items]
  );

  const shippingCost = 5.0;
  const tax = subtotal * 0.15;
  const total = subtotal + shippingCost + tax;

  const handleOrder = async () => {
    try {
      setSubmitting(true);
      await client.createOrder({
        items: payloadItems,
        shippingAddress: address,
        billingAddress: { sameAsShipping: true },
        shippingCost,
        tax,
        discount: 0,
        notes,
      });
      clearCart();
      Alert.alert("Order placed", "Your order was created successfully!", [
        { text: "View orders", onPress: () => navigation.navigate("Orders") },
      ]);
    } catch (error) {
      Alert.alert("Order failed", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <ScreenShell>
        <EmptyState
          title="Your cart is empty"
          subtitle="Add products from the marketplace to checkout."
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
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text variant="titleLarge" style={styles.title}>
            Order summary
          </Text>
          <Text variant="bodyMedium" onPress={() => navigation.navigate("Cart")} style={{ color: "#8a4b2a" }}>
            Edit Cart
          </Text>
        </View>
        <Text variant="bodyMedium">
          {items.length} item(s) in cart.
        </Text>
        <View style={styles.summaryRow}>
          <Text variant="bodyMedium">Subtotal</Text>
          <Text variant="bodyMedium">{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text variant="bodyMedium">Shipping</Text>
          <Text variant="bodyMedium">{formatCurrency(shippingCost)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text variant="bodyMedium">Tax (15%)</Text>
          <Text variant="bodyMedium">{formatCurrency(tax)}</Text>
        </View>
        <Divider style={{ marginVertical: 4 }} />
        <View style={styles.summaryRow}>
          <Text variant="titleMedium" style={styles.total}>Total</Text>
          <Text variant="titleMedium" style={styles.total}>{formatCurrency(total)}</Text>
        </View>
      </Surface>

      <Surface style={styles.card} elevation={1}>
        <Text variant="titleLarge" style={styles.title}>
          Shipping details
        </Text>
        <AppTextField label="Full name" value={address.name} onChangeText={(value) => setAddress((current) => ({ ...current, name: value }))} />
        <AppTextField label="Phone number" value={address.phone} onChangeText={(value) => setAddress((current) => ({ ...current, phone: value }))} />
        <AppTextField label="Street" value={address.street} onChangeText={(value) => setAddress((current) => ({ ...current, street: value }))} />
        <AppTextField label="City" value={address.city} onChangeText={(value) => setAddress((current) => ({ ...current, city: value }))} />
        <AppTextField label="State" value={address.state} onChangeText={(value) => setAddress((current) => ({ ...current, state: value }))} />
        <AppTextField label="ZIP code" value={address.zipCode} onChangeText={(value) => setAddress((current) => ({ ...current, zipCode: value }))} />
        <AppTextField label="Order notes" value={notes} onChangeText={setNotes} multiline />
        <AppButton loading={submitting} disabled={submitting} onPress={handleOrder}>
          Place order
        </AppButton>
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
  },
  total: {
    color: "#8a4b2a",
    fontWeight: "900",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
