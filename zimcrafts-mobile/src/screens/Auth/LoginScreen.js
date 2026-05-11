import React, { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { HelperText, Surface, Text } from "react-native-paper";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import ScreenShell from "../../components/ScreenShell";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      setError("");
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell contentContainerStyle={styles.container}>
      <Surface style={styles.hero} elevation={1}>
        <Text variant="headlineMedium" style={styles.title}>
          ZimCrafts Hub
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Sign in to shop handmade pieces, track orders, and manage artisan sales.
        </Text>
      </Surface>

      <Surface style={styles.form} elevation={1}>
        <AppTextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <AppTextField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <HelperText type="error" visible={Boolean(error)}>
          {error}
        </HelperText>
        <View style={styles.forgotPasswordContainer}>
          <AppButton
            mode="text"
            compact
            onPress={() => navigation.navigate("ForgotPassword")}
            labelStyle={styles.forgotPasswordText}
          >
            Forgot Password?
          </AppButton>
        </View>
        <AppButton loading={submitting} disabled={submitting} onPress={handleLogin}>
          Sign in
        </AppButton>
        <View style={styles.row}>
          <Text variant="bodyMedium">No account yet?</Text>
          <AppButton mode="text" onPress={() => navigation.navigate("Register")}>
            Register
          </AppButton>
        </View>
        <AppButton
          mode="outlined"
          onPress={() =>
            Alert.alert(
              "Email verification",
              "The backend requires verified accounts before login. Register with a valid email so the verification link can be sent."
            )
          }
        >
          Verification info
        </AppButton>
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginTop: -10,
    marginBottom: 5,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: "#e67e22",
  },
});
