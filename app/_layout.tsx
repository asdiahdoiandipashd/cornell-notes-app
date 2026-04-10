import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

let KeyboardProvider: React.ComponentType<{ children: React.ReactNode }> | null = null;
try {
  if (Platform.OS !== "web") {
    const mod = require("react-native-keyboard-controller");
    if (mod?.KeyboardControllerNative?.getConstants) {
      KeyboardProvider = mod.KeyboardProvider;
    }
  }
} catch {
  KeyboardProvider = null;
}

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AISettingsProvider } from "@/context/AISettingsContext";
import { NotesProvider } from "@/context/NotesContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="note/new" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="note/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            {KeyboardProvider ? (
              <KeyboardProvider>
                <AISettingsProvider>
                  <NotesProvider>
                    <RootLayoutNav />
                  </NotesProvider>
                </AISettingsProvider>
              </KeyboardProvider>
            ) : (
              <AISettingsProvider>
                <NotesProvider>
                  <RootLayoutNav />
                </NotesProvider>
              </AISettingsProvider>
            )}
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
