import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Swing } from '@golf-swing/domain';
import { listSwings } from '../data/swingRepository';
import type { HistoryStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryList'>;

type LoadState = 'loading' | 'loaded' | 'error';

function formatDuration(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

function SwingRow({ swing, onPress }: { swing: Swing; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress} testID="swing-row">
      <Text style={styles.rowTitle}>
        {swing.clubType} · {swing.cameraView}
      </Text>
      <Text style={styles.rowSubtitle}>
        {formatDate(swing.createdAt)} · {formatDuration(swing.durationMs)}
      </Text>
    </Pressable>
  );
}

export function HistoryScreen({ navigation }: Props) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [swings, setSwings] = useState<Swing[]>([]);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const result = await listSwings();
      setSwings(result);
      setLoadState('loaded');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container} testID="history-screen">
      <Text style={styles.title}>History</Text>

      {loadState === 'loading' ? (
        <Text style={styles.message}>Loading…</Text>
      ) : loadState === 'error' ? (
        <Text style={styles.message}>Couldn't load swing history.</Text>
      ) : swings.length === 0 ? (
        <Text style={styles.message}>No swings recorded yet.</Text>
      ) : (
        <FlatList
          data={swings}
          keyExtractor={swing => swing.id}
          renderItem={({ item }) => (
            <SwingRow
              swing={item}
              onPress={() =>
                navigation.navigate('Replay', { swingId: item.id })
              }
            />
          )}
          style={styles.list}
        />
      )}
    </View>
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
