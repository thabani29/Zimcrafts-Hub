import React from "react";
import { Chip } from "react-native-paper";

const palette = {
  ACTIVE: { backgroundColor: "#d7f2e3", textColor: "#155d3b" },
  SUSPENDED: { backgroundColor: "#f9d7d3", textColor: "#8a1c1c" },
  PENDING: { backgroundColor: "#f6ead0", textColor: "#8a5a00" },
  APPROVED: { backgroundColor: "#d7f2e3", textColor: "#155d3b" },
  REJECTED: { backgroundColor: "#f9d7d3", textColor: "#8a1c1c" },
};

export default function StatusChip({ value }) {
  const colors = palette[value] || { backgroundColor: "#e5ddd2", textColor: "#5b4636" };

  return (
    <Chip
      compact
      style={{ backgroundColor: colors.backgroundColor }}
      textStyle={{ color: colors.textColor, fontWeight: "700" }}
    >
      {value}
    </Chip>
  );
}
