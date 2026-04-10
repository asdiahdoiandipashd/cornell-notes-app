import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type { CornellNote, Subject } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";
import { getReviewStatus } from "@/services/reviewService";

type Props = {
  note: CornellNote;
  subject?: Subject;
  onDelete?: () => void;
};

function formatDate(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 86400000 && d.getDate() === now.getDate()) return "今天";
  if (diff < 172800000) return "昨天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function NoteCard({ note, subject, onDelete }: Props) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }

  function handlePress() {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    router.push({ pathname: "/note/[id]", params: { id: note.id } });
  }

  const subjectColor = subject
    ? (colors.subjectColors as string[])[subject.colorIndex % (colors.subjectColors as string[]).length]
    : colors.primary;

  const reviewStatus = getReviewStatus(note.reviewCount, note.nextReviewAt);
  const showReviewBadge = reviewStatus.type === "due";
  const isOverdue = reviewStatus.type === "due" && reviewStatus.daysOverdue > 0;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      >
        <View style={[styles.subjectBar, { backgroundColor: subjectColor }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
              {note.title || "无标题笔记"}
            </Text>
            {showReviewBadge && (
              <View style={[styles.reviewBadge, { backgroundColor: isOverdue ? colors.destructive + "20" : colors.accent + "20" }]}>
                <Text style={[styles.reviewBadgeText, { color: isOverdue ? colors.destructive : colors.accent }]}>
                  {reviewStatus.label}
                </Text>
              </View>
            )}
            <Text style={[styles.date, { color: colors.mutedForeground }]}>
              {formatDate(note.updatedAt)}
            </Text>
          </View>
          {subject && (
            <View style={[styles.subjectPill, { backgroundColor: subjectColor + "20" }]}>
              <Text style={[styles.subjectText, { color: subjectColor }]}>{subject.name}</Text>
            </View>
          )}
          {note.cues ? (
            <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={1}>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>Q: </Text>
              {note.cues.split("\n")[0]}
            </Text>
          ) : null}
          {note.notes ? (
            <Text style={[styles.preview, { color: colors.mutedForeground }]} numberOfLines={2}>
              {note.notes}
            </Text>
          ) : null}
          {note.summary ? (
            <View style={[styles.summaryChip, { backgroundColor: colors.summaryArea, borderRadius: colors.radius / 2 }]}>
              <Feather name="file-text" size={11} color={colors.accent} />
              <Text style={[styles.summaryText, { color: colors.mutedForeground }]} numberOfLines={1}>
                {note.summary}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  subjectBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
    fontFamily: "Inter_700Bold",
  },
  date: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  reviewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  reviewBadgeText: {
    fontSize: 10,
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
  preview: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  summaryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  summaryText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
});
