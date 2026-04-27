import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Surface, Text } from "react-native-paper";
import client from "../../api/client";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import { formatCurrency } from "../../utils/formatters";

export default function OrdersScreen() {
  const [state, setState] = useState({ loading: true, refreshing: false, orders: [], error: "" });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async (refreshing = false) => {
    try {
      setState((current) => ({ ...current, loading: !refreshing, refreshing, error: "" }));
      const response = await client.getMyOrders();
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

  if (state.loading) {
    return <LoadingState label="Loading your orders..." />;
  }

  return (
    <ScreenShell refreshing={state.refreshing} onRefresh={() => loadOrders(true)}>
      {state.orders.length ? (
        state.orders.map((order) => (
          <Surface key={order._id} style={styles.card} elevation={1}>
            <Text variant="titleMedium" style={styles.title}>
              {order.orderNumber}
            </Text>
            <Text variant="bodyMedium">Status: {order.status}</Text>
            <Text variant="bodyMedium">Payment: {order.paymentStatus}</Text>
            <Text variant="bodyMedium">Total: {formatCurrency(order.total)}</Text>
            <Text variant="bodySmall" style={styles.meta}>
              {order.items?.length || 0} item(s)
            </Text>
          </Surface>
        ))
      ) : (
        <EmptyState title="No customer orders yet" subtitle={state.error || "Place your first order from the Products tab."} />
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
});
