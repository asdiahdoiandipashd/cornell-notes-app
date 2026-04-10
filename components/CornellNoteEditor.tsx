import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  cues: string;
  notes: string;
  summary: string;
  onChangeTitle: (v: string) => void;
  onChangeCues: (v: string) => void;
  onChangeNotes: (v: string) => void;
  onChangeSummary: (v: string) => void;
  onAIAnalyze?: () => void;
  isAnalyzing?: boolean;
  scrollable?: boolean;
};

export default function CornellNoteEditor({
  title,
  cues,
  notes,
  summary,
  onChangeTitle,
  onChangeCues,
  onChangeNotes,
  onChangeSummary,
  onAIAnalyze,
  isAnalyzing,
  scrollable = true,
}: Props) {
  const colors = useColors();
  const notesRef = useRef<TextInput>(null);
  const summaryRef = useRef<TextInput>(null);

  const canAnalyze = !!notes.trim() && !isAnalyzing;

  const Wrapper = scrollable ? ScrollView : View;
  const wrapperProps = scrollable
    ? {
        style: [styles.container, { backgroundColor: colors.background }],
        contentContainerStyle: styles.content,
        keyboardDismissMode: "interactive" as const,
        keyboardShouldPersistTaps: "handled" as const,
      }
    : {
        style: [styles.content, { backgroundColor: colors.background }],
      };

  return (
    <Wrapper {...wrapperProps}>
      <TextInput
        style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.border }]}
        value={title}
        onChangeText={onChangeTitle}
        placeholder="笔记标题..."
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="next"
        onSubmitEditing={() => notesRef.current?.focus()}
      />

      {onAIAnalyze && (
        <TouchableOpacity
          onPress={onAIAnalyze}
          disabled={!canAnalyze}
          style={[
            styles.aiButton,
            {
              backgroundColor: canAnalyze ? colors.primary : colors.muted,
              borderRadius: colors.radius,
              opacity: canAnalyze ? 1 : 0.5,
            },
          ]}
          activeOpacity={0.7}
          testID="ai-analyze-btn"
        >
          {isAnalyzing ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <MaterialCommunityIcons
              name="auto-fix"
              size={18}
              color={canAnalyze ? colors.primaryForeground : colors.mutedForeground}
            />
          )}
          <Text
            style={[
              styles.aiButtonText,
              { color: canAnalyze ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            {isAnalyzing ? "AI 分析中..." : "AI 智能提取"}
          </Text>
        </TouchableOpacity>
      )}

      <View style={[styles.cornellLayout, { borderRadius: colors.radius, borderColor: colors.border }]}>
        <View style={styles.mainRow}>
          <View style={[styles.cueColumn, { backgroundColor: colors.cueArea, borderRightColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>关键词 / 问题</Text>
            <TextInput
              style={[styles.areaInput, { color: colors.foreground }]}
              value={cues}
              onChangeText={onChangeCues}
              placeholder={"写下关键词\n或问题..."}
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
              returnKeyType="next"
            />
          </View>

          <View style={[styles.noteColumn, { backgroundColor: colors.noteArea }]}>
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>课堂笔记</Text>
            <TextInput
              ref={notesRef}
              style={[styles.areaInput, { color: colors.foreground }]}
              value={notes}
              onChangeText={onChangeNotes}
              placeholder={"在这里记录课堂笔记、要点、例子..."}
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
              onSubmitEditing={() => summaryRef.current?.focus()}
            />
          </View>
        </View>

        <View style={[styles.summaryRow, { backgroundColor: colors.summaryArea, borderTopColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.accent }]}>总结 / 复习摘要</Text>
          <TextInput
            ref={summaryRef}
            style={[styles.areaInput, styles.summaryInput, { color: colors.foreground }]}
            value={summary}
            onChangeText={onChangeSummary}
            placeholder="用自己的话总结本页笔记的核心内容..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={[styles.tip, { backgroundColor: colors.muted, borderRadius: colors.radius / 2 }]}>
        <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
          康奈尔笔记法：左列写关键词/问题，右列记课堂内容，底部写总结。点击「AI 智能提取」可自动生成问题和总结。
        </Text>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 80,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: "700",
    paddingVertical: 10,
    borderBottomWidth: 1,
    fontFamily: "Inter_700Bold",
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  aiButtonText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  cornellLayout: {
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 480,
  },
  mainRow: {
    flexDirection: "row",
    flex: 1,
  },
  cueColumn: {
    width: "35%",
    borderRightWidth: 1,
    padding: 12,
    minHeight: 320,
  },
  noteColumn: {
    flex: 1,
    padding: 12,
    minHeight: 320,
  },
  summaryRow: {
    borderTopWidth: 1,
    padding: 12,
    minHeight: 120,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    fontFamily: "Inter_700Bold",
  },
  areaInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 100,
    fontFamily: "Inter_400Regular",
  },
  summaryInput: {
    minHeight: 80,
  },
  tip: {
    padding: 12,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
});
