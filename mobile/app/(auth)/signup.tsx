import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/hooks';
import { router } from 'expo-router';

export default function SignupScreen() {
  const { signUp, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    setErr(null);
    if (!email.trim() || !password) {
      setErr('Enter both your email and password.');
      return;
    }
    if (password.length < 6) {
      setErr('Password needs at least 6 characters.');
      return;
    }
    signUp.mutate(
      { email: email.trim(), password },
      {
        onSuccess: async () => {
          // Register only creates the account — send them to login to sign in.
          await signOut.mutateAsync().catch(() => {});
          router.replace('/(auth)/login');
        },
        onError: (e: Error) => setErr(e.message),
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View className="px-5 pt-6">
            <View
              className="bg-accent border-2 border-border rounded-md p-6"
              style={{ shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 }}
            >
              <Text className="text-3xl font-bold text-accent-foreground" style={{ letterSpacing: -0.5 }}>
                Start saving 💵
              </Text>
              <Text className="text-accent-foreground mt-2">
                Sisihkan nabung dulu, sisanya baru boleh dipakai.
              </Text>
            </View>
          </View>

          <View className="px-5 mt-6">
            <Text className="text-2xl font-bold text-foreground">Create account</Text>

            <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-5 mb-2">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@university.edu"
              placeholderTextColor="#9a9a9a"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              accessibilityLabel="Email"
              className="bg-card border-2 border-border rounded-md px-4 h-14 text-base text-foreground"
            />

            <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor="#9a9a9a"
              secureTextEntry
              autoCapitalize="none"
              accessibilityLabel="Password"
              onSubmitEditing={submit}
              returnKeyType="go"
              className="bg-card border-2 border-border rounded-md px-4 h-14 text-base text-foreground"
            />

            {err && <Text className="text-destructive text-sm font-semibold mt-3">{err}</Text>}

            <Pressable
              onPress={submit}
              disabled={signUp.isPending}
              accessibilityLabel="Sign up"
              className="mt-5 bg-accent border-2 border-border rounded-md h-14 items-center justify-center active:scale-[0.98]"
              style={{ shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
            >
              {signUp.isPending ? (
                <ActivityIndicator color="#121212" />
              ) : (
                <Text className="font-bold text-accent-foreground text-base">Sign up</Text>
              )}
            </Pressable>

            <View className="flex-row items-center justify-center mt-4">
              <Text className="text-foreground text-sm">Already have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/login')} accessibilityLabel="Log in">
                <Text className="text-secondary font-bold text-sm">Log in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
