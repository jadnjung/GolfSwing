import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { appendDiagnosticLog } from './diagnosticLog';
import { colors, spacing } from '../theme/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Stops a single render-time error anywhere in the tree from white-
 * screening the whole app (PRD 6.3: recover from a corrupted local record,
 * model initialization failure, etc. rather than crashing outright).
 * Logs locally only — never the video/pose data that caused the error,
 * just the thrown error's own message and stack.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const stack = error.stack ?? info.componentStack ?? undefined;
    appendDiagnosticLog({
      level: 'error',
      message: error.message,
      ...(stack != null ? { stack } : {}),
    });
  }

  reset = (): void => this.setState({ hasError: false });

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="error-boundary-fallback">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            This screen ran into a problem. Your saved swings are unaffected.
          </Text>
          <Pressable
            style={styles.button}
            onPress={this.reset}
            testID="error-boundary-retry"
          >
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  buttonText: {
    color: colors.background,
    fontWeight: '600',
  },
});
