import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/src/hooks';
import { router } from 'expo-router';
import { newId } from '@/src/lib/id';
import { ArrowLeftIcon, Trash2Icon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import type { Category } from '@/src/db/types';

cssInterop(ArrowLeftIcon, { className: { target: 'style' } });
cssInterop(Trash2Icon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

const COLORS = ['#FF5DA2', '#FFC53D', '#4EA8FF', '#59D07C', '#9B8CFF', '#FF9E57', '#FF6B6B', '#2BC3C9'];
const EMOJIS = ['🍜', '🎮', '📚', '🚌', '💸', '☕', '🛍️', '🍕'];

export default function CategoriesScreen() {
  const { client } = useApp();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [colorIdx, setColorIdx] = useState(0);
  const [emojiIdx, setEmojiIdx] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const cats = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await client.from('categories').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await client.from('categories').insert({
        id: newId(),
        name: name.trim(),
        color: COLORS[colorIdx],
        emoji: EMOJIS[emojiIdx],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setName('');
      setErr(null);
    },
    onError: (e: Error) => setErr(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const submit = () => {
    setErr(null);
    if (!name.trim()) {
      setErr('Give your category a name.');
      return;
    }
    add.mutate();
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="px-5 pt-4 flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Back"
              className="w-11 h-11 bg-card border-2 border-border rounded-md items-center justify-center active:scale-[0.97]"
              style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
            >
              <ArrowLeftIcon className="text-foreground" size={22} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">Categories</Text>
          </View>

          {/* Make your own */}
          <View className="px-5 mt-5">
            <View
              className="bg-card border-2 border-border rounded-md p-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
            >
              <Text className="text-lg font-bold text-foreground">Make your own</Text>

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Category name (e.g. Groceries)"
                placeholderTextColor="#9a9a9a"
                accessibilityLabel="Category name"
                className="mt-3 bg-background border-2 border-border rounded-md px-4 h-14 text-base text-foreground"
              />

              <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
                Pick a color
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {COLORS.map((c, i) => (
                  <Pressable
                    key={c}
                    onPress={() => setColorIdx(i)}
                    accessibilityLabel={`Color ${c}`}
                    className={`w-10 h-10 rounded-sm border-2 border-border ${colorIdx === i ? 'border-4' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </View>

              <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
                Pick an emoji
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {EMOJIS.map((e, i) => (
                  <Pressable
                    key={e}
                    onPress={() => setEmojiIdx(i)}
                    accessibilityLabel={`Emoji ${e}`}
                    className={`w-11 h-11 rounded-sm border-2 border-border items-center justify-center ${emojiIdx === i ? 'bg-primary border-4' : 'bg-background'}`}
                  >
                    <Text className="text-xl">{e}</Text>
                  </Pressable>
                ))}
              </View>

              {err && <Text className="text-destructive text-sm font-semibold mt-4">{err}</Text>}

              <Pressable
                onPress={submit}
                disabled={add.isPending}
                accessibilityLabel="Add category"
                className="mt-4 bg-primary border-2 border-border rounded-md h-14 items-center justify-center active:scale-[0.98]"
                style={{ shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
              >
                <Text className="font-bold text-primary-foreground text-base">Add category</Text>
              </Pressable>
            </View>
          </View>

          {/* Your categories */}
          <View className="px-5 mt-6">
            <Text className="text-xl font-bold text-foreground">Your categories</Text>
            <View className="mt-3 gap-3">
              {(cats.data ?? []).map((c) => (
                <View
                  key={c.id}
                  className="flex-row items-center bg-card border-2 border-border rounded-md px-4 py-3"
                  style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
                >
                  <View
                    className="w-11 h-11 rounded-md border-2 border-border items-center justify-center"
                    style={{ backgroundColor: c.color }}
                  >
                    <Text className="text-xl">{c.emoji}</Text>
                  </View>
                  <Text className="flex-1 min-w-0 ml-3 font-bold text-foreground text-base" numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Pressable
                    onPress={() => remove.mutate(c.id)}
                    accessibilityLabel={`Delete ${c.name}`}
                    className="w-11 h-11 bg-card border-2 border-border rounded-md items-center justify-center active:scale-[0.97]"
                  >
                    <Trash2Icon className="text-destructive" size={20} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
