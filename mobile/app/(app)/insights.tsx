import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useApp, useAuth, useTheme } from '@/src/hooks';
import { router } from 'expo-router';
import Svg, { Rect, G, Line, Text as SvgText } from 'react-native-svg';
import {
  ArrowLeftIcon,
  TargetIcon,
  ChartBarIcon,
  PiggyBankIcon,
} from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import type { Transaction, Category, SavingsGoal } from '@/src/db/types';
import { formatIDR, formatIDRShort } from '@/src/lib/format';

cssInterop(ArrowLeftIcon, { className: { target: 'style' } });
cssInterop(TargetIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(ChartBarIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });
cssInterop(PiggyBankIcon, { className: { target: 'style', nativeStyleToProp: { color: true } } });

// A small, accurate bar chart drawn with react-native-svg. No gradient hacks.
function CategoryBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const W = 320;
  const H = 180;
  const padL = 46;
  const padB = 40;
  const padT = 16;
  const padR = 12;

  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = chartW / Math.max(1, data.length);
  const barW = Math.min(38, slot * 0.6);

  return (
    <Svg width={W} height={H} accessibilityLabel="Spending by category">
      {/* gridlines */}
      {[0, 0.5, 1].map((t) => {
        const y = padT + chartH - chartH * t;
        return (
          <G key={t}>
            <Line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#121212" strokeWidth={1} opacity={0.15} />
            <SvgText x={padL - 6} y={y + 4} fontSize={9} fill="#6B6B6B" textAnchor="end">
              {formatIDRShort(max * t)}
            </SvgText>
          </G>
        );
      })}

      {/* bars */}
      {data.map((d, i) => {
        const h = Math.max(3, (d.value / max) * chartH);
        const x = padL + slot * i + (slot - barW) / 2;
        const y = padT + chartH - h;
        return (
          <G key={d.label + i}>
            <Rect x={x} y={y} width={barW} height={h} fill={d.color} stroke="#121212" strokeWidth={2} rx={4} />
            <SvgText x={x + barW / 2} y={H - padB + 16} fontSize={10} fill="#121212" textAnchor="middle">
              {d.label.length > 7 ? d.label.slice(0, 6) + '…' : d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export default function InsightsScreen() {
  const { client } = useApp();
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();

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

  const goal = useQuery({
    queryKey: ['savings_goals'],
    queryFn: async () => {
      const { data, error } = await client.from('savings_goals').select('*').limit(1);
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as SavingsGoal | null;
    },
  });

  const catMap = useMemo(() => {
    const m: Record<string, Category> = {};
    (cats.data ?? []).forEach((c) => (m[c.id] = c));
    return m;
  }, [cats.data]);

  const spending = useMemo(() => {
    const list = txns.data ?? [];
    const income = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [txns.data]);

  const bars = useMemo(() => {
    const totals: Record<string, number> = {};
    (txns.data ?? [])
      .filter((t) => t.type === 'expense' && t.category_id)
      .forEach((t) => {
        const id = t.category_id as string;
        totals[id] = (totals[id] ?? 0) + t.amount;
      });
    return Object.entries(totals)
      .map(([id, value]) => ({
        label: catMap[id]?.name ?? 'Other',
        value,
        color: catMap[id]?.color ?? '#E6E6E6',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [txns.data, catMap]);

  // Daily limit: the value set on Beranda (savings_goals.daily_limit).
  const dailyLimit = useMemo(() => Math.max(0, goal.data?.daily_limit ?? 0), [goal.data]);

  const todaySpent = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return (txns.data ?? [])
      .filter((t) => t.type === 'expense' && new Date(t.spent_at) >= start)
      .reduce((s, t) => s + t.amount, 0);
  }, [txns.data]);

  const loading = txns.isLoading || cats.isLoading || goal.isLoading;

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-2xl font-bold text-foreground text-center">Log in to see insights 📊</Text>
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
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={txns.isRefetching}
            onRefresh={() => {
              txns.refetch();
              cats.refetch();
              goal.refetch();
            }}
            tintColor={isDark ? '#F5F5F5' : '#121212'}
          />
        }
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
          <Text className="text-2xl font-bold text-foreground">Insights</Text>
        </View>

        {/* Daily limit */}
        <View className="px-5 mt-5">
          <View
            className="bg-accent border-2 border-border rounded-md p-5"
            style={{ shadowColor: '#000', shadowOffset: { width: 5, height: 5 }, shadowOpacity: 1, shadowRadius: 0, elevation: 5 }}
          >
            <View className="flex-row items-center gap-2">
              <TargetIcon className="text-accent-foreground" size={18} />
              <Text className="font-bold text-accent-foreground text-xs uppercase tracking-wide">
                Daily limit
              </Text>
            </View>
            {loading ? (
              <ActivityIndicator className="mt-2" color="#121212" />
            ) : (
              <Text className="text-4xl font-bold text-accent-foreground mt-1" style={{ letterSpacing: -1 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {formatIDR(dailyLimit)}
              </Text>
            )}
            <Text className="text-accent-foreground text-sm mt-2 font-semibold">
              Spent today: {formatIDR(todaySpent)}
            </Text>
          </View>
        </View>

        {/* Spending by category */}
        <View className="px-5 mt-6">
          <View className="flex-row items-center gap-2">
            <ChartBarIcon className="text-foreground" size={18} />
            <Text className="text-xl font-bold text-foreground">Spending by category</Text>
          </View>
          {loading ? (
            <ActivityIndicator className="mt-6" color="#121212" />
          ) : bars.length === 0 ? (
            <View className="bg-card border-2 border-border rounded-md p-6 mt-3 items-center">
              <Text className="text-4xl">📊</Text>
              <Text className="font-bold text-foreground mt-2">Nothing to chart yet</Text>
              <Text className="text-muted-foreground text-center text-sm mt-1">
                Log a few expenses and the bars show up here.
              </Text>
            </View>
          ) : (
            <View
              className="bg-card border-2 border-border rounded-md mt-3 items-center py-3"
              style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
            >
              <CategoryBarChart data={bars} />
            </View>
          )}
        </View>

        {/* Savings goal */}
        <View className="px-5 mt-6">
          <View className="flex-row items-center gap-2">
            <PiggyBankIcon className="text-foreground" size={18} />
            <Text className="text-xl font-bold text-foreground">Savings goal</Text>
          </View>
          <View
            className="bg-card border-2 border-border rounded-md p-4 mt-3"
            style={{ shadowColor: '#000', shadowOffset: { width: 3, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
          >
            <Row k="Monthly income" v={formatIDR(goal.data?.monthly_income ?? 0)} />
            <Row k="Monthly goal" v={formatIDR(goal.data?.monthly_goal ?? 0)} />
            <Row k="Left this month" v={formatIDR(spending.net)} />
            <Row k="Income logged" v={formatIDR(spending.income)} />
            <Row k="Expense logged" v={formatIDR(spending.expense)} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="text-muted-foreground text-sm">{k}</Text>
      <Text className="font-bold text-foreground text-sm">{v}</Text>
    </View>
  );
}
