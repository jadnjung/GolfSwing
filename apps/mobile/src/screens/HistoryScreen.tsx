import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Swing } from '@golf-swing/domain';
import { deleteSwing, listSwings } from '../data/swingRepository';
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

function SwingRow({
  swing,
  onPress,
  onDelete,
}: {
  swing: Swing;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row} testID="swing-row">
      <Pressable
        style={styles.rowContent}
        onPress={onPress}
        testID="swing-row-content"
      >
        <Text style={styles.rowTitle}>
          {swing.clubType} · {swing.cameraView}
        </Text>
        <Text style={styles.rowSubtitle}>
          {formatDate(swing.createdAt)} · {formatDuration(swing.durationMs)}
        </Text>
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={8} testID="delete-swing-button">
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    </View>
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

  const confirmDelete = useCallback(
    (swing: Swing) => {
      Alert.alert(
        'Delete this swing?',
        `${swing.clubType} · ${formatDate(swing.createdAt)} will be permanently deleted. This can't be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteSwing(swing.id);
                await load();
              } catch (error) {
                Alert.alert(
                  "Couldn't delete this swing",
                  error instanceof Error ? error.message : undefined,
                );
              }
            },
          },
        ],
      );
    },
    [load],
  );

  return (
    // Bottom edge excluded — the bottom tab navigator already accounts
    // for the home indicator inset for its own bar.
    <SafeAreaView
      style={styles.container}
      edges={['top']}
      testID="history-screen"
    >
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
              onDelete={() => confirmDelete(item)}
            />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowContent: {
    flex: 1,
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
  deleteText: {
    color: '#D14343',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
});
