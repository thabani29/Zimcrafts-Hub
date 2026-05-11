import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Menu, Text, TextInput } from "react-native-paper";

export default function CategoryPicker({ categories = [], selectedId, onSelect, error }) {
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const selectedCategory = Array.isArray(categories) ? categories.find((cat) => cat._id === selectedId) : null;

  return (
    <View style={styles.container}>
      <Text variant="labelSmall" style={styles.label}>Category *</Text>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={
          <Button 
            mode="outlined" 
            onPress={openMenu} 
            style={[styles.anchor, error && styles.errorBorder]}
            contentStyle={styles.anchorContent}
            labelStyle={styles.anchorLabel}
          >
            {selectedCategory ? selectedCategory.name : "Select a category"}
          </Button>
        }
      >
        {Array.isArray(categories) && categories.map((cat) => (
          <Menu.Item
            key={cat._id}
            onPress={() => {
              onSelect(cat._id);
              closeMenu();
            }}
            title={cat.name}
          />
        ))}
      </Menu>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    color: "#432818",
    marginLeft: 4,
    marginBottom: 4,
  },
  anchor: {
    borderRadius: 12,
    borderColor: "#ead7c0",
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
  },
  anchorContent: {
    height: 56,
    justifyContent: "flex-start",
  },
  anchorLabel: {
    color: "#432818",
    fontSize: 16,
  },
  errorBorder: {
    borderColor: "#d32f2f",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 12,
    marginLeft: 12,
    marginTop: 4,
  },
});
