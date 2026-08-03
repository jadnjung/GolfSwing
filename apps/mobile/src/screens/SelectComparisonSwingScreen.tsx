import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Swing } from '@golf-swing/domain';
import { listSwings } from '../data/swingRepository';
import type { HistoryStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<
  HistoryStackParamList,
  'SelectComparisonSwing'
>;

type LoadState = 'loading' | 'loaded' | 'error';

function formatDuration(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

// MVP item 20's second half: HistoryScreen starts the comparison flow by
// picking the first swing; this screen picks the second from everything
// else, then pushes CompareScreen with both ids.
export function SelectComparisonSwingScreen({ navigation, route }: Props) {
  const { firstSwingId } = route.params;
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [swings, setSwings] = useState<Swing[]>([]);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const result = await listSwings();
      setSwings(result.filter(swing => swing.id !== firstSwingId));
      setLoadState('loaded');
    } catch {
      setLoadState('error');
    }
  }, [firstSwingId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Compare with…</Text>

      {loadState === 'loading' ? (
        <Text style={styles.message}>Loading…</Text>
      ) : loadState === 'error' ? (
        <Text style={styles.message}>Couldn't load swing history.</Text>
      ) : swings.length === 0 ? (
        <Text style={styles.message}>
          No other swings recorded yet to compare with.
        </Text>
      ) : (
        <FlatList
          data={swings}
          keyExtractor={swing => swing.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate('Compare', {
                  swingIdA: firstSwingId,
                  swingIdB: item.id,
                })
              }
              testID="comparison-candidate-row"
            >
              <Text style={styles.rowTitle}>
                {item.clubType} · {item.cameraView}
              </Text>
              <Text style={styles.rowSubtitle}>
                {formatDate(item.createdAt)} · {formatDuration(item.durationMs)}
              </Text>
            </Pressable>
          )}
          style={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  rowSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
