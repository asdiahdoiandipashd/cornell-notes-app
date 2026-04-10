import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  type AIProviderConfig,
  getDefaultConfig,
  loadAIConfig,
  saveAIConfig,
  analyzeNotes as analyzeNotesService,
} from "@/services/aiService";

type AISettingsContextType = {
  config: AIProviderConfig;
  updateConfig: (config: AIProviderConfig) => Promise<void>;
  analyzeNotes: (
    notes: string,
    title?: string
  ) => Promise<{ cues: string; summary: string }>;
  isAnalyzing: boolean;
  isLoaded: boolean;
};

const AISettingsContext = createContext<AISettingsContextType | null>(null);

export function AISettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [config, setConfig] = useState<AIProviderConfig>(getDefaultConfig());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadAIConfig().then((c) => {
      setConfig(c);
      setIsLoaded(true);
    });
  }, []);

  const updateConfig = useCallback(async (newConfig: AIProviderConfig) => {
    setConfig(newConfig);
    await saveAIConfig(newConfig);
  }, []);

  const analyzeNotes = useCallback(
    async (notes: string, title?: string) => {
      setIsAnalyzing(true);
      try {
        return await analyzeNotesService(config, notes, title);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [config]
  );

  return (
    <AISettingsContext.Provider
      value={{ config, updateConfig, analyzeNotes, isAnalyzing, isLoaded }}
    >
      {children}
    </AISettingsContext.Provider>
  );
}

export function useAISettings() {
  const ctx = useContext(AISettingsContext);
  if (!ctx)
    throw new Error("useAISettings must be used within AISettingsProvider");
  return ctx;
}
