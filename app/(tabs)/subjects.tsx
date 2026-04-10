import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EmptyState from "@/components/EmptyState";
import { useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

export default function SubjectsScreen() {
  const { subjects, notes, addSubject, deleteSubject } = useNotes();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [newName, setNewName] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : 84;

  function handleAdd() {
    if (!newName.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addSubject(newName.trim());
    setNewName("");
  }

  function handleDelete(id: string, name: string) {
    const noteCount = notes.filter((n) => n.subjectId === id).length;
    Alert.alert(
      "删除科目",
      noteCount > 0
        ? `删除「${name}」将同时删除该科目下的 ${noteCount} 条笔记。`
        : `确认删除科目「${name}」？`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteSubject(id);
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>科目管理</Text>
        <View style={[styles.addRow, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <TextInput
            style={[styles.addInput, { color: colors.foreground }]}
            value={newName}
            onChangeText={setNewName}
            placeholder="新建科目..."
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.addBtn, { backgroundColor: colors.primary, borderRadius: colors.radius / 2 }]}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={subjects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
        scrollEnabled={subjects.length > 0}
        renderItem={({ item }) => {
          const color = (colors.subjectColors as string[])[item.colorIndex % (colors.subjectColors as string[]).length];
          const noteCount = notes.filter((n) => n.subjectId === item.id).length;
          return (
            <TouchableOpacity
              style={[styles.subjectCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.selectionAsync();
                router.push({ pathname: "/(tabs)" });
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.colorStripe, { backgroundColor: color }]} />
              <View style={styles.subjectInfo}>
                <Text style={[styles.subjectName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.subjectCount, { color: colors.mutedForeground }]}>
                  {noteCount} 条笔记
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item.id, item.name)}
                style={styles.deleteBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState
              icon="folder"
              title="还没有科目"
              description="创建科目来分类你的康奈尔笔记"
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 10,
  },
  addInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
    fontFamily: "Inter_400Regular",
  },
  addBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 16,
    gap: 10,
  },
  subjectCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 10,
  },
  colorStripe: {
    width: 5,
    alignSelf: "stretch",
  },
  subjectInfo: {
    flex: 1,
    padding: 14,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  subjectCount: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  deleteBtn: {
    padding: 14,
  },
  empty: {
    marginTop: 60,
  },
});
