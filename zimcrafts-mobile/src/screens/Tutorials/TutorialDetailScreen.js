import React, { useEffect, useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { Surface, Text } from "react-native-paper";
import client from "../../api/client";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import StatusChip from "../../components/StatusChip";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/formatters";

export default function TutorialDetailScreen({ route, navigation }) {
  const { tutorialId } = route.params;
  const { isCustomer, isArtisan } = useAuth();
  const [state, setState] = useState({
    loading: true,
    tutorial: null,
    requestStatus: null,
    message: "",
    submitting: false,
    error: "",
  });

  useEffect(() => {
    loadTutorial();
  }, [tutorialId]);

  const loadTutorial = async () => {
    try {
      setState((current) => ({ ...current, loading: true, error: "" }));
      const tutorialResponse = await client.getTutorialById(tutorialId);
      let requestResponse = null;

      if (isCustomer) {
        try {
          requestResponse = await client.getTutorialRequestStatus(tutorialId);
        } catch (error) {
          requestResponse = null;
        }
      }

      setState((current) => ({
        ...current,
        loading: false,
        tutorial: tutorialResponse.data || null,
        requestStatus: requestResponse?.data || null,
      }));
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }));
    }
  };

  const handleRequest = async () => {
    try {
      setState((current) => ({ ...current, submitting: true }));
      const response = await client.requestTutorialEnrollment(tutorialId, { message: state.message });
      Alert.alert("Request sent", response.message || "Enrollment request sent.");
      await loadTutorial();
    } catch (error) {
      Alert.alert("Request failed", error.message);
    } finally {
      setState((current) => ({ ...current, submitting: false }));
    }
  };

  if (state.loading) {
    return <LoadingState label="Loading tutorial..." />;
  }

  if (!state.tutorial) {
    return (
      <ScreenShell>
        <Surface style={styles.card} elevation={1}>
          <Text variant="titleMedium">Tutorial unavailable</Text>
          <Text variant="bodyMedium">{state.error || "This tutorial could not be loaded."}</Text>
        </Surface>
      </ScreenShell>
    );
  }

  const requestStatus = state.requestStatus?.request?.status;
  const alreadyEnrolled = Boolean(state.requestStatus?.enrollment);

  return (
    <ScreenShell>
      <Surface style={styles.card} elevation={1}>
        <Text variant="headlineSmall" style={styles.title}>
          {state.tutorial.title}
        </Text>
        <Text variant="titleLarge" style={styles.price}>
          {formatCurrency(state.tutorial.price)}
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          {state.tutorial.description}
        </Text>
        <Text variant="bodyMedium">Artisan: {state.tutorial?.artisanId?.name || state.tutorial?.artisan?.name || "Unknown"}</Text>
        <Text variant="bodyMedium">
          Lessons: {Array.isArray(state.tutorial.lessons) ? state.tutorial.lessons.length : 0}
        </Text>
        {requestStatus ? <StatusChip value={requestStatus} /> : null}
        {alreadyEnrolled ? <StatusChip value="APPROVED" /> : null}
      </Surface>

      {isCustomer ? (
        <Surface style={styles.card} elevation={1}>
          {alreadyEnrolled ? (
            <>
              <Text variant="titleMedium" style={styles.title}>
                Course Access
              </Text>
              <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
                You are enrolled in this tutorial.
              </Text>
              <AppButton onPress={() => navigation.navigate("CoursePlayer", { tutorialId, title: state.tutorial.title })}>
                Start Course
              </AppButton>
            </>
          ) : (
            <>
              <Text variant="titleMedium" style={styles.title}>
                Request enrollment
              </Text>
              <AppTextField
                label="Message to artisan"
                multiline
                value={state.message}
                onChangeText={(value) => setState((current) => ({ ...current, message: value }))}
              />
              <AppButton
                loading={state.submitting}
                disabled={state.submitting || requestStatus === "PENDING"}
                onPress={handleRequest}
              >
                Request enrollment
              </AppButton>
            </>
          )}
        </Surface>
      ) : null}

      {isArtisan ? (
        <Surface style={styles.card} elevation={1}>
          <Text variant="bodyMedium" style={styles.description}>
            Use the tutorial requests screen to approve or reject customer requests.
          </Text>
        </Surface>
      ) : null}
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
  price: {
    color: "#8a4b2a",
    fontWeight: "900",
  },
  description: {
    color: "#6b4f3a",
  },
});
