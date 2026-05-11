import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { HelperText, Surface, Text } from "react-native-paper";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import ScreenShell from "../../components/ScreenShell";
import client from "../../api/client";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleResetRequest = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const response = await client.forgotPassword({
        email: email.trim(),
      });

      if (response.data.success) {
        setMessage("Password reset email sent. Please check your inbox.");
        Alert.alert(
          "Success",
          "Password reset email sent. Please check your inbox.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell contentContainerStyle={styles.container}>
      <Surface style={styles.hero} elevation={1}>
        <Text variant="headlineMedium" style={styles.title}>
          Forgot Password
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Enter your email address to receive a link to reset your password.
        </Text>
      </Surface>

      <Surface style={styles.form} elevation={1}>
        <AppTextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          disabled={submitting}
        />
        
        {error ? (
          <HelperText type="error" visible={Boolean(error)}>
            {error}
          </HelperText>
        ) : null}

        {message ? (
          <Text style={styles.successText}>{message}</Text>
        ) : null}

        <AppButton
          loading={submitting}
          disabled={submitting}
          onPress={handleResetRequest}
        >
          Send Reset Link
        </AppButton>

        <View style={styles.row}>
          <AppButton mode="text" onPress={() => navigation.navigate("Login")}>
            Back to Login
          </AppButton>
        </View>
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    gap: 18,
  },
  hero: {
    padding: 22,
    borderRadius: 28,
    backgroundColor: "#e8d8c3",
    gap: 10,
  },
  title: {
    color: "#432818",
    fontWeight: "900",
  },
  subtitle: {
    color: "#5e4735",
  },
  form: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  successText: {
    color: "green",
    textAlign: "center",
    marginBottom: 10,
  },
});
