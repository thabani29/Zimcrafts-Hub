import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { HelperText, Surface, Text } from "react-native-paper";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import ScreenShell from "../../components/ScreenShell";
import { useAuth } from "../../context/AuthContext";

const initialForm = {
  name: "",
  email: "",
  password: "",
  Cell: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  role: "customer",
};

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setMessage("");
      setError("");
      const response = await register(form);
      setMessage(response.message || "Registration successful. Check your email to verify your account.");
      setForm(initialForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell>
      <Surface style={styles.form} elevation={1}>
        <Text variant="headlineSmall" style={styles.title}>
          Join the marketplace
        </Text>
        <AppTextField label="Full name" value={form.name} onChangeText={(value) => updateField("name", value)} />
        <AppTextField label="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(value) => updateField("email", value)} />
        <AppTextField label="Password" secureTextEntry value={form.password} onChangeText={(value) => updateField("password", value)} />
        <AppTextField label="Phone number" value={form.Cell} onChangeText={(value) => updateField("Cell", value)} />
        <AppTextField label="Street" value={form.street} onChangeText={(value) => updateField("street", value)} />
        <AppTextField label="City" value={form.city} onChangeText={(value) => updateField("city", value)} />
        <AppTextField label="Province / State" value={form.state} onChangeText={(value) => updateField("state", value)} />
        <AppTextField label="ZIP code" value={form.zipCode} onChangeText={(value) => updateField("zipCode", value)} />
        <AppButton
          mode={form.role === "customer" ? "contained" : "outlined"}
          onPress={() => updateField("role", "customer")}
        >
          Register as customer
        </AppButton>
        <AppButton
          mode={form.role === "artisan/seller" ? "contained" : "outlined"}
          onPress={() => updateField("role", "artisan/seller")}
        >
          Register as artisan
        </AppButton>
        <HelperText type="info" visible={Boolean(message)}>
          {message}
        </HelperText>
        <HelperText type="error" visible={Boolean(error)}>
          {error}
        </HelperText>
        <AppButton loading={submitting} disabled={submitting} onPress={handleSubmit}>
          Create account
        </AppButton>
        <AppButton mode="text" onPress={() => navigation.goBack()}>
          Back to sign in
        </AppButton>
      </Surface>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    gap: 12,
  },
  title: {
    fontWeight: "800",
    color: "#432818",
  },
});
