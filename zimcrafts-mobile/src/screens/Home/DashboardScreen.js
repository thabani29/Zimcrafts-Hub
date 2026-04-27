import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
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
    error: "",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async (refreshing = false) => {
    try {
      setState((current) => ({ ...current, loading: !refreshing, refreshing, error: "" }));
      const [analyticsResponse, walletResponse] = await Promise.all([
        client.getSellerAnalytics(),
        client.getWalletBalance(),
      ]);

      setState({
        loading: false,
        refreshing: false,
        analytics: analyticsResponse.data || null,
        wallet: walletResponse.data || null,
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
          {user?.name} is live on ZimCrafts Hub.
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
        <AppButton onPress={() => navigation.navigate("Orders")}>Manage orders</AppButton>
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
});
