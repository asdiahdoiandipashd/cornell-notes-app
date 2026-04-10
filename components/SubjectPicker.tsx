import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Subject, useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

type Props = {
  selectedId: string;
  onSelect: (id: string) => void;
};

export default function SubjectPicker({ selectedId, onSelect }: Props) {
  const { subjects, addSubject } = useNotes();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [newName, setNewName] = useState("");

  const selected = subjects.find((s) => s.id === selectedId);
  const selectedColor = selected
    ? (colors.subjectColors as string[])[selected.colorIndex % (colors.subjectColors as string[]).length]
    : colors.mutedForeground;

  function handleAddSubject() {
    if (!newName.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const s = addSubject(newName.trim());
    onSelect(s.id);
    setNewName("");
    setVisible(false);
  }

  function handleSelect(id: string) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    onSelect(id);
    setVisible(false);
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={[styles.trigger, { borderColor: selectedColor, backgroundColor: selectedColor + "15", borderRadius: colors.radius / 2 }]}
      >
        <View style={[styles.dot, { backgroundColor: selectedColor }]} />
        <Text style={[styles.triggerText, { color: selectedColor }]}>
          {selected ? selected.name : "选择科目"}
        </Text>
        <Feather name="chevron-down" size={14} color={selectedColor} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16, borderRadius: colors.radius }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.foreground }]}>选择科目</Text>
          <ScrollView style={styles.list}>
            {subjects.map((s) => {
              const color = (colors.subjectColors as string[])[s.colorIndex % (colors.subjectColors as string[]).length];
              const isSelected = s.id === selectedId;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.subjectItem, isSelected && { backgroundColor: color + "15" }]}
                  onPress={() => handleSelect(s.id)}
                >
                  <View style={[styles.colorDot, { backgroundColor: color }]} />
                  <Text style={[styles.subjectName, { color: colors.foreground, fontWeight: isSelected ? "700" : "400" }]}>
                    {s.name}
                  </Text>
                  {isSelected && <Feather name="check" size={16} color={color} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={[styles.addRow, { borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.addInput, { color: colors.foreground, borderColor: colors.border, borderRadius: colors.radius / 2, backgroundColor: colors.muted }]}
              value={newName}
              onChangeText={setNewName}
              placeholder="添加新科目..."
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="done"
              onSubmitEditing={handleAddSubject}
            />
            <TouchableOpacity
              onPress={handleAddSubject}
              style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: colors.radius / 2 }]}
            >
              <Feather name="plus" size={18} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  triggerText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    maxHeight: "60%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
  },
  list: {
    paddingHorizontal: 12,
  },
  subjectItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 10,
    marginVertical: 2,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  subjectName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  addRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  addInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 12,
    fontSize: 15,
    borderWidth: 1,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
});
