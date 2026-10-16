import { Stack, Redirect } from 'expo-router';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '@/src/hooks';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="add" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="insights" />
      </Stack>
      {!isLoading && !isAuthenticated && <Redirect href="/(auth)/login" />}
      {isLoading && (
        <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-background">
          <ActivityIndicator size="large" />
        </View>
      )}
    </>
  );
}
