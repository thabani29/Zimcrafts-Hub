import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import ScreenShell from "../../components/ScreenShell";
import OrdersScreen from "./OrdersScreen";
import SellerOrdersScreen from "./SellerOrdersScreen";
import { useAuth } from "../../context/AuthContext";

export default function UnifiedOrdersScreen({ navigation }) {
  const { isArtisan } = useAuth();
  const [value, setValue] = useState(isArtisan ? "selling" : "buying");

  if (!isArtisan) {
    return <OrdersScreen navigation={navigation} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <SegmentedButtons
          value={value}
          onValueChange={setValue}
          buttons={[
            {
              value: "buying",
              label: "Purchases",
              icon: "basket",
            },
            {
              value: "selling",
              label: "Sales",
              icon: "store",
            },
          ]}
          style={styles.segments}
          theme={{ colors: { secondaryContainer: "#ead7c0" } }}
        />
      </View>
      
      <View style={{ flex: 1 }}>
        {value === "buying" ? (
          <OrdersScreen navigation={navigation} />
        ) : (
          <SellerOrdersScreen navigation={navigation} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: "#fffaf5",
    borderBottomWidth: 1,
    borderBottomColor: "#ead7c0",
  },
  segments: {
    marginHorizontal: 0,
  },
});
