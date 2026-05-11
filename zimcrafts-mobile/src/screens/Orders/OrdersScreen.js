import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View, LayoutAnimation, Platform, UIManager } from "react-native";
import { Surface, Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import client from "../../api/client";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import { formatCurrency } from "../../utils/formatters";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function OrdersScreen({ navigation }) {
  const [state, setState] = useState({ loading: true, refreshing: false, orders: [], error: "" });
  const [collapsedMonths, setCollapsedMonths] = useState({});

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadOrders();
    });
    return unsubscribe;
  }, [navigation]);

  const loadOrders = async (refreshing = false) => {
    try {
      setState((current) => ({ ...current, loading: !refreshing, refreshing, error: "" }));
      const response = await client.getMyOrders();
      setState({
        loading: false,
        refreshing: false,
        orders: response.data || response.orders || [],
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
    return <LoadingState label="Loading your orders..." />;
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
                    <TouchableOpacity key={order._id} onPress={() => navigation.navigate("OrderDetail", { orderId: order._id })}>
                      <Surface style={styles.card} elevation={1}>
                        <View style={styles.cardHeader}>
                          <Text variant="titleMedium" style={styles.title}>
                            {order.orderNumber}
                          </Text>
                          <Text variant="labelSmall" style={[styles.status, { color: getStatusColor(order.status) }]}>
                            {order.status?.toUpperCase() || "PENDING"}
                          </Text>
                        </View>
                        <Text variant="bodyMedium" style={styles.details}>Payment: {order.paymentStatus || order.paymentMethod}</Text>
                        <View style={styles.cardFooter}>
                          <Text variant="bodySmall" style={styles.meta}>
                            {order.items?.length || 0} item(s)
                          </Text>
                          <Text variant="titleMedium" style={styles.price}>{formatCurrency(order.total)}</Text>
                        </View>
                      </Surface>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })
      ) : (
        <EmptyState title="No orders yet" subtitle={state.error || "Place your first order from the Products tab."} />
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
  details: {
    color: "#6b4f3a",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0e6d6",
    paddingTop: 8,
  },
  price: {
    color: "#8a4b2a",
    fontWeight: "900",
  },
  meta: {
    color: "#7c5d48",
  },
});
