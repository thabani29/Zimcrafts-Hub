import React from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

export default function ScreenShell({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  contentContainerStyle,
}) {
  if (!scroll) {
    return <View style={[styles.container, contentContainerStyle]}>{children}</View>;
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.container, contentContainerStyle]}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f7f2eb",
  },
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#f7f2eb",
    gap: 16,
  },
});
