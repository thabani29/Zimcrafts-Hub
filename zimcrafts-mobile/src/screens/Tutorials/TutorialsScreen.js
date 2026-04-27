import React, { useEffect, useState } from "react";
import { Surface, Text } from "react-native-paper";
import client from "../../api/client";
import EmptyState from "../../components/EmptyState";
import LoadingState from "../../components/LoadingState";
import ScreenShell from "../../components/ScreenShell";
import TutorialCard from "../../components/TutorialCard";
import { useAuth } from "../../context/AuthContext";

export default function TutorialsScreen({ navigation }) {
  const { isArtisan } = useAuth();
  const [state, setState] = useState({ loading: true, refreshing: false, tutorials: [], error: "" });

  useEffect(() => {
    loadTutorials();
  }, []);

  const loadTutorials = async (refreshing = false) => {
    try {
      setState((current) => ({ ...current, loading: !refreshing, refreshing, error: "" }));
      const response = await client.getTutorials({ limit: 20 });
      setState({
        loading: false,
        refreshing: false,
        tutorials: response.data || [],
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
    return <LoadingState label="Loading tutorials..." />;
  }

  return (
    <ScreenShell refreshing={state.refreshing} onRefresh={() => loadTutorials(true)}>
      <Surface style={{ padding: 18, borderRadius: 22, backgroundColor: "#fffdf9", gap: 8 }} elevation={1}>
        <Text variant="titleLarge" style={{ color: "#432818", fontWeight: "800" }}>
          Artisan learning
        </Text>
        <Text variant="bodyMedium" style={{ color: "#6b4f3a" }}>
          Browse tutorials and request enrollment directly from mobile.
        </Text>
        {isArtisan ? (
          <Text
            variant="bodyMedium"
            style={{ color: "#8a4b2a", fontWeight: "700" }}
            onPress={() => navigation.navigate("TutorialRequests")}
          >
            View tutorial requests
          </Text>
        ) : null}
      </Surface>
      {state.tutorials.length ? (
        state.tutorials.map((tutorial) => (
          <TutorialCard
            key={tutorial._id}
            tutorial={tutorial}
            onPress={() =>
              navigation.navigate("TutorialDetail", {
                tutorialId: tutorial._id,
                tutorialTitle: tutorial.title,
              })
            }
          />
        ))
      ) : (
        <EmptyState title="No tutorials available yet" subtitle={state.error || "Pull to refresh later."} />
      )}
    </ScreenShell>
  );
}
