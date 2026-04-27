import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";
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
  const { items, subtotal, updateItemQuantity, removeFromCart, clearCart } = useCart();
  const [address, setAddress] = useState(emptyAddress);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const payloadItems = useMemo(
    () => items.map((item) => ({ product: item._id, quantity: item.quantity })),
    [items]
  );

  const handleOrder = async () => {
    try {
      setSubmitting(true);
      await client.createOrder({
        items: payloadItems,
        shippingAddress: address,
        billingAddress: { sameAsShipping: true },
        shippingCost: 0,
        tax: 0,
        discount: 0,
        notes,
      });
      clearCart();
      Alert.alert("Order placed", "Your order was created successfully without Paynow checkout.", [
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
          subtitle="Add products from the marketplace, then come back here to place an order."
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <Surface style={styles.card} elevation={1}>
        <Text variant="titleLarge" style={styles.title}>
          Order summary
        </Text>
        {items.map((item) => (
          <View key={item._id} style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall">{item.name}</Text>
              <Text variant="bodySmall">{formatCurrency(item.price)} each</Text>
            </View>
            <Text variant="bodyMedium" onPress={() => updateItemQuantity(item._id, item.quantity + 1)}>
              +1
            </Text>
            <Text variant="bodyMedium">{item.quantity}</Text>
            <Text variant="bodyMedium" onPress={() => removeFromCart(item._id)}>
              Remove
            </Text>
          </View>
        ))}
        <Text variant="titleMedium" style={styles.total}>
          Total: {formatCurrency(subtotal)}
        </Text>
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
  line: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  total: {
    color: "#8a4b2a",
    fontWeight: "900",
  },
});
