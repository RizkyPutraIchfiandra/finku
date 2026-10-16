import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp, useAuth, useTheme } from '@/src/hooks';
import { router } from 'expo-router';
import { PlusIcon, Settings2Icon, TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon, ChartBarIcon, WalletIcon, CoinsIcon, CheckIcon, Trash2Icon, LogOutIcon } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import type { Transaction, Category, Budget, SavingsGoal } from '@/src/db/types';
import { formatIDR, formatIDRShort } from '@/src/lib/format';
import { dayKey, dayLabel } from '@/src/lib/dates';

cssInterop(PlusIcon, { className: { target: 'style' } });
cssInterop(Settings2Icon, { className: { target: 'style' } });
cssInterop(TrendingUpIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(TrendingDownIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(AlertTriangleIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ChartBarIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(WalletIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(CoinsIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(CheckIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(Trash2Icon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(LogOutIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

/** Format a raw digit string as thousands-separated IDR, e.g. "1500000" -> "1.500.000". */
function formatAmountInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('id-ID');
}

/** Parse a formatted amount string back to a number, e.g. "1.500.000" -> 1500000. */
function parseAmount(text: string): number {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

export default function DashboardScreen() {
  const { client } = useApp();
  const { isAuthenticated, user, session, signOut } = useAuth();
  const { isDark } = useTheme();
  const queryClient = useQueryClient();

  const txns = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .order('spent_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });

  const cats = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await client.from('categories').select('*');
      if (error) throw error;
      return (data ?? []) as Category[];
    },
  });

  const budgets = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await client.from('budgets').select('*');
      if (error) throw error;
      return (data ?? []) as Budget[];
    },
  });

  const goal = useQuery({
    queryKey: ['savings_goals'],
    queryFn: async () => {
      const { data, error } = await client.from('savings_goals').select('*').limit(1);
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as SavingsGoal | null;
    },
  });

  // Budget panel inputs. `null` = untouched, so the field shows the saved value
  // until the user types. Avoids seeding state from an effect after the query resolves.
  const [incomeInput, setIncomeInput] = useState<string | null>(null);
  const [dailyInput, setDailyInput] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  // null = semua kategori; otherwise a category id (or '__none__' for uncategorized).
  const [filterCat, setFilterCat] = useState<string | null>(null);
  // null = semua hari; otherwise a "yyyy-MM-dd" day key.
  const [filterDay, setFilterDay] = useState<string | null>(null);

  const incomeValue =
    incomeInput ?? (goal.data?.monthly_income ? formatAmountInput(String(goal.data.monthly_income)) : '');
  const dailyValue =
    dailyInput ?? (goal.data?.daily_limit ? formatAmountInput(String(goal.data.daily_limit)) : '');

  const saveGoal = useMutation({
    mutationFn: async () => {
      const uid = user?.id ?? session?.user?.id;
      if (!uid) throw new Error('You need to be logged in to save your budget.');
      const { error } = await client.from('savings_goals').upsert(
        {
          id: uid,
          monthly_income: parseAmount(incomeValue),
          daily_limit: parseAmount(dailyValue),
          monthly_goal: goal.data?.monthly_goal ?? 0,
        },
        { onConflict: 'id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings_goals'] });
      setIncomeInput(null);
      setDailyInput(null);
      setSaved(true);
      setSaveErr(null);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e: Error) => setSaveErr(e.message),
  });

  // Delete a single transaction from the recent list.
  const deleteTxn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.from('transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  // Toggle a transaction's debt flag in place.
  const setDebt = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await client.from('transactions').update({ is_debt: value }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const monthlyBudget = goal.data?.monthly_income ?? 0;
  const dailyBudget = goal.data?.daily_limit ?? 0;
  const budgetSet = monthlyBudget > 0 || dailyBudget > 0;

  const balance = useMemo(() => {
    const list = txns.data ?? [];
    return list.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  }, [txns.data]);

  const spending = useMemo(() => {
    const list = txns.data ?? [];
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  }, [txns.data]);

  // Budget alerts: a category where spending already exceeds its monthly limit
  const alerts = useMemo(() => {
    const list = txns.data ?? [];
    const b = budgets.data ?? [];
    const c = cats.data ?? [];
    return b
      .map((budget) => {
        const spent = list
          .filter((t) => t.type === 'expense' && t.category_id === budget.category_id)
          .reduce((s, t) => s + t.amount, 0);
        const cat = c.find((x) => x.id === budget.category_id);
        return { budget, spent, cat };
      })
      .filter((x) => x.budget.monthly_limit > 0 && x.spent >= x.budget.monthly_limit);
  }, [txns.data, budgets.data, cats.data]);

  const catMap = useMemo(() => {
    const m: Record<string, Category> = {};
    (cats.data ?? []).forEach((c) => (m[c.id] = c));
    return m;
  }, [cats.data]);

  // Transactions filtered by the selected category chip (recent list).
  const filteredTxns = useMemo(() => {
    const list = txns.data ?? [];
    const byCat = !filterCat
      ? list
      : filterCat === '__none__'
        ? list.filter((t) => !t.category_id)
        : list.filter((t) => t.category_id === filterCat);
    if (!filterDay) return byCat;
    return byCat.filter((t) => dayKey(t.spent_at) === filterDay);
  }, [txns.data, filterCat, filterDay]);

  // Distinct days that have transactions, newest first — powers the day filter.
  const dayOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of txns.data ?? []) {
      const k = dayKey(t.spent_at);
      if (!seen.has(k)) seen.set(k, dayLabel(t.spent_at));
    }
    return [...seen.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, label]) => ({ key, label }));
  }, [txns.data]);

  // Filtered transactions grouped by calendar day (newest first) with a daily net.
  const groupedTxns = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; label: string; items: Transaction[]; net: number }
    >();
    for (const t of filteredTxns) {
      const key = dayKey(t.spent_at);
      const g = groups.get(key) ?? { key, label: dayLabel(t.spent_at), items: [], net: 0 };
      g.items.push(t);
      g.net += t.type === 'income' ? t.amount : -t.amount;
      groups.set(key, g);
    }
    return [...groups.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [filteredTxns]);

  // Start of today (local) — used for the daily jajan counter.
  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Start of the current month (local) — used for the monthly jajan counter.
  const monthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const spentToday = useMemo(
    () =>
      (txns.data ?? [])
        .filter((t) => t.type === 'expense' && new Date(t.spent_at) >= todayStart)
        .reduce((s, t) => s + t.amount, 0),
    [txns.data, todayStart],
  );

  const spentThisMonth = useMemo(
    () =>
      (txns.data ?? [])
        .filter((t) => t.type === 'expense' && new Date(t.spent_at) >= monthStart)
        .reduce((s, t) => s + t.amount, 0),
    [txns.data, monthStart],
  );

  // Income logged this month tops up the monthly allowance, so uang masuk
  // (transfer, gaji part-time) langsung menambah sisa yang boleh dipakai.
  const incomeThisMonth = useMemo(
    () =>
      (txns.data ?? [])
        .filter((t) => t.type === 'income' && new Date(t.spent_at) >= monthStart)
        .reduce((s, t) => s + t.amount, 0),
    [txns.data, monthStart],
  );

  // Debt list: transactions flagged `is_debt`, newest first.
  const debts = useMemo(() => {
    return (txns.data ?? [])
      .filter((t) => t.is_debt)
      .sort((a, b) => (a.spent_at < b.spent_at ? 1 : -1));
  }, [txns.data]);

  const debtTotal = useMemo(() => debts.reduce((s, t) => s + t.amount, 0), [debts]);
  const hasDebts = debts.length > 0;

  const monthlyAllowance = monthlyBudget + incomeThisMonth;
  const dailyLeft = dailyBudget > 0 ? dailyBudget - spentToday : 0;
  const monthlyLeft = budgetSet ? monthlyAllowance - spentThisMonth : 0;

  const loading = txns.isLoading || cats.isLoading || budgets.isLoading || goal.isLoading;

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-2xl font-bold text-foreground text-center">Log in to track your money 💸</Text>
        <Text className="text-muted-foreground text-center mt-2">
          Your transactions are private and safe with you.
        </Text>
        <Pressable
          onPress={() => router.push('/(auth)/login')}
          className="mt-6 bg-primary border-2 border-border rounded-md px-6 py-3.5 active:scale-[0.97]"
          style={{ shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
        >
          <Text className="font-bold text-primary-foreground text-base">Login / Sign up</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={txns.isRefetching}
            onRefresh={() => {
              txns.refetch();
              cats.refetch();
              budgets.refetch();
              goal.refetch();
            }}
            tintColor={isDark ? '#F5F5F5' : '#121212'}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-5 pt-4 flex-row items-center justify-between">
          <View className="flex-1 min-w-0 pr-3">
            <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Your campus wallet
            </Text>
            <Text className="text-2xl font-bold text-foreground mt-1" numberOfLines={1}>
              Finku
            </Text>
          </View>
          <View className="flex-row items-center gap-2.5 shrink-0">
            <Pressable
              onPress={() => router.push('/insights')}
              className="w-11 h-11 bg-card border-2 border-border rounded-md items-center justify-center active:scale-[0.97]"
              style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
              accessibilityLabel="See insights"
            >
              <ChartBarIcon className="text-foreground" size={22} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/categories')}
              className="w-11 h-11 bg-card border-2 border-border rounded-md items-center justify-center active:scale-[0.97]"
              style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
              accessibilityLabel="Manage categories"
            >
              <Settings2Icon className="text-foreground" size={22} />
            </Pressable>
            <Pressable
              onPress={() => signOut.mutate()}
              disabled={signOut.isPending}
              className="w-11 h-11 bg-card border-2 border-border rounded-md items-center justify-center active:scale-[0.97]"
              style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
              accessibilityLabel="Log out"
            >
              <LogOutIcon className="text-foreground" size={22} />
            </Pressable>
          </View>
        </View>

        {/* Budget panel: set uang jajan bulan ini + jajan harian */}
        <View className="px-5 mt-5">
          <View
            className="bg-card border-2 border-border rounded-md p-4"
            style={{ shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
          >
            <View className="flex-row items-center gap-2">
              <WalletIcon className="text-foreground" size={18} />
              <Text className="text-lg font-bold text-foreground">Atur uang jajan</Text>
            </View>

            <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
              Uang jajan bulan ini
            </Text>
            <View className="flex-row items-center bg-background border-2 border-border rounded-md px-4 h-14">
              <Text className="text-base font-bold text-muted-foreground mr-2">Rp</Text>
              <TextInput
                value={incomeValue}
                onChangeText={(v) => setIncomeInput(formatAmountInput(v))}
                placeholder="0"
                placeholderTextColor="#9a9a9a"
                keyboardType="number-pad"
                accessibilityLabel="Uang jajan bulan ini"
                className="flex-1 text-lg font-bold text-foreground"
              />
            </View>

            <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
              Jajan harian
            </Text>
            <View className="flex-row items-center bg-background border-2 border-border rounded-md px-4 h-14">
              <Text className="text-base font-bold text-muted-foreground mr-2">Rp</Text>
              <TextInput
                value={dailyValue}
                onChangeText={(v) => setDailyInput(formatAmountInput(v))}
                placeholder="0"
                placeholderTextColor="#9a9a9a"
                keyboardType="number-pad"
                accessibilityLabel="Jajan harian"
                className="flex-1 text-lg font-bold text-foreground"
              />
            </View>

            {saveErr && (
              <Text className="text-destructive text-sm font-semibold mt-3">{saveErr}</Text>
            )}

            <Pressable
              onPress={() => {
                setSaveErr(null);
                saveGoal.mutate();
              }}
              disabled={saveGoal.isPending}
              accessibilityLabel="Simpan budget"
              className="mt-4 bg-primary border-2 border-border rounded-md h-14 items-center justify-center active:scale-[0.98]"
              style={{ shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
            >
              {saveGoal.isPending ? (
                <ActivityIndicator color="#121212" />
              ) : saved ? (
                <View className="flex-row items-center gap-2">
                  <CheckIcon className="text-primary-foreground" size={20} />
                  <Text className="font-bold text-primary-foreground text-base">Tersimpan</Text>
                </View>
              ) : (
                <Text className="font-bold text-primary-foreground text-base">Simpan budget</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Hero balance card */}
        <View className="px-5 mt-5">
          <View
            className="bg-primary border-2 border-border rounded-md p-5"
            style={{ shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }}
          >
            <Text className="font-bold text-primary-foreground text-sm uppercase tracking-wide">
              Left to spend
            </Text>
            {loading ? (
              <ActivityIndicator className="mt-2" color="#121212" />
            ) : (
              <Text className="text-4xl font-bold text-primary-foreground mt-1" style={{ letterSpacing: -1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatIDR(balance)}
              </Text>
            )}
            <View className="flex-row flex-wrap items-center gap-2 mt-4">
              <View className="flex-row items-center gap-1.5 bg-black/10 rounded-md px-2.5 py-1.5">
                <TrendingUpIcon className="text-primary-foreground" size={16} />
                <Text className="font-bold text-primary-foreground text-sm">+{formatIDR(spending.income)} masuk</Text>
              </View>
              <View className="flex-row items-center gap-1.5 bg-black/10 rounded-md px-2.5 py-1.5">
                <TrendingDownIcon className="text-primary-foreground" size={16} />
                <Text className="font-bold text-primary-foreground text-sm">-{formatIDR(spending.expense)} keluar</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Jajan harian + sisa bulan ini */}
        {budgetSet && (
          <View className="px-5 mt-5 flex-row gap-3">
            <View
              className="flex-1 bg-card border-2 border-border rounded-md p-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
            >
              <View className="flex-row items-center gap-1.5">
                <CoinsIcon className="text-foreground" size={16} />
                <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Jajan harian
                </Text>
              </View>
              <Text
                className={`text-2xl font-bold mt-1 ${dailyLeft < 0 ? 'text-destructive' : 'text-foreground'}`}
                style={{ letterSpacing: -0.5 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {formatIDR(dailyLeft)}
              </Text>
              <Text className="text-muted-foreground text-xs mt-1" numberOfLines={1}>
                {formatIDR(spentToday)} / {formatIDR(dailyBudget)}
              </Text>
            </View>

            <View
              className="flex-1 bg-card border-2 border-border rounded-md p-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
            >
              <View className="flex-row items-center gap-1.5">
                <WalletIcon className="text-foreground" size={16} />
                <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sisa bulan ini
                </Text>
              </View>
              <Text
                className={`text-2xl font-bold mt-1 ${monthlyLeft < 0 ? 'text-destructive' : 'text-foreground'}`}
                style={{ letterSpacing: -0.5 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {formatIDR(monthlyLeft)}
              </Text>
              <Text className="text-muted-foreground text-xs mt-1" numberOfLines={1}>
                {formatIDR(spentThisMonth)} / {formatIDR(monthlyAllowance)}
              </Text>
            </View>
          </View>
        )}

        {/* Daftar hutang — expenses from categories flagged as debt */}
        {hasDebts && (
          <View className="px-5 mt-6">
            <View className="flex-row items-center gap-2">
              <CoinsIcon className="text-foreground" size={18} />
              <Text className="text-xl font-bold text-foreground">Daftar hutang</Text>
            </View>
            <Text className="text-muted-foreground text-sm mt-1">
              Transaksi yang kamu tandai hutang. Tekan 💸 di daftar transaksi untuk menandai.
            </Text>

            <View
              className="bg-secondary border-2 border-border rounded-md p-4 mt-3"
              style={{ shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}
            >
              <Text className="text-xs font-bold uppercase tracking-wider text-secondary-foreground">
                Total hutang
              </Text>
              <Text
                className="text-3xl font-bold text-secondary-foreground mt-1"
                style={{ letterSpacing: -0.5 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {formatIDR(debtTotal)}
              </Text>
            </View>

            {debts.length === 0 ? (
              <View className="bg-card border-2 border-border rounded-md p-6 mt-3 items-center">
                <Text className="text-4xl">🎉</Text>
                <Text className="font-bold text-foreground mt-2">Belum ada hutang</Text>
                <Text className="text-muted-foreground text-center text-sm mt-1">
                  Tekan 💸 di daftar transaksi buat menandai hutang.
                </Text>
              </View>
            ) : (
              <View className="mt-3 gap-3">
                {debts.map((t) => {
                  const cat = catMap[t.category_id ?? ''];
                  return (
                    <View
                      key={t.id}
                      className="bg-card border-2 border-border rounded-md p-4"
                      style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
                    >
                      <View className="flex-row items-center">
                        <View
                          className="w-11 h-11 rounded-md border-2 border-border items-center justify-center"
                          style={{ backgroundColor: cat?.color ?? '#E6E6E6' }}
                        >
                          <Text className="text-xl">{cat?.emoji ?? '💸'}</Text>
                        </View>
                        <View className="flex-1 min-w-0 ml-3">
                          <Text className="font-bold text-foreground text-base" numberOfLines={1}>
                            {t.description}
                          </Text>
                          <Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
                            {cat?.name ?? 'Hutang'} · {dayLabel(t.spent_at)}
                          </Text>
                        </View>
                        <Text className="font-bold text-foreground text-base ml-3 shrink-0" numberOfLines={1}>
                          {formatIDR(t.amount)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Budget alerts */}
        {alerts.length > 0 && (
          <View className="px-5 mt-5">
            <Text className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Heads up, you&apos;re over budget
            </Text>
            {alerts.map((a) => (
              <View
                key={a.budget.id}
                className="flex-row items-center gap-3 bg-secondary border-2 border-border rounded-md px-3.5 py-3 mb-2"
              >
                <AlertTriangleIcon className="text-secondary-foreground" size={20} />
                <Text className="flex-1 min-w-0 font-semibold text-secondary-foreground text-sm">
                  {a.cat?.emoji ?? '💸'} {a.budget.name}
                </Text>
                <Text className="font-bold text-secondary-foreground text-sm">
                  {formatIDRShort(a.spent)} / {formatIDRShort(a.budget.monthly_limit)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent transactions */}
        <View className="px-5 mt-6">
          <Text className="text-xl font-bold text-foreground">Recent transactions</Text>

          {/* Filter per kategori */}
          {(cats.data ?? []).length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingTop: 12 }}
            >
              <Pressable
                onPress={() => setFilterCat(null)}
                accessibilityLabel="Semua kategori"
                className={`border-2 border-border rounded-md px-3 py-2 ${filterCat === null ? 'bg-primary' : 'bg-card'}`}
                style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
              >
                <Text className="font-bold text-foreground text-sm">Semua</Text>
              </Pressable>
              {(cats.data ?? []).map((c) => {
                const active = filterCat === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setFilterCat(active ? null : c.id)}
                    accessibilityLabel={`Filter ${c.name}`}
                    className={`flex-row items-center gap-2 border-2 border-border rounded-md px-3 py-2 ${active ? 'bg-primary' : 'bg-card'}`}
                    style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
                  >
                    <View
                      className="w-7 h-7 rounded-sm border-2 border-border items-center justify-center"
                      style={{ backgroundColor: c.color }}
                    >
                      <Text className="text-sm">{c.emoji}</Text>
                    </View>
                    <Text className="font-bold text-foreground text-sm" numberOfLines={1}>
                      {c.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {/* Filter per hari */}
          {dayOptions.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingTop: 8 }}
            >
              <Pressable
                onPress={() => setFilterDay(null)}
                accessibilityLabel="Semua hari"
                className={`border-2 border-border rounded-md px-3 py-2 ${filterDay === null ? 'bg-accent' : 'bg-card'}`}
                style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
              >
                <Text className="font-bold text-foreground text-sm">Semua hari</Text>
              </Pressable>
              {dayOptions.map((d) => {
                const active = filterDay === d.key;
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => setFilterDay(active ? null : d.key)}
                    accessibilityLabel={`Filter ${d.label}`}
                    className={`border-2 border-border rounded-md px-3 py-2 ${active ? 'bg-accent' : 'bg-card'}`}
                    style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
                  >
                    <Text className="font-bold text-foreground text-sm" numberOfLines={1}>
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {txns.isError && (
            <Text className="text-destructive text-sm mt-2">Couldn&apos;t load transactions. Pull to retry.</Text>
          )}
          {!txns.isLoading && (txns.data ?? []).length === 0 && (
            <View className="bg-card border-2 border-border rounded-md p-6 mt-3 items-center">
              <Text className="text-4xl">🪙</Text>
              <Text className="font-bold text-foreground mt-2">No transactions yet</Text>
              <Text className="text-muted-foreground text-center text-sm mt-1">
                Tap that big yellow button to log your first one.
              </Text>
            </View>
          )}
          {!txns.isLoading && (txns.data ?? []).length > 0 && filteredTxns.length === 0 && (
            <View className="bg-card border-2 border-border rounded-md p-6 mt-3 items-center">
              <Text className="text-4xl">🔍</Text>
              <Text className="font-bold text-foreground mt-2">Belum ada transaksi</Text>
              <Text className="text-muted-foreground text-center text-sm mt-1">
                Kategori ini belum punya transaksi.
              </Text>
            </View>
          )}
          <View className="mt-3">
            {groupedTxns.map((g) => (
              <View key={g.key} className="mb-5">
                {/* Day header: tanggal + nama hari + net harian */}
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-bold text-foreground text-base" numberOfLines={1}>
                    {g.label}
                  </Text>
                  <Text
                    className={`font-bold text-sm shrink-0 ml-2 ${g.net < 0 ? 'text-destructive' : 'text-accent'}`}
                    numberOfLines={1}
                  >
                    {g.net >= 0 ? '+' : ''}{formatIDR(g.net)}
                  </Text>
                </View>

                <View className="gap-3">
                  {g.items.map((t) => {
                    const cat = t.category_id ? catMap[t.category_id] : undefined;
                    return (
                      <View
                        key={t.id}
                        className="bg-card border-2 border-border rounded-md p-4"
                        style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
                      >
                        <View className="flex-row items-center">
                          <View className="w-11 h-11 rounded-md border-2 border-border items-center justify-center" style={{ backgroundColor: cat?.color ?? '#E6E6E6' }}>
                            <Text className="text-xl">{cat?.emoji ?? (t.type === 'income' ? '🪙' : '💳')}</Text>
                          </View>
                          <View className="flex-1 min-w-0 ml-3">
                            <Text className="font-bold text-foreground text-base" numberOfLines={1}>
                              {t.description}
                            </Text>
                            <Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
                              {cat?.name ?? (t.type === 'income' ? 'Income' : 'Uncategorized')}
                            </Text>
                          </View>
                          <Text
                            className={`font-bold text-base ml-3 shrink-0 ${t.type === 'income' ? 'text-accent' : 'text-foreground'}`}
                            numberOfLines={1}
                          >
                            {t.type === 'income' ? '+' : '-'}{formatIDR(t.amount)}
                          </Text>
                          <Pressable
                            onPress={() => setDebt.mutate({ id: t.id, value: !t.is_debt })}
                            disabled={setDebt.isPending}
                            accessibilityLabel={t.is_debt ? `Hapus hutang ${t.description}` : `Tandai hutang ${t.description}`}
                            className={`w-10 h-10 border-2 border-border rounded-md items-center justify-center active:scale-[0.97] ml-2 shrink-0 ${t.is_debt ? 'bg-secondary' : 'bg-card'}`}
                          >
                            <Text className="text-base">{t.is_debt ? '✓' : '💸'}</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => deleteTxn.mutate(t.id)}
                            disabled={deleteTxn.isPending}
                            accessibilityLabel={`Hapus ${t.description}`}
                            className="w-10 h-10 bg-card border-2 border-border rounded-md items-center justify-center active:scale-[0.97] ml-2 shrink-0"
                          >
                            <Trash2Icon className="text-destructive" size={18} />
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Asymmetric floating add button */}
      <View className="absolute bottom-8 right-6">
        <Pressable
          onPress={() => router.push('/add')}
          accessibilityLabel="Add transaction"
          className="bg-secondary border-2 border-border rounded-md px-6 py-4 active:scale-[0.96]"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 5, height: 5 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 5,
            transform: [{ rotate: '-3deg' }],
          }}
        >
          <View className="flex-row items-center gap-2">
            <PlusIcon className="text-secondary-foreground" size={24} />
            <Text className="font-bold text-secondary-foreground text-lg">Add</Text>
          </View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
