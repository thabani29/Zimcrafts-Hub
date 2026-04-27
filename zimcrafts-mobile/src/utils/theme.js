import { MD3LightTheme } from "react-native-paper";

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 18,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#8a4b2a",
    onPrimary: "#fff7ee",
    secondary: "#5e4735",
    onSecondary: "#fff7ee",
    background: "#f7f2eb",
    surface: "#fffdf9",
    surfaceVariant: "#f1e5d5",
    onSurface: "#432818",
    onSurfaceVariant: "#6b4f3a",
    outline: "#c9b39c",
    error: "#ba1a1a",
  },
};
