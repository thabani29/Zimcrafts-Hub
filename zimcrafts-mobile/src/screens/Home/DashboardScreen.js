import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View, ScrollView } from "react-native";
import { Surface, Text } from "react-native-paper";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import StatCard from "../../components/StatCard";
import StatusChip from "../../components/StatusChip";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/formatters";

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    analytics: null,
    wallet: null,
    products: [],
    tutorials: [],
    error: "",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async (refreshing = false) => {
    try {
      setState((current) => ({ ...current, loading: !refreshing, refreshing, error: "" }));
      const [analyticsResponse, walletResponse, productsResponse, tutorialsResponse] = await Promise.all([
        client.getSellerAnalytics(),
        client.getWalletBalance(),
        client.getMyProducts().catch(() => ({ data: [] })),
        client.getMyTutorials().catch(() => ({ data: [] })),
      ]);

      setState({
        loading: false,
        refreshing: false,
        analytics: analyticsResponse.data || null,
        wallet: walletResponse.data || null,
        products: productsResponse.data || [],
        tutorials: tutorialsResponse.data || [],
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
    return <LoadingState label="Opening artisan dashboard..." />;
  }

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "draft" : "active";
      await client.updateProduct(productId, { status: newStatus });
      setState((current) => ({
        ...current,
        products: current.products.map((p) => (p._id === productId ? { ...p, status: newStatus } : p)),
      }));
    } catch (error) {
      Alert.alert("Failed to update status", error.message);
    }
  };

  const deleteProduct = async (productId) => {
    Alert.alert("Delete Product", "Are you sure you want to delete this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await client.deleteProduct(productId);
            setState((current) => ({
              ...current,
              products: current.products.filter((p) => p._id !== productId),
            }));
          } catch (error) {
            Alert.alert("Failed to delete", error.message);
          }
        },
      },
    ]);
  };

  const deleteTutorial = async (tutorialId) => {
    Alert.alert("Delete Tutorial", "Are you sure you want to delete this tutorial?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await client.deleteTutorial(tutorialId);
            setState((current) => ({
              ...current,
              tutorials: current.tutorials.filter((t) => t._id !== tutorialId),
            }));
          } catch (error) {
            Alert.alert("Failed to delete", error.message);
          }
        },
      },
    ]);
  };

  const walletStatus = state.wallet?.status || (state.wallet?.balance <= -10 ? "SUSPENDED" : "ACTIVE");
  const analytics = state.analytics || {};

  return (
    <ScreenShell refreshing={state.refreshing} onRefresh={() => loadDashboard(true)}>
      <Surface style={styles.hero} elevation={1}>
        <View style={styles.heroHeader}>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Artisan dashboard
          </Text>
          <StatusChip value={walletStatus} />
        </View>
        <Text variant="bodyLarge" style={styles.heroText}>
          {user?.name || "Artisan"} is live on ZimCrafts Hub.
        </Text>
      </Surface>

      <View style={styles.grid}>
        <StatCard label="Wallet balance" value={formatCurrency(state.wallet?.balance || 0)} accent={walletStatus === "SUSPENDED" ? "#8a1c1c" : "#8a4b2a"} />
        <StatCard label="Seller orders" value={String(analytics.totalOrders || 0)} />
        <StatCard label="Tutorials" value={String(analytics.totalTutorials || 0)} />
        <StatCard label="Product revenue" value={formatCurrency(analytics.productRevenue || 0)} />
        <StatCard label="Tutorial revenue" value={formatCurrency(analytics.tutorialRevenue || 0)} />
        <StatCard label="Total revenue" value={formatCurrency(analytics.totalRevenue || 0)} />
      </View>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Studio actions
        </Text>
        <AppButton onPress={() => navigation.navigate("UploadProduct")} mode="contained" style={{ backgroundColor: "#8a4b2a" }}>
          Upload a new product
        </AppButton>
        <AppButton onPress={() => navigation.navigate("UploadTutorial")} mode="contained" style={{ backgroundColor: "#8a4b2a" }}>
          Upload a new tutorial
        </AppButton>
        <AppButton onPress={() => navigation.navigate("Orders")} mode="outlined">
          Manage orders
        </AppButton>
        <AppButton onPress={() => navigation.navigate("Wallet")} mode="outlined">
          Open wallet
        </AppButton>
        <AppButton
          onPress={() => navigation.navigate("Tutorials", { screen: "TutorialRequests" })}
          mode="outlined"
        >
          Review tutorial requests
        </AppButton>
      </Surface>

      {state.error ? <EmptyState title="Dashboard data is unavailable" subtitle={state.error} /> : null}

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          My Products ({state.products.length})
        </Text>
        {state.products.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: "#6b4f3a" }}>No products yet.</Text>
        ) : (
          state.products.map((product) => (
            <View key={product._id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyLarge" style={{ fontWeight: "700" }}>{product.name}</Text>
                <Text variant="bodyMedium">{formatCurrency(product.price)} • Stock: {product.stock} • Sold: {product.soldCount || 0}</Text>
                <StatusChip value={product.status === "active" ? "ACTIVE" : "INACTIVE"} />
              </View>
              <View style={{ gap: 4 }}>
                <AppButton mode="text" onPress={() => toggleProductStatus(product._id, product.status)}>
                  {product.status === "active" ? "Deactivate" : "Activate"}
                </AppButton>
                <AppButton mode="outlined" onPress={() => navigation.navigate("UploadProduct", { productId: product._id })}>
                  Edit
                </AppButton>
                <AppButton mode="text" textColor="#d32f2f" onPress={() => deleteProduct(product._id)}>
                  Delete
                </AppButton>
              </View>
            </View>
          ))
        )}
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          My Tutorials ({state.tutorials.length})
        </Text>
        {state.tutorials.length === 0 ? (
          <Text variant="bodyMedium" style={{ color: "#6b4f3a" }}>No tutorials yet.</Text>
        ) : (
          state.tutorials.map((tutorial) => (
            <View key={tutorial._id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyLarge" style={{ fontWeight: "700" }}>{tutorial.title}</Text>
                <Text variant="bodyMedium">{formatCurrency(tutorial.price)} • Lessons: {tutorial.lessons?.length || 0}</Text>
              </View>
              <View style={{ gap: 4 }}>
                <AppButton mode="outlined" onPress={() => navigation.navigate("UploadTutorial", { tutorialId: tutorial._id })}>
                  Edit
                </AppButton>
                <AppButton mode="text" textColor="#d32f2f" onPress={() => deleteTutorial(tutorial._id)}>
                  Delete
                </AppButton>
              </View>
            </View>
          ))
        )}
      </Surface>

      <Surface style={styles.section} elevation={1}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Account
        </Text>
        <Text variant="bodyMedium" style={styles.accountText}>
          Role: {user?.role}
        </Text>
        <Text variant="bodyMedium" style={styles.accountText}>
          Email: {user?.email}
        </Text>
        <AppButton
          mode="text"
          onPress={() =>
            Alert.alert("Sign out", "You will need to sign in again to reopen the artisan dashboard.", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: logout },
            ])
          }
        >
          Sign out
        </AppButton>
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: "#5d3522",
    gap: 10,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTitle: {
    color: "#fff7ee",
    fontWeight: "900",
  },
  heroText: {
    color: "#ead7c0",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  section: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#fffdf9",
    gap: 12,
  },
  sectionTitle: {
    color: "#432818",
    fontWeight: "800",
  },
  accountText: {
    color: "#6b4f3a",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0e6db",
  },
});
