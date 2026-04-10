import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAISettings } from "@/context/AISettingsContext";
import { useColors } from "@/hooks/useColors";
import {
  AI_PROVIDERS,
  type AIProviderType,
  getPresetForType,
} from "@/services/aiService";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { config, updateConfig, isLoaded } = useAISettings();

  const [selectedType, setSelectedType] = useState<AIProviderType>(config.type);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [modelName, setModelName] = useState(config.modelName);
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setSelectedType(config.type);
      setApiKey(config.apiKey);
      setBaseUrl(config.baseUrl);
      setModelName(config.modelName);
    }
  }, [isLoaded, config]);

  useEffect(() => {
    setHasChanges(
      selectedType !== config.type ||
        apiKey !== config.apiKey ||
        baseUrl !== config.baseUrl ||
        modelName !== config.modelName
    );
  }, [selectedType, apiKey, baseUrl, modelName, config]);

  function handleSelectProvider(type: AIProviderType) {
    setSelectedType(type);
    const preset = getPresetForType(type);
    if (type !== config.type) {
      setApiKey("");
      setBaseUrl(preset.defaultBaseUrl);
      setModelName(preset.defaultModel);
    }
    setShowApiKey(false);
  }

  async function handleSave() {
    const preset = getPresetForType(selectedType);
    if (preset.needsApiKey && !apiKey.trim()) {
      Alert.alert("提示", "请输入 API Key");
      return;
    }
    if (selectedType === "custom" && !baseUrl.trim()) {
      Alert.alert("提示", "请输入 API 地址");
      return;
    }
    if (selectedType === "custom" && !modelName.trim()) {
      Alert.alert("提示", "请输入模型名称");
      return;
    }

    await updateConfig({
      type: selectedType,
      apiKey: apiKey.trim(),
      baseUrl: (baseUrl || preset.defaultBaseUrl).trim(),
      modelName: (modelName || preset.defaultModel).trim(),
    });
    setHasChanges(false);
    Alert.alert("已保存", "AI 服务商配置已更新");
  }

  const currentPreset = getPresetForType(selectedType);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          设置
        </Text>
        {hasChanges && (
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius / 2,
              },
            ]}
          >
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
              保存
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          AI 服务商
        </Text>
        <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
          选择用于智能提取问题和总结的 AI 服务
        </Text>

        <View style={styles.providerList}>
          {AI_PROVIDERS.map((provider) => {
            const isSelected = selectedType === provider.type;
            return (
              <TouchableOpacity
                key={provider.type}
                onPress={() => handleSelectProvider(provider.type)}
                style={[
                  styles.providerCard,
                  {
                    backgroundColor: isSelected
                      ? colors.secondary
                      : colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.providerInfo}>
                  <View style={styles.providerRow}>
                    <Text
                      style={[
                        styles.providerName,
                        {
                          color: isSelected
                            ? colors.primary
                            : colors.foreground,
                        },
                      ]}
                    >
                      {provider.label}
                    </Text>
                    {isSelected && (
                      <Feather
                        name="check-circle"
                        size={18}
                        color={colors.primary}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.providerDesc,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {provider.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {currentPreset.needsApiKey && (
          <View style={styles.configSection}>
            <Text
              style={[styles.configLabel, { color: colors.foreground }]}
            >
              API Key
            </Text>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius / 2,
                },
              ]}
            >
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder={currentPreset.placeholder}
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowApiKey(!showApiKey)}
                style={styles.eyeBtn}
              >
                <Feather
                  name={showApiKey ? "eye-off" : "eye"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>

            <Text
              style={[styles.configLabel, { color: colors.foreground, marginTop: 16 }]}
            >
              API 地址
            </Text>
            <TextInput
              style={[
                styles.inputFull,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius / 2,
                },
              ]}
              value={baseUrl || currentPreset.defaultBaseUrl}
              onChangeText={setBaseUrl}
              placeholder="https://api.example.com/v1"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text
              style={[styles.configLabel, { color: colors.foreground, marginTop: 16 }]}
            >
              模型名称
            </Text>
            <TextInput
              style={[
                styles.inputFull,
                {
                  color: colors.foreground,
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius / 2,
                },
              ]}
              value={modelName || currentPreset.defaultModel}
              onChangeText={setModelName}
              placeholder="model-name"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: colors.muted,
              borderRadius: colors.radius / 2,
            },
          ]}
        >
          <Feather
            name="info"
            size={14}
            color={colors.mutedForeground}
            style={{ marginTop: 2 }}
          />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {selectedType === "builtin"
              ? "内置 AI 免费使用，无需配置。使用体验可能受限于服务器负载。"
              : selectedType === "custom"
              ? "请填入任何兼容 OpenAI Chat Completions API 的服务地址。API Key 仅存储在本地设备中。"
              : `API Key 仅存储在本地设备中，不会上传到服务器。请前往 ${currentPreset.label} 官网获取 API Key。`}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
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
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  providerList: {
    gap: 8,
  },
  providerCard: {
    borderWidth: 1.5,
    padding: 14,
  },
  providerInfo: {
    gap: 4,
  },
  providerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  providerName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  providerDesc: {
    fontSize: 12,
  },
  configSection: {
    marginTop: 8,
  },
  configLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    fontFamily: "Inter_600SemiBold",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 12,
  },
  eyeBtn: {
    padding: 6,
  },
  inputFull: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  infoBox: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
