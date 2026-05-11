import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
import { Surface, Text, Divider, IconButton } from "react-native-paper";
import * as Linking from "expo-linking";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import { formatCurrency } from "../../utils/formatters";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const getNextStatus = (status) => {
  switch (status.toLowerCase()) {
    case "pending": return { label: "Process", value: "processing" };
    case "processing": return { label: "Ship", value: "shipped" };
    case "shipped": return { label: "Ready", value: "awaiting_confirmation" };
    default: return null;
  }
};

export default function SellerOrdersScreen() {
  const [state, setState] = useState({ loading: true, refreshing: false, orders: [], error: "" });
  const [collapsedMonths, setCollapsedMonths] = useState({});

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
      Alert.alert("Success", `Order status updated to ${status}`);
      await loadOrders(true);
    } catch (error) {
      Alert.alert("Update failed", error.message);
    }
  };

  const openWhatsApp = (phone, orderNumber) => {
    if (!phone) return;
    const sanitized = String(phone).replace(/[^\d]/g, "");
    const message = `Hello, I have an update about your order ${orderNumber}.`;
    Linking.openURL(`whatsapp://send?phone=${sanitized}&text=${encodeURIComponent(message)}`);
  };

  const groupOrdersByMonth = (orders) => {
    const groups = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt);
      const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!acc[month]) acc[month] = [];
      acc[month].push(order);
      return acc;
    }, {});

    return Object.keys(groups).map(month => ({
      title: month,
      data: groups[month]
    }));
  };

  const toggleMonth = (month) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  if (state.loading) {
    return <LoadingState label="Loading seller orders..." />;
  }

  const sections = groupOrdersByMonth(state.orders);

  return (
    <ScreenShell refreshing={state.refreshing} onRefresh={() => loadOrders(true)}>
      {sections.length ? (
        sections.map((section) => {
          const isCollapsed = collapsedMonths[section.title];
          return (
            <View key={section.title} style={styles.section}>
              <TouchableOpacity 
                activeOpacity={0.7} 
                onPress={() => toggleMonth(section.title)} 
                style={styles.sectionHeader}
              >
                <Text variant="labelLarge" style={styles.sectionHeaderText}>{section.title}</Text>
                <View style={styles.sectionHeaderLine} />
                <MaterialCommunityIcons 
                  name={isCollapsed ? "chevron-down" : "chevron-up"} 
                  size={20} 
                  color="#8a4b2a" 
                />
              </TouchableOpacity>

              {!isCollapsed && (
                <View style={styles.sectionItems}>
                  {section.data.map((order) => (
                    <Surface key={order._id} style={styles.card} elevation={1}>
                      <View style={styles.cardHeader}>
                        <Text variant="titleMedium" style={styles.title}>
                          {order.orderNumber}
                        </Text>
                        <Text variant="labelSmall" style={[styles.status, { color: getStatusColor(order.status) }]}>
                          {order.status?.toUpperCase() || "PENDING"}
                        </Text>
                      </View>
                      <Text variant="bodyMedium" style={styles.customer}>Customer: {order.user?.name || "Unknown"}</Text>
                      <View style={styles.itemsList}>
                        <Text variant="bodySmall" style={styles.meta}>
                          {order.items?.map((item) => `${item.name} (x${item.quantity})`).join(", ")}
                        </Text>
                      </View>
                      <View style={styles.cardFooter}>
                        <View style={styles.priceRow}>
                          <Text variant="titleMedium" style={styles.price}>{formatCurrency(order.total)}</Text>
                          {order.shippingAddress?.phone || order.user?.Cell ? (
                            <IconButton 
                              icon="whatsapp" 
                              iconColor="#25D366" 
                              size={24} 
                              onPress={() => openWhatsApp(order.shippingAddress?.phone || order.user?.Cell, order.orderNumber)} 
                            />
                          ) : null}
                        </View>

                        <View style={styles.actions}>
                          {getNextStatus(order.status) ? (
                            <AppButton
                              mode="contained"
                              onPress={() => handleUpdate(order._id, getNextStatus(order.status).value)}
                              style={styles.button}
                            >
                              Move to {getNextStatus(order.status).label}
                            </AppButton>
                          ) : (
                            <Text variant="labelSmall" style={styles.completedText}>
                              {order.status === "completed" ? "Order Completed ✅" : "Awaiting Customer"}
                            </Text>
                          )}
                          <AppButton
                            mode="outlined"
                            onPress={() => handleUpdate(order._id, "cancelled")}
                            style={[styles.button, { borderColor: "#d32f2f" }]}
                            labelStyle={{ color: "#d32f2f" }}
                          >
                            Cancel
                          </AppButton>
                        </View>
                      </View>
                    </Surface>
                  ))}
                </View>
              )}
            </View>
          );
        })
      ) : (
        <EmptyState title="No seller orders yet" subtitle={state.error || "Orders placed for your products will appear here."} />
      )}
    </ScreenShell>
  );
}

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'completed': return '#2e7d32';
    case 'pending': return '#ed6c02';
    case 'cancelled': return '#d32f2f';
    case 'processing': return '#0288d1';
    default: return '#432818';
  }
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
    paddingVertical: 4,
  },
  sectionHeaderText: {
    color: "#8a4b2a",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ead7c0",
  },
  sectionItems: {
    gap: 12,
  },
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    gap: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    color: "#432818",
    fontWeight: "900",
  },
  status: {
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  customer: {
    color: "#6b4f3a",
    fontWeight: "bold",
  },
  itemsList: {
    backgroundColor: "rgba(234, 215, 192, 0.2)",
    padding: 8,
    borderRadius: 12,
    marginVertical: 4,
  },
  meta: {
    color: "#7c5d48",
  },
  cardFooter: {
    marginTop: 8,
    gap: 12,
  },
  price: {
    color: "#8a4b2a",
    fontWeight: "900",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  completedText: {
    color: "#2e7d32",
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0e6d6",
    paddingTop: 12,
  },
  button: {
    marginRight: 0,
    flex: 1,
    minWidth: 100,
  },
});
