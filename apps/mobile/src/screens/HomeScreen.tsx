import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { Swing } from '@golf-swing/domain';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { SwingThumbnail } from '../components/SwingThumbnail';
import { Body, Caption, Heading, Title } from '../components/Typography';
import { listSwings } from '../data/swingRepository';
import type { RootTabParamList } from '../navigation/types';
import { colors, spacing } from '../theme/theme';
import { formatDate, formatDuration } from '../utils/formatSwing';

type Props = BottomTabScreenProps<RootTabParamList, 'Home'>;

// How many recent swings the dashboard previews before pointing the user to
// the full History tab — enough to feel like a real list, not so many that
// this screen turns into a second History screen.
const RECENT_SWINGS_LIMIT = 5;

function RecentSwingRow({ swing }: { swing: Swing }) {
  return (
    <View style={styles.recentRow} testID="home-recent-swing-row">
      <SwingThumbnail swingId={swing.id} size={48} />
      <View style={styles.recentRowText}>
        <Body style={styles.recentRowTitle}>
          {swing.clubType} · {swing.cameraView}
        </Body>
        <Caption>
          {formatDate(swing.createdAt)} · {formatDuration(swing.durationMs)}
        </Caption>
      </View>
    </View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const [recentSwings, setRecentSwings] = useState<Swing[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // useFocusEffect, not a mount-only useEffect: this tab stays mounted
  // across tab switches (the same bottom-tab-navigator behavior already
  // worked around in HistoryScreen and RecordScreen), so a swing recorded
  // after the first visit here would otherwise never show up.
  useFocusEffect(
    useCallback(() => {
      listSwings()
        .then(swings => {
          setRecentSwings(swings.slice(0, RECENT_SWINGS_LIMIT));
          setHasLoaded(true);
        })
        .catch(() => {
          // Matches HistoryScreen's own failure handling: an unreadable
          // swings directory degrades to an empty list here rather than
          // blocking the dashboard with an error state for what's meant to
          // be a lightweight preview, not the source of truth.
          setRecentSwings([]);
          setHasLoaded(true);
        });
    }, []),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Title>Home</Title>

      <Card style={styles.recordCard} testID="home-record-cta">
        <Heading>Ready to record?</Heading>
        <Body>Capture a new swing and start building your history.</Body>
        <Button
          label="Record a swing"
          onPress={() => navigation.navigate('Record')}
          style={styles.recordButton}
        />
      </Card>

      <View style={styles.recentSection}>
        <Pressable
          style={styles.recentHeader}
          onPress={() => navigation.navigate('History')}
          accessibilityRole="button"
          accessibilityLabel="View all swings in History"
        >
          <Heading>Recent swings</Heading>
          {recentSwings.length > 0 ? <Caption>See all</Caption> : null}
        </Pressable>

        {!hasLoaded ? null : recentSwings.length === 0 ? (
          <EmptyState
            testID="home-empty-state"
            message="No swings recorded yet. Record your first one above."
          />
        ) : (
          <FlatList
            data={recentSwings}
            keyExtractor={swing => swing.id}
            renderItem={({ item }) => <RecentSwingRow swing={item} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  recordCard: {
    gap: spacing.sm,
  },
  recordButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  recentSection: {
    flex: 1,
    gap: spacing.sm,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentRowText: {
    flex: 1,
  },
  recentRowTitle: {
    textTransform: 'capitalize',
    color: colors.text,
  },
});
