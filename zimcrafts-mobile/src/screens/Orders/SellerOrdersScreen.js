import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import { formatCurrency } from "../../utils/formatters";

const nextStatuses = ["processing", "shipped", "awaiting_confirmation"];

export default function SellerOrdersScreen() {
  const [state, setState] = useState({ loading: true, refreshing: false, orders: [], error: "" });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (refreshing = false) => {
    try {
      setState((current) => ({ ...current, loading: !refreshing, refreshing, error: "" }));
      const response = await client.getSellerOrders();
      setState({
        loading: false,
        refreshing: false,
        orders: response.data || [],
        error: "",
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        error: error.message,
      }));
    }
  };

  const handleUpdate = async (orderId, status) => {
    try {
      await client.updateSellerOrderStatus(orderId, { status });
      await loadOrders(true);
    } catch (error) {
      Alert.alert("Update failed", error.message);
    }
  };

  if (state.loading) {
    return <LoadingState label="Loading seller orders..." />;
  }

  return (
    <ScreenShell refreshing={state.refreshing} onRefresh={() => loadOrders(true)}>
      {state.orders.length ? (
        state.orders.map((order) => (
          <Surface key={order._id} style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.title}>
              {order.orderNumber}
            </Text>
            <Text variant="bodyMedium">Customer: {order.user?.name || "Unknown"}</Text>
            <Text variant="bodyMedium">Status: {order.status}</Text>
            <Text variant="bodyMedium">Total: {formatCurrency(order.total)}</Text>
            <Text variant="bodySmall" style={styles.meta}>
              {order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ")}
            </Text>
            <View style={styles.actions}>
              {nextStatuses.map((status) => (
                <AppButton
                  key={status}
                  mode="outlined"
                  onPress={() => handleUpdate(order._id, status)}
                  style={styles.button}
                >
                  {status}
                </AppButton>
              ))}
            </View>
          </Surface>
        ))
      ) : (
        <EmptyState title="No seller orders yet" subtitle={state.error || "Orders placed for your products will appear here."} />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    gap: 8,
  },
  title: {
    color: "#432818",
    fontWeight: "800",
  },
  meta: {
    color: "#7c5d48",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  button: {
    marginRight: 0,
  },
});
