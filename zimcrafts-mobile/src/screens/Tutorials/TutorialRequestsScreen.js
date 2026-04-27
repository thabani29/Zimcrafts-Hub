import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Surface, Text } from "react-native-paper";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import StatusChip from "../../components/StatusChip";

export default function TutorialRequestsScreen() {
  const [state, setState] = useState({ loading: true, refreshing: false, requests: [], error: "" });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async (refreshing = false) => {
    try {
      setState((current) => ({ ...current, loading: !refreshing, refreshing, error: "" }));
      const response = await client.getArtisanTutorialRequests();
      setState({
        loading: false,
        refreshing: false,
        requests: response.data || [],
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

  const handleAction = async (requestId, action) => {
    try {
      await client.respondToTutorialRequest(requestId, action);
      await loadRequests(true);
    } catch (error) {
      Alert.alert("Action failed", error.message);
    }
  };

  if (state.loading) {
    return <LoadingState label="Loading tutorial requests..." />;
  }

  return (
    <ScreenShell refreshing={state.refreshing} onRefresh={() => loadRequests(true)}>
      {state.requests.length ? (
        state.requests.map((request) => (
          <Surface key={request._id} style={styles.card} elevation={1}>
            <View style={styles.row}>
              <Text variant="titleMedium" style={styles.title}>
                {request.tutorialId?.title || "Tutorial"}
              </Text>
              <StatusChip value={request.status} />
            </View>
            <Text variant="bodyMedium">Customer: {request.customerId?.name || "Unknown"}</Text>
            <Text variant="bodyMedium">Email: {request.customerId?.email || "Unknown"}</Text>
            <Text variant="bodyMedium">Message: {request.message || "No message provided."}</Text>
            {request.status === "PENDING" ? (
              <View style={styles.actions}>
                <AppButton onPress={() => handleAction(request._id, "APPROVE")} style={styles.button}>
                  Approve
                </AppButton>
                <AppButton mode="outlined" onPress={() => handleAction(request._id, "REJECT")} style={styles.button}>
                  Reject
                </AppButton>
              </View>
            ) : null}
          </Surface>
        ))
      ) : (
        <EmptyState title="No tutorial requests yet" subtitle={state.error || "New customer enrollment requests will appear here."} />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  title: {
    color: "#432818",
    fontWeight: "800",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
  },
});
