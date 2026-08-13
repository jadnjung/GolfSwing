import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import VideoIcon from 'lucide-react-native/icons/video';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Swing } from '@golf-swing/domain';
import {
  deleteSwing,
  getSwingSizeBytes,
  getSwingThumbnail,
  listSwings,
  setSwingTags,
} from '../data/swingRepository';
import type { HistoryStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme/theme';
import { formatBytes } from '../utils/formatBytes';

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistoryList'>;

type LoadState = 'loading' | 'loaded' | 'error';

function formatDuration(durationMs: number): string {
  return `${(durationMs / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

// ADR 0015: a swing history is inherently visual (it's video) — pure text
// rows meant finding "that swing from yesterday" had no visual recall aid
// at all. Generated/cached per swing (getSwingThumbnail), not blocking:
// falls back to a placeholder icon while loading or if generation fails,
// never a broken image or a blank row.
function SwingThumbnail({ swingId }: { swingId: string }) {
  const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSwingThumbnail(swingId).then(path => {
      if (!cancelled && path != null) {
        setThumbnailPath(path);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [swingId]);

  if (thumbnailPath != null) {
    return (
      <Image
        source={{ uri: `file://${thumbnailPath}` }}
        style={styles.thumbnail}
        testID="swing-thumbnail"
      />
    );
  }
  return (
    <View
      style={[styles.thumbnail, styles.thumbnailPlaceholder]}
      testID="swing-thumbnail-placeholder"
    >
      <VideoIcon color={colors.textMuted} size={20} />
    </View>
  );
}

function SwingRow({
  swing,
  onPress,
  onDelete,
  onEditTags,
  onCompare,
}: {
  swing: Swing;
  onPress: () => void;
  onDelete: () => void;
  onEditTags: () => void;
  onCompare: () => void;
}) {
  return (
    <View style={styles.row} testID="swing-row">
      <Pressable
        style={styles.rowContent}
        onPress={onPress}
        testID="swing-row-content"
        accessibilityRole="button"
        accessibilityLabel={`${swing.clubType} swing from ${formatDate(swing.createdAt)}, view replay`}
      >
        <SwingThumbnail swingId={swing.id} />
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>
            {swing.clubType} · {swing.cameraView}
          </Text>
          <Text style={styles.rowSubtitle}>
            {formatDate(swing.createdAt)} · {formatDuration(swing.durationMs)}
          </Text>
          {swing.tags.length > 0 ? (
            <View style={styles.tagList}>
              {swing.tags.map(tag => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.rowActions}>
        <Pressable
          onPress={onEditTags}
          hitSlop={8}
          testID="edit-tags-button"
          accessibilityRole="button"
          accessibilityLabel={`Edit tags for ${swing.clubType} swing from ${formatDate(swing.createdAt)}`}
        >
          <Text style={styles.actionText}>Tags</Text>
        </Pressable>
        <Pressable
          onPress={onCompare}
          hitSlop={8}
          testID="compare-swing-button"
          accessibilityRole="button"
          accessibilityLabel={`Compare ${swing.clubType} swing from ${formatDate(swing.createdAt)} with another swing`}
        >
          <Text style={styles.actionText}>Compare</Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          testID="delete-swing-button"
          accessibilityRole="button"
          accessibilityLabel={`Delete ${swing.clubType} swing from ${formatDate(swing.createdAt)}`}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TagEditorModal({
  swing,
  onClose,
  onSave,
}: {
  swing: Swing;
  onClose: () => void;
  onSave: (tags: string[]) => void;
}) {
  const [tags, setTags] = useState<string[]>(swing.tags);
  const [draftText, setDraftText] = useState('');

  const addTag = useCallback(() => {
    const trimmed = draftText.trim();
    if (trimmed.length === 0 || tags.includes(trimmed)) {
      setDraftText('');
      return;
    }
    setTags(current => [...current, trimmed]);
    setDraftText('');
  }, [draftText, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags(current => current.filter(existing => existing !== tag));
  }, []);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard} testID="tag-editor-modal">
          <Text style={styles.title}>Edit tags</Text>

          <View style={styles.tagList}>
            {tags.map(tag => (
              <Pressable
                key={tag}
                style={styles.tagChip}
                onPress={() => removeTag(tag)}
                testID="tag-chip"
                accessibilityRole="button"
                accessibilityLabel={`Remove tag ${tag}`}
              >
                <Text style={styles.tagChipText}>{tag} ✕</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.tagInput}
            value={draftText}
            onChangeText={setDraftText}
            onSubmitEditing={addTag}
            placeholder="Add a tag"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            testID="tag-input"
            accessibilityLabel="New tag"
          />

          <View style={styles.modalActions}>
            <Pressable
              onPress={onClose}
              testID="tag-editor-cancel"
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.actionText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => onSave(tags)}
              testID="tag-editor-save"
              accessibilityRole="button"
              accessibilityLabel="Save tags"
            >
              <Text style={styles.primaryActionText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function HistoryScreen({ navigation }: Props) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [swings, setSwings] = useState<Swing[]>([]);
  const [editingSwing, setEditingSwing] = useState<Swing | null>(null);

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

  // useFocusEffect, not a plain mount-only useEffect: bottom-tab navigators
  // keep inactive screens mounted (the same behavior that needed working
  // around for the landscape lock in RecordScreen, ADR 0013), so a
  // mount-only load here would show a stale list forever after the first
  // visit — never picking up a swing recorded after this screen first
  // mounted, until the whole app restarts.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmDelete = useCallback(
    async (swing: Swing) => {
      const sizeBytes = await getSwingSizeBytes(swing.id);
      Alert.alert(
        'Delete this swing?',
        `${swing.clubType} · ${formatDate(swing.createdAt)} will be permanently deleted, freeing ${formatBytes(sizeBytes)}. This can't be undone.`,
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

  const saveTags = useCallback(
    async (tags: string[]) => {
      if (editingSwing == null) {
        return;
      }
      try {
        await setSwingTags(editingSwing.id, tags);
        setEditingSwing(null);
        await load();
      } catch (error) {
        Alert.alert(
          "Couldn't save tags",
          error instanceof Error ? error.message : undefined,
        );
      }
    },
    [editingSwing, load],
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
              onEditTags={() => setEditingSwing(item)}
              onCompare={() =>
                navigation.navigate('SelectComparisonSwing', {
                  firstSwingId: item.id,
                })
              }
            />
          )}
          style={styles.list}
        />
      )}

      {editingSwing != null ? (
        <TagEditorModal
          swing={editingSwing}
          onClose={() => setEditingSwing(null)}
          onSave={saveTags}
        />
      ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
  actionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  primaryActionText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteText: {
    color: '#D14343',
    fontSize: 13,
    fontWeight: '600',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 20, 0.6)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  tagInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.text,
  },
});
