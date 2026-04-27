import React, { useEffect, useState } from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import StatusChip from "../../components/StatusChip";
import { formatCurrency } from "../../utils/formatters";

export default function WalletScreen() {
  const [amount, setAmount] = useState(10);
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    wallet: null,
    transactions: [],
    error: "",
  });

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async (refreshing = false) => {
    try {
      setState((current) => ({ ...current, loading: !refreshing, refreshing, error: "" }));
      const [walletResponse, transactionsResponse] = await Promise.all([
        client.getWalletBalance(),
        client.getWalletTransactions(),
      ]);

      setState({
        loading: false,
        refreshing: false,
        wallet: walletResponse.data || null,
        transactions: transactionsResponse.data || [],
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

  const handleTopup = async () => {
    try {
      const response = await client.startWalletTopup(amount);
      const redirectUrl = response.data?.redirectUrl;
      if (redirectUrl) {
        await Linking.openURL(redirectUrl);
      } else {
        Alert.alert("Top-up started", "Paynow session created, but no redirect URL was returned.");
      }
    } catch (error) {
      Alert.alert("Top-up failed", error.message);
    }
  };

  if (state.loading) {
    return <LoadingState label="Loading wallet..." />;
  }

  const balance = Number(state.wallet?.balance || 0);
  const walletStatus = balance <= -10 ? "SUSPENDED" : state.wallet?.status || "ACTIVE";

  return (
    <ScreenShell refreshing={state.refreshing} onRefresh={() => loadWallet(true)}>
      <Surface style={styles.hero} elevation={1}>
        <View style={styles.heroHeader}>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Wallet
          </Text>
          <StatusChip value={walletStatus} />
        </View>
        <Text variant="displaySmall" style={[styles.balance, walletStatus === "SUSPENDED" && styles.negative]}>
          {formatCurrency(balance)}
        </Text>
        {balance < 0 ? (
          <Text variant="bodyMedium" style={styles.warning}>
            Warning: your wallet is negative.
          </Text>
        ) : null}
        {balance <= -10 ? (
          <Text variant="bodyMedium" style={styles.suspended}>
            Suspension: balances at or below -10 are marked suspended until topped up.
          </Text>
        ) : null}
      </Surface>

      <Surface style={styles.card} elevation={1}>
        <Text variant="titleMedium" style={styles.title}>
          Top up with Paynow
        </Text>
        <Text variant="bodyMedium">Tap to add {formatCurrency(amount)} to your artisan wallet.</Text>
        <AppButton onPress={handleTopup}>Top-up button</AppButton>
      </Surface>

      <Surface style={styles.card} elevation={1}>
        <Text variant="titleMedium" style={styles.title}>
          Recent transactions
        </Text>
        {state.transactions.length ? (
          state.transactions.slice(0, 8).map((entry) => (
            <View key={entry._id} style={styles.transactionRow}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium">{entry.description || entry.type}</Text>
                <Text variant="bodySmall" style={styles.meta}>
                  {entry.type}
                </Text>
              </View>
              <Text variant="bodyMedium">{formatCurrency(entry.amount)}</Text>
            </View>
          ))
        ) : (
          <EmptyState title="No wallet transactions yet" subtitle={state.error || "Top-ups and settlements will appear here."} />
        )}
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: "#432818",
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
  balance: {
    color: "#fff7ee",
    fontWeight: "900",
  },
  negative: {
    color: "#ffd7cf",
  },
  warning: {
    color: "#f6d1b9",
  },
  suspended: {
    color: "#ffb2a5",
    fontWeight: "700",
  },
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
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  meta: {
    color: "#7c5d48",
  },
});
