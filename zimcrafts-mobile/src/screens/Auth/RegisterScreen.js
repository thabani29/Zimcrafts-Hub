import React, { useState } from "react";
import { StyleSheet, View, ScrollView, Alert } from "react-native";
import { Surface, Text, Divider, SegmentedButtons, HelperText } from "react-native-paper";
import AppButton from "../../components/AppButton";
import AppTextField from "../../components/AppTextField";
import ScreenShell from "../../components/ScreenShell";
import { useAuth } from "../../context/AuthContext";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  Cell: "",
  address: "home",
  street: "",
  city: "",
  state: "",
  country: "Zimbabwe",
  zipCode: "",
  role: "customer",
};

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.email) errors.email = "Email is required";
    else if (!emailRegex.test(form.email)) errors.email = "Invalid email format";
    
    if (!form.password) errors.password = "Password is required";
    else if (form.password.length < 8) errors.password = "Min 8 characters required";
    
    if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";
    
    if (!form.Cell) errors.Cell = "Phone number is required";
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const response = await register(form);
      Alert.alert("Success", response.message || "Registration successful! Please login.", [
        { text: "Go to Login", onPress: () => navigation.navigate("Login") }
      ]);
    } catch (err) {
      Alert.alert("Registration Failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Surface style={styles.form} elevation={1}>
          <Text variant="headlineSmall" style={styles.title}>Join ZimCrafts Hub</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Create your account and start your journey</Text>
          
          <Divider style={styles.divider} />
          <Text variant="labelLarge" style={styles.sectionTitle}>Personal Information</Text>
          
          <AppTextField 
            label="Full Name *" 
            value={form.name} 
            onChangeText={(v) => updateField("name", v)}
            error={!!fieldErrors.name}
          />
          {fieldErrors.name && <HelperText type="error">{fieldErrors.name}</HelperText>}

          <AppTextField 
            label="Email Address *" 
            autoCapitalize="none" 
            keyboardType="email-address" 
            value={form.email} 
            onChangeText={(v) => updateField("email", v)}
            error={!!fieldErrors.email}
          />
          {fieldErrors.email && <HelperText type="error">{fieldErrors.email}</HelperText>}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppTextField 
                label="Password *" 
                secureTextEntry 
                value={form.password} 
                onChangeText={(v) => updateField("password", v)}
                error={!!fieldErrors.password}
              />
              {fieldErrors.password && <HelperText type="error">{fieldErrors.password}</HelperText>}
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <AppTextField 
                label="Confirm *" 
                secureTextEntry 
                value={form.confirmPassword} 
                onChangeText={(v) => updateField("confirmPassword", v)}
                error={!!fieldErrors.confirmPassword}
              />
              {fieldErrors.confirmPassword && <HelperText type="error">{fieldErrors.confirmPassword}</HelperText>}
            </View>
          </View>

          <Divider style={styles.divider} />
          <Text variant="labelLarge" style={styles.sectionTitle}>Contact & Address</Text>

          <AppTextField 
            label="Phone Number (Cell) *" 
            value={form.Cell} 
            onChangeText={(v) => updateField("Cell", v)}
            keyboardType="phone-pad"
            error={!!fieldErrors.Cell}
          />
          {fieldErrors.Cell && <HelperText type="error">{fieldErrors.Cell}</HelperText>}

          <Text variant="labelSmall" style={styles.inputLabel}>Address Type</Text>
          <SegmentedButtons
            value={form.address}
            onValueChange={(v) => updateField("address", v)}
            buttons={[
              { value: "home", label: "Home" },
              { value: "work", label: "Work" },
              { value: "other", label: "Other" },
            ]}
            style={styles.segmented}
          />

          <AppTextField label="Street Address" value={form.street} onChangeText={(v) => updateField("street", v)} />
          <View style={styles.row}>
            <AppTextField label="City" value={form.city} onChangeText={(v) => updateField("city", v)} containerStyle={{ flex: 1, marginRight: 8 }} />
            <AppTextField label="Province" value={form.state} onChangeText={(v) => updateField("state", v)} containerStyle={{ flex: 1 }} />
          </View>
          <AppTextField label="ZIP / Postal Code" value={form.zipCode} onChangeText={(v) => updateField("zipCode", v)} />

          <Divider style={styles.divider} />
          <Text variant="labelLarge" style={styles.sectionTitle}>I want to join as a *</Text>
          <SegmentedButtons
            value={form.role}
            onValueChange={(v) => updateField("role", v)}
            buttons={[
              { value: "customer", label: "Customer 🛒" },
              { value: "artisan/seller", label: "Artisan 👨‍🎨" },
            ]}
            style={styles.segmented}
          />

          <AppButton 
            loading={submitting} 
            disabled={submitting} 
            onPress={handleSubmit}
            style={styles.submitBtn}
          >
            Create Account
          </AppButton>
          
          <AppButton mode="text" onPress={() => navigation.goBack()}>
            Already have an account? Sign in
          </AppButton>
        </Surface>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: "#fffdf9",
    gap: 8,
  },
  title: {
    fontWeight: "900",
    color: "#432818",
    textAlign: "center",
  },
  subtitle: {
    color: "#7c5d48",
    textAlign: "center",
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: "#ead7c0",
  },
  sectionTitle: {
    color: "#8a4b2a",
    fontWeight: "bold",
    marginBottom: 4,
  },
  inputLabel: {
    color: "#432818",
    marginLeft: 4,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
  },
  segmented: {
    marginVertical: 8,
  },
  submitBtn: {
    marginTop: 16,
  },
});
