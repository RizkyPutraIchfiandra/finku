import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/src/hooks';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
      </Stack>
      {!isLoading && isAuthenticated && <Redirect href="/(app)" />}
    </>
  );
}
