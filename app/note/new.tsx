import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CornellNoteEditor from "@/components/CornellNoteEditor";
import SubjectPicker from "@/components/SubjectPicker";
import { useAISettings } from "@/context/AISettingsContext";
import { useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";

export default function NewNoteScreen() {
  const { addNote, subjects } = useNotes();
  const { analyzeNotes, isAnalyzing } = useAISettings();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState("");
  const [cues, setCues] = useState("");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");

  function handleSave() {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addNote({ title: title || "未命名笔记", cues, notes, summary, subjectId });
    router.back();
  }

  async function handleAIAnalyze() {
    if (!notes.trim()) {
      Alert.alert("提示", "请先在「课堂笔记」区域写一些内容，AI 才能分析。");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await analyzeNotes(notes, title || undefined);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCues(result.cues);
      setSummary(result.summary);
    } catch (err) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = err instanceof Error ? err.message : "AI 分析出现错误，请稍后重试。";
      Alert.alert("分析失败", message);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.navbar, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]}>新建笔记</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: colors.radius / 2 }]}
          testID="save-note-btn"
        >
          <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>保存</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.subjectRow, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <SubjectPicker selectedId={subjectId} onSelect={setSubjectId} />
      </View>

      <CornellNoteEditor
        title={title}
        cues={cues}
        notes={notes}
        summary={summary}
        onChangeTitle={setTitle}
        onChangeCues={setCues}
        onChangeNotes={setNotes}
        onChangeSummary={setSummary}
        onAIAnalyze={handleAIAnalyze}
        isAnalyzing={isAnalyzing}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  navBtn: {
    padding: 4,
  },
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  subjectRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
