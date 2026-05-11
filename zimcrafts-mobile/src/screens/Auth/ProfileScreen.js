import React from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Surface, Text, Avatar, List, Divider } from "react-native-paper";
import ScreenShell from "../../components/ScreenShell";
import { useAuth } from "../../context/AuthContext";
import AppButton from "../../components/AppButton";

export default function ProfileScreen({ navigation }) {
  const { user, logout, isArtisan } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <ScreenShell>
      <Surface style={styles.header} elevation={1}>
        <Avatar.Text 
          size={80} 
          label={user?.name?.charAt(0).toUpperCase() || "U"} 
          style={styles.avatar}
          labelStyle={styles.avatarLabel}
        />
        <Text variant="headlineSmall" style={styles.name}>{user?.name}</Text>
        <Text variant="bodyMedium" style={styles.email}>{user?.email}</Text>
        <View style={styles.badgeRow}>
          <Surface style={styles.badge} elevation={0}>
            <Text style={styles.badgeText}>{user?.role?.toUpperCase()}</Text>
          </Surface>
        </View>
      </Surface>

      <Surface style={styles.menu} elevation={1}>
        <List.Section>
          <List.Subheader>Account Settings</List.Subheader>
          <List.Item
            title="My Orders"
            left={props => <List.Icon {...props} icon="package-variant-closed" />}
            onPress={() => navigation.navigate("Orders")}
          />
          <List.Item
            title="My Learning"
            left={props => <List.Icon {...props} icon="school" />}
            onPress={() => navigation.navigate("Tutorials")}
          />
          {isArtisan && (
            <>
              <Divider />
              <List.Subheader>Artisan Studio</List.Subheader>
              <List.Item
                title="Seller Dashboard"
                left={props => <List.Icon {...props} icon="view-dashboard" />}
                onPress={() => navigation.navigate("Dashboard")}
              />
              <List.Item
                title="My Wallet"
                left={props => <List.Icon {...props} icon="wallet" />}
                onPress={() => navigation.navigate("Wallet")}
              />
            </>
          )}
          <Divider />
          <List.Item
            title="Sign Out"
            titleStyle={{ color: "#d32f2f" }}
            left={props => <List.Icon {...props} icon="logout" color="#d32f2f" />}
            onPress={handleLogout}
          />
        </List.Section>
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#432818",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatar: {
    backgroundColor: "#ead7c0",
    marginBottom: 16,
  },
  avatarLabel: {
    color: "#432818",
  },
  name: {
    color: "#fff7ee",
    fontWeight: "900",
  },
  email: {
    color: "#ead7c0",
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  menu: {
    margin: 16,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    overflow: "hidden",
  },
});
