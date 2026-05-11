import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Text, Avatar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function HeaderBanner() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const canGoBack = navigation.canGoBack();

  if (!user) return null;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.banner}>
        <View style={styles.userInfo}>
          {canGoBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#ead7c0" />
            </TouchableOpacity>
          )}
          <Avatar.Text 
            size={40} 
            label={user.name ? user.name.substring(0, 2).toUpperCase() : "U"} 
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.textContainer}>
            <Text variant="labelSmall" style={styles.welcomeText}>Welcome back,</Text>
            <Text variant="titleMedium" style={styles.userName}>{user.name}</Text>
            <View style={styles.roleTag}>
              <Text variant="labelSmall" style={styles.userRole}>{user.role?.replace("/", " & ")}</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <View style={styles.logoutIconCircle}>
            <MaterialCommunityIcons name="logout" size={16} color="#432818" />
          </View>
          <Text variant="labelLarge" style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#432818",
  },
  banner: {
    backgroundColor: "#432818",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    marginRight: 4,
    padding: 4,
  },
  avatar: {
    backgroundColor: "#ead7c0",
    borderWidth: 2,
    borderColor: "#8a4b2a",
  },
  avatarLabel: {
    color: "#432818",
    fontWeight: "bold",
  },
  textContainer: {
    justifyContent: "center",
  },
  welcomeText: {
    color: "#ead7c0",
    opacity: 0.8,
    marginBottom: -2,
  },
  userName: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },
  roleTag: {
    backgroundColor: "rgba(138, 75, 42, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  userRole: {
    color: "#fff7ee",
    textTransform: "uppercase",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  logoutIconCircle: {
    backgroundColor: "#ead7c0",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
});
