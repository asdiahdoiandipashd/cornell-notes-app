import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import {
  getReviewStatus,
  getStageName,
  getStageInterval,
  getProgressPercent,
  getTotalStages,
  formatReviewDate,
} from "@/services/reviewService";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, updateNote, deleteNote, completeReview } = useNotes();
  const { analyzeNotes, isAnalyzing } = useAISettings();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const note = notes.find((n) => n.id === id);

  const [title, setTitle] = useState(note?.title ?? "");
  const [cues, setCues] = useState(note?.cues ?? "");
  const [noteText, setNoteText] = useState(note?.notes ?? "");
  const [summary, setSummary] = useState(note?.summary ?? "");
  const [subjectId, setSubjectId] = useState(note?.subjectId ?? "");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (note) setHasChanges(
      title !== note.title ||
      cues !== note.cues ||
      noteText !== note.notes ||
      summary !== note.summary ||
      subjectId !== note.subjectId
    );
  }, [title, cues, noteText, summary, subjectId, note]);

  if (!note) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground, padding: 20 }}>笔记不存在</Text>
      </View>
    );
  }

  const reviewStatus = getReviewStatus(note.reviewCount, note.nextReviewAt);
  const isDue = reviewStatus.type === "due";
  const isCompleted = reviewStatus.type === "completed";
  const progress = getProgressPercent(note.reviewCount);
  const totalStages = getTotalStages();

  function handleSave() {
    if (!id) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateNote(id, { title: title || "未命名笔记", cues, notes: noteText, summary, subjectId });
    setHasChanges(false);
    router.back();
  }

  function handleDelete() {
    Alert.alert("删除笔记", "确认删除此笔记？此操作不可撤销。", [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: () => {
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteNote(id!);
          router.back();
        },
      },
    ]);
  }

  function handleCompleteReview() {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeReview(id!);
  }

  async function handleAIAnalyze() {
    if (!noteText.trim()) {
      Alert.alert("提示", "请先在「课堂笔记」区域写一些内容，AI 才能分析。");
      return;
    }
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await analyzeNotes(noteText, title || undefined);
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
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.foreground }]} numberOfLines={1}>
          {title || "笔记详情"}
        </Text>
        <View style={styles.navActions}>
          <TouchableOpacity onPress={handleDelete} style={styles.navBtn}>
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
          {hasChanges && (
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary, borderRadius: colors.radius / 2 }]}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>保存</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.subjectRow, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <SubjectPicker selectedId={subjectId} onSelect={setSubjectId} />
      </View>

      <ScrollView style={{ flex: 1 }} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
        <View style={[styles.reviewSection, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, marginHorizontal: 16, marginTop: 12 }]}>
          <View style={styles.reviewHeader}>
            <Feather name="clock" size={16} color={colors.primary} />
            <Text style={[styles.reviewTitle, { color: colors.foreground }]}>复习进度</Text>
            <View style={[
              styles.reviewBadge,
              {
                backgroundColor: isDue
                  ? colors.accent + "20"
                  : isCompleted
                    ? colors.primary + "20"
                    : colors.muted,
                borderRadius: 100,
              }
            ]}>
              <Text style={[
                styles.reviewBadgeText,
                {
                  color: isDue
                    ? colors.accent
                    : isCompleted
                      ? colors.primary
                      : colors.mutedForeground,
                }
              ]}>
                {reviewStatus.label}
              </Text>
            </View>
          </View>

          <View style={styles.progressRow}>
            <Text style={[styles.stageText, { color: colors.mutedForeground }]}>
              {getStageName(note.reviewCount)}
            </Text>
            {!isCompleted && (
              <Text style={[styles.intervalText, { color: colors.mutedForeground }]}>
                {getStageInterval(note.reviewCount)}
              </Text>
            )}
          </View>

          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progress * 100}%` }
            ]} />
          </View>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            已完成 {note.reviewCount}/{totalStages} 次复习
          </Text>

          {note.nextReviewAt && !isCompleted && (
            <Text style={[styles.nextReviewText, { color: colors.mutedForeground }]}>
              下次复习：{formatReviewDate(note.nextReviewAt)}
            </Text>
          )}

          {isDue && (
            <TouchableOpacity
              onPress={handleCompleteReview}
              style={[styles.completeBtn, { backgroundColor: colors.primary, borderRadius: colors.radius / 2 }]}
            >
              <Feather name="check-circle" size={16} color={colors.primaryForeground} />
              <Text style={[styles.completeBtnText, { color: colors.primaryForeground }]}>完成复习</Text>
            </TouchableOpacity>
          )}

          {note.reviewHistory.length > 0 && (
            <View style={[styles.historySection, { borderTopColor: colors.border }]}>
              <Text style={[styles.historyTitle, { color: colors.foreground }]}>复习历史</Text>
              {note.reviewHistory.map((record, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={[styles.historyDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.historyText, { color: colors.mutedForeground }]}>
                    第 {record.stage + 1} 次 · {formatReviewDate(record.reviewedAt)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <CornellNoteEditor
          title={title}
          cues={cues}
          notes={noteText}
          summary={summary}
          onChangeTitle={setTitle}
          onChangeCues={setCues}
          onChangeNotes={setNoteText}
          onChangeSummary={setSummary}
          onAIAnalyze={handleAIAnalyze}
          isAnalyzing={isAnalyzing}
          scrollable={false}
        />
      </ScrollView>
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
    fontFamily: "Inter_600SemiBold",
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  reviewSection: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  reviewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  reviewBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stageText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  intervalText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  nextReviewText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  completeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  historySection: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 6,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  historyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  historyText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
