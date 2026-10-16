import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useOffline } from '../src/hooks';
import '@/global.css';
import { type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient, persistOptions } from '@/src/lib/queryClient'
import { ThemeProvider } from '@/src/providers/ThemeProvider'
import { AppProvider } from '@/src/providers/AppProvider'


function RootLayoutNav() {
  // Initialize offline monitoring
  useOffline();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </KeyboardAvoidingView>
  );
}

// Preview = the RapidNative editor ('designer') or a staging deployment.
// Exported apps and production builds run in neither mode.
const isPreview =
  process.env.EXPO_PUBLIC_RAPIDNATIVE_MODE === 'designer' ||
  process.env.EXPO_PUBLIC_RAPIDNATIVE_MODE === 'staging';

function Providers({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </AppProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {isPreview ? (
        // Preview: no persistence, no stale demo data between reloads.
        <QueryClientProvider client={queryClient}>
          <Providers>
            <RootLayoutNav />
          </Providers>
        </QueryClientProvider>
      ) : (
        // Exported / production: persist the cache so a cold start is instant.
        <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
          <Providers>
            <RootLayoutNav />
          </Providers>
        </PersistQueryClientProvider>
      )}
    </SafeAreaProvider>
  );
}
