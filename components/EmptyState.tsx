import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  icon: string;
  title: string;
  description: string;
};

export default function EmptyState({ icon, title, description }: Props) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
        <Feather name={icon as any} size={36} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  iconWrap: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: "Inter_700Bold",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
});
