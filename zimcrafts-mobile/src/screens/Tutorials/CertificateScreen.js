import React from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Surface, Text } from "react-native-paper";
import AppButton from "../../components/AppButton";
import ScreenShell from "../../components/ScreenShell";
import { useAuth } from "../../context/AuthContext";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function CertificateScreen({ route, navigation }) {
  const { user } = useAuth();
  
  const handleDownload = () => {
    // In parity with the web app, this would generate and download a PDF
    Alert.alert("Downloading...", "Your certificate PDF is being downloaded.");
  };

  return (
    <ScreenShell>
      <Surface style={styles.certificateCard} elevation={2}>
        <View style={styles.border}>
          <MaterialCommunityIcons name="seal" size={60} color="#c5a059" style={styles.seal} />
          <Text variant="headlineMedium" style={styles.header}>CERTIFICATE</Text>
          <Text variant="titleMedium" style={styles.subheader}>OF COMPLETION</Text>
          
          <Text variant="bodyMedium" style={styles.presentedTo}>This is presented to</Text>
          <Text variant="headlineSmall" style={styles.name}>{user?.name || "Student"}</Text>
          
          <Text variant="bodyMedium" style={styles.reason}>
            For successfully completing the tutorial course on ZimCrafts Hub.
          </Text>
          
          <View style={styles.signatures}>
            <View style={styles.signatureLine}>
              <Text variant="bodySmall">Director, ZimCrafts Hub</Text>
            </View>
            <View style={styles.signatureLine}>
              <Text variant="bodySmall">Course Instructor</Text>
            </View>
          </View>
        </View>
      </Surface>

      <View style={styles.actions}>
        <AppButton onPress={handleDownload} style={{ marginBottom: 12 }}>
          Download as PDF
        </AppButton>
        <AppButton mode="outlined" onPress={() => navigation.navigate("TutorialList")}>
          Return to Tutorials
        </AppButton>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  certificateCard: {
    backgroundColor: "#fffdf9",
    padding: 12,
    marginVertical: 16,
    borderRadius: 8,
  },
  border: {
    borderWidth: 2,
    borderColor: "#c5a059",
    padding: 24,
    alignItems: "center",
    position: "relative",
  },
  seal: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  header: {
    color: "#432818",
    fontWeight: "900",
    letterSpacing: 2,
    marginTop: 20,
  },
  subheader: {
    color: "#c5a059",
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 30,
  },
  presentedTo: {
    color: "#6b4f3a",
    fontStyle: "italic",
    marginBottom: 10,
  },
  name: {
    color: "#432818",
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginBottom: 20,
  },
  reason: {
    color: "#6b4f3a",
    textAlign: "center",
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#432818",
    paddingTop: 4,
    width: "40%",
    alignItems: "center",
  },
  actions: {
    marginTop: 20,
  },
});
