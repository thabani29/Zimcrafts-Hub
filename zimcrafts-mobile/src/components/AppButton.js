import React from "react";
import { Button } from "react-native-paper";

export default function AppButton({
  children,
  mode = "contained",
  style,
  contentStyle,
  ...props
}) {
  return (
    <Button
      mode={mode}
      style={style}
      contentStyle={[{ minHeight: 48 }, contentStyle]}
      labelStyle={{ fontWeight: "700" }}
      {...props}
    >
      {children}
    </Button>
  );
}
