import React, { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Surface, Text } from "react-native-paper";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import ScreenShell from "../../components/ScreenShell";
import client from "../../api/client";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function VerifyEmailScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address to resend the link.");
      return;
    }
    try {
      setLoading(true);
      await client.resendVerification({ email: email.trim() });
      Alert.alert("Email Sent", "A new verification link has been sent to your email address.");
    } catch (error) {
      Alert.alert("Failed", error.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell>
      <Surface style={styles.card} elevation={1}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="email-fast" size={80} color="#8a4b2a" />
        </View>
        
        <Text variant="headlineMedium" style={styles.title}>
          Verify your email
        </Text>
        
        <Text variant="bodyLarge" style={styles.description}>
          We've sent a verification link to your email address. Please click the link to activate your account.
        </Text>
        
        <Text variant="bodyMedium" style={styles.note}>
          If you don't see the email, check your spam or junk folder.
        </Text>

        <AppTextField
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Enter your email"
        />

        <AppButton loading={loading} disabled={loading} onPress={handleResend} style={styles.button}>
          Resend Verification Email
        </AppButton>
        
        <AppButton mode="text" onPress={() => navigation.navigate("Login")}>
          Back to Login
        </AppButton>
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 20,
    backgroundColor: "#f7f2eb",
    padding: 20,
    borderRadius: 60,
  },
  title: {
    color: "#432818",
    fontWeight: "900",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    color: "#6b4f3a",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 24,
  },
  note: {
    color: "#8b7d72",
    textAlign: "center",
    marginBottom: 30,
    fontStyle: "italic",
  },
  button: {
    width: "100%",
    marginBottom: 12,
  },
});
