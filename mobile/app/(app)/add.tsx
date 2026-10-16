import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/src/hooks';
import { router } from 'expo-router';
import { newId } from '@/src/lib/id';
import { ArrowLeftIcon, TrendingUpIcon, TrendingDownIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import type { Category } from '@/src/db/types';

cssInterop(ArrowLeftIcon, { className: { target: 'style' } });
cssInterop(TrendingUpIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(TrendingDownIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

const CATEGORY_COLORS = ['#FF5DA2', '#FFC53D', '#4EA8FF', '#59D07C', '#9B8CFF', '#FF9E57'];

export default function AddScreen() {
  const { client } = useApp();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const cats = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await client.from('categories').select('*');
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const numericAmount = useMemo(() => {
    const digits = amount.replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  }, [amount]);

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await client.from('transactions').insert({
        id: newId(),
        amount: numericAmount,
        description: description.trim(),
        type,
        category_id: type === 'expense' ? categoryId : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      router.back();
    },
    onError: (e: Error) => setErr(e.message),
  });

  const submit = () => {
    setErr(null);
    if (!numericAmount || numericAmount <= 0) {
      setErr('Enter an amount greater than 0.');
      return;
    }
    if (!description.trim()) {
      setErr('Add a short description.');
      return;
    }
    if (type === 'expense' && !categoryId) {
      setErr('Pick a category.');
      return;
    }
    create.mutate();
  };

  const formatAmountInput = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, '');
    if (!digits) return '';
    return Number(digits).toLocaleString('id-ID');
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
            <Text className="text-2xl font-bold text-foreground">Add transaction</Text>
          </View>

          {/* Type toggle */}
          <View className="px-5 mt-5">
            <View className="flex-row bg-card border-2 border-border rounded-md p-1 gap-1">
              <Pressable
                onPress={() => setType('expense')}
                accessibilityLabel="Expense"
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-sm ${type === 'expense' ? 'bg-secondary border-2 border-border' : ''}`}
              >
                <TrendingDownIcon className="text-foreground" size={18} />
                <Text className="font-bold text-foreground">Expense</Text>
              </Pressable>
              <Pressable
                onPress={() => setType('income')}
                accessibilityLabel="Income"
                className={`flex-1 flex-row items-center justify-center gap-2 py-3 rounded-sm ${type === 'income' ? 'bg-accent border-2 border-border' : ''}`}
              >
                <TrendingUpIcon className="text-foreground" size={18} />
                <Text className="font-bold text-foreground">Income</Text>
              </Pressable>
            </View>
          </View>

          {/* Amount */}
          <View className="px-5 mt-5">
            <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Amount
            </Text>
            <View className="flex-row items-center bg-card border-2 border-border rounded-md px-4 h-16">
              <Text className="text-2xl font-bold text-muted-foreground mr-2">Rp</Text>
              <TextInput
                value={amount}
                onChangeText={(v) => setAmount(formatAmountInput(v))}
                placeholder="0"
                placeholderTextColor="#9a9a9a"
                keyboardType="number-pad"
                accessibilityLabel="Amount"
                className="flex-1 text-3xl font-bold text-foreground"
              />
            </View>
          </View>

          {/* Description */}
          <View className="px-5 mt-5">
            <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              What for?
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Burrito, textbook, tutoring gig"
              placeholderTextColor="#9a9a9a"
              accessibilityLabel="What for?"
              className="bg-card border-2 border-border rounded-md px-4 h-14 text-base text-foreground"
            />
          </View>

          {/* Category */}
          {type === 'expense' && (
            <View className="px-5 mt-5">
              <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Category
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(cats.data ?? []).map((c, i) => {
                  const active = categoryId === c.id;
                  const color = c.color || CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setCategoryId(c.id)}
                      accessibilityLabel={c.name}
                      className={`flex-row items-center gap-2 border-2 border-border rounded-md px-3 py-2.5 ${active ? 'bg-primary' : 'bg-card'}`}
                      style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
                    >
                      <View
                        className="w-8 h-8 rounded-sm border-2 border-border items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        <Text className="text-base">{c.emoji}</Text>
                      </View>
                      <Text className="font-bold text-foreground text-sm" numberOfLines={1}>
                        {c.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {err && (
            <View className="px-5 mt-5">
              <Text className="text-destructive text-sm font-semibold">{err}</Text>
            </View>
          )}

          {/* Save */}
          <View className="px-5 mt-6">
            <Pressable
              onPress={submit}
              disabled={create.isPending}
              accessibilityLabel="Save it"
              className="bg-primary border-2 border-border rounded-md h-14 items-center justify-center active:scale-[0.98]"
              style={{ shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 }}
            >
              {create.isPending ? (
                <ActivityIndicator color="#121212" />
              ) : (
                <Text className="font-bold text-primary-foreground text-lg">Save it 💾</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
