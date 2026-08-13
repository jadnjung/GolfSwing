import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import VideoIcon from 'lucide-react-native/icons/video';
import { getSwingThumbnail } from '../data/swingRepository';
import { colors, radii } from '../theme/theme';

// ADR 0015: a swing history is inherently visual (it's video) — pure text
// rows meant finding "that swing from yesterday" had no visual recall aid
// at all. Generated/cached per swing (getSwingThumbnail), not blocking:
// falls back to a placeholder icon while loading or if generation fails,
// never a broken image or a blank row. Extracted out of HistoryScreen
// (where it was first built) once HomeScreen's dashboard needed the same
// thumbnail — same bar as any other second real usage in this codebase.
export function SwingThumbnail({
  swingId,
  size = 64,
}: {
  swingId: string;
  size?: number;
}) {
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

  const dimensionStyle = {
    width: size,
    height: size,
    borderRadius: radii.sm,
  };

  if (thumbnailPath != null) {
    return (
      <Image
        source={{ uri: `file://${thumbnailPath}` }}
        style={[styles.thumbnail, dimensionStyle]}
        testID="swing-thumbnail"
      />
    );
  }
  return (
    <View
      style={[styles.thumbnail, styles.thumbnailPlaceholder, dimensionStyle]}
      testID="swing-thumbnail-placeholder"
    >
      <VideoIcon color={colors.textMuted} size={Math.round(size * 0.3)} />
    </View>
  );
}

const styles = StyleSheet.create({
  thumbnail: {
    backgroundColor: colors.surface,
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
