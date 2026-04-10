import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
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
import NoteCard from "@/components/NoteCard";
import { useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const { notes, subjects, getSubjectById } = useNotes();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = notes;
    if (filterSubjectId) result = result.filter((n) => n.subjectId === filterSubjectId);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.notes.toLowerCase().includes(q) ||
          n.cues.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notes, search, filterSubjectId]);

  function handleNewNote() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/note/new");
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.appTitle, { color: colors.foreground }]}>康奈尔笔记</Text>
            <Text style={[styles.noteCount, { color: colors.mutedForeground }]}>{notes.length} 条笔记</Text>
          </View>
          <TouchableOpacity
            onPress={handleNewNote}
            style={[styles.fab, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            testID="new-note-btn"
          >
            <Feather name="plus" size={20} color={colors.primaryForeground} />
            <Text style={[styles.fabText, { color: colors.primaryForeground }]}>新建</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={search}
            onChangeText={setSearch}
            placeholder="搜索笔记..."
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          horizontal
          data={[{ id: null as string | null, name: "全部" }, ...subjects.map((s) => ({ id: s.id, name: s.name }))]}
          keyExtractor={(item) => item.id ?? "all"}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => {
            const isActive = filterSubjectId === item.id;
            const subj = subjects.find((s) => s.id === item.id);
            const color = subj
              ? (colors.subjectColors as string[])[subj.colorIndex % (colors.subjectColors as string[]).length]
              : colors.primary;
            return (
              <TouchableOpacity
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setFilterSubjectId(isActive ? null : (item.id as string | null));
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? color : colors.muted,
                    borderRadius: 100,
                  },
                ]}
              >
                <Text style={[styles.filterText, { color: isActive ? "#fff" : colors.mutedForeground }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 80 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        renderItem={({ item }) => (
          <NoteCard note={item} subject={getSubjectById(item.subjectId)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState
              icon="book"
              title={search ? "未找到相关笔记" : "还没有笔记"}
              description={search ? "试试其他关键词" : "点击「新建」创建你的第一条康奈尔笔记"}
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  noteCount: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: "Inter_400Regular",
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  fabText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  filters: {
    gap: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    paddingTop: 12,
  },
  empty: {
    flex: 1,
    marginTop: 80,
  },
});
