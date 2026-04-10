import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import EmptyState from "@/components/EmptyState";
import { useNotes, type CornellNote } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";
import {
  getReviewStatus,
  getStageName,
  getProgressPercent,
  getTotalStages,
  formatReviewDate,
  type ReviewStatus,
} from "@/services/reviewService";

type ReviewItem = {
  note: CornellNote;
  status: ReviewStatus;
  subjectName: string;
  subjectColor: string;
};

export default function ReviewScreen() {
  const { notes, subjects, getSubjectById, completeReview } = useNotes();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const { dueItems, upcomingItems, completedCount } = useMemo(() => {
    const due: ReviewItem[] = [];
    const upcoming: ReviewItem[] = [];
    let completed = 0;

    for (const note of notes) {
      const status = getReviewStatus(note.reviewCount, note.nextReviewAt);
      const subject = getSubjectById(note.subjectId);
      const subjectColor = subject
        ? (colors.subjectColors as string[])[subject.colorIndex % (colors.subjectColors as string[]).length]
        : colors.primary;
      const item: ReviewItem = {
        note,
        status,
        subjectName: subject?.name ?? "",
        subjectColor,
      };

      if (status.type === "completed") {
        completed++;
      } else if (status.type === "due") {
        due.push(item);
      } else {
        upcoming.push(item);
      }
    }

    due.sort((a, b) => {
      const aOverdue = a.status.type === "due" ? a.status.daysOverdue : 0;
      const bOverdue = b.status.type === "due" ? b.status.daysOverdue : 0;
      return bOverdue - aOverdue;
    });

    upcoming.sort((a, b) => {
      const aUntil = a.status.type === "upcoming" ? a.status.daysUntil : 999;
      const bUntil = b.status.type === "upcoming" ? b.status.daysUntil : 999;
      return aUntil - bUntil;
    });

    return { dueItems: due, upcomingItems: upcoming, completedCount: completed };
  }, [notes, subjects, colors]);

  function handleReview(noteId: string) {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push({ pathname: "/note/[id]", params: { id: noteId } });
  }

  function handleCompleteReview(noteId: string) {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeReview(noteId);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;
  const totalStages = getTotalStages();

  function renderReviewCard({ item }: { item: ReviewItem }) {
    const { note, status, subjectName, subjectColor } = item;
    const progress = getProgressPercent(note.reviewCount);
    const stageName = getStageName(note.reviewCount);
    const isDue = status.type === "due";
    const isOverdue = isDue && status.daysOverdue > 0;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <View style={[styles.cardBar, { backgroundColor: isDue ? (isOverdue ? colors.destructive : colors.accent) : colors.primary }]} />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
              {note.title || "无标题笔记"}
            </Text>
            <View style={[
              styles.statusBadge,
              {
                backgroundColor: isDue
                  ? (isOverdue ? colors.destructive + "20" : colors.accent + "20")
                  : colors.primary + "20",
                borderRadius: 100,
              }
            ]}>
              <Text style={[
                styles.statusText,
                {
                  color: isDue
                    ? (isOverdue ? colors.destructive : colors.accent)
                    : colors.primary,
                }
              ]}>
                {status.label}
              </Text>
            </View>
          </View>

          {subjectName ? (
            <View style={[styles.subjectPill, { backgroundColor: subjectColor + "20" }]}>
              <Text style={[styles.subjectText, { color: subjectColor }]}>{subjectName}</Text>
            </View>
          ) : null}

          <View style={styles.progressRow}>
            <Text style={[styles.stageText, { color: colors.mutedForeground }]}>
              {stageName}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
              <View style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progress * 100}%`,
                }
              ]} />
            </View>
            <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
              {note.reviewCount}/{totalStages}
            </Text>
          </View>

          {note.nextReviewAt && (
            <Text style={[styles.nextDate, { color: colors.mutedForeground }]}>
              下次复习：{formatReviewDate(note.nextReviewAt)}
            </Text>
          )}

          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => handleReview(note.id)}
              style={[styles.viewBtn, { borderColor: colors.border, borderRadius: colors.radius / 2 }]}
            >
              <Feather name="eye" size={14} color={colors.foreground} />
              <Text style={[styles.viewBtnText, { color: colors.foreground }]}>查看</Text>
            </TouchableOpacity>
            {isDue && (
              <TouchableOpacity
                onPress={() => handleCompleteReview(note.id)}
                style={[styles.reviewBtn, { backgroundColor: colors.primary, borderRadius: colors.radius / 2 }]}
              >
                <Feather name="check" size={14} color={colors.primaryForeground} />
                <Text style={[styles.reviewBtnText, { color: colors.primaryForeground }]}>完成复习</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  const allItems = [
    ...(dueItems.length > 0 ? [{ type: "header" as const, title: `待复习 (${dueItems.length})`, key: "due-header" }] : []),
    ...dueItems.map((item) => ({ type: "item" as const, data: item, key: `due-${item.note.id}` })),
    ...(upcomingItems.length > 0 ? [{ type: "header" as const, title: `即将复习 (${upcomingItems.length})`, key: "upcoming-header" }] : []),
    ...upcomingItems.map((item) => ({ type: "item" as const, data: item, key: `upcoming-${item.note.id}` })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.appTitle, { color: colors.foreground }]}>复习计划</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {dueItems.length > 0
            ? `${dueItems.length} 条笔记待复习`
            : "暂无待复习笔记"}
          {completedCount > 0 ? ` · ${completedCount} 条已完成` : ""}
        </Text>
      </View>

      <FlatList
        data={allItems}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 80 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <Text style={[styles.sectionHeader, { color: colors.foreground }]}>
                {item.title}
              </Text>
            );
          }
          return renderReviewCard({ item: item.data });
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState
              icon="clock"
              title="暂无复习任务"
              description="创建笔记后，系统会根据艾宾浩斯遗忘曲线自动安排复习计划"
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
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    fontFamily: "Inter_400Regular",
  },
  list: {
    paddingTop: 8,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  card: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    fontFamily: "Inter_700Bold",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  subjectPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stageText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    minWidth: 100,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    minWidth: 28,
    textAlign: "right",
  },
  nextDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  viewBtnText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  reviewBtnText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  empty: {
    flex: 1,
    marginTop: 80,
  },
});
