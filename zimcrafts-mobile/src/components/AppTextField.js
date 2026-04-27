import React from "react";
import { TextInput } from "react-native-paper";

export default function AppTextField(props) {
  return (
    <TextInput
      mode="outlined"
      outlineStyle={{ borderRadius: 16 }}
      style={{ backgroundColor: "#fffaf5" }}
      {...props}
    />
  );
}
