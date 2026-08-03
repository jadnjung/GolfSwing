/**
 * @format
 */

import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { App } from '../src/app/App';
import { useProfileStore } from '../src/state/profileStore';

function renderedText(tree: ReactTestRenderer.ReactTestRenderer): string {
  return tree.root
    .findAllByType(Text)
    .map(node =>
      Array.isArray(node.props.children)
        ? node.props.children.join('')
        : node.props.children,
    )
    .join(' | ');
}

describe('App', () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;

  afterEach(() => {
    // Unmount before resetting the store — otherwise the previous test's
    // tree is still subscribed when setState fires, outside of act().
    act(() => {
      tree?.unmount();
    });
    tree = undefined;
    useProfileStore.setState({ status: 'loading', profile: null });
  });

  test('renders the navigation shell and defaults to the Home tab once a profile exists', async () => {
    useProfileStore.setState({
      status: 'loaded',
      profile: {
        handedness: 'right',
        skillLevel: 'beginner',
        primaryClub: 'driver',
        units: 'imperial',
        privacyAcknowledgedAt: '2026-08-03T00:00:00.000Z',
      },
    });

    await act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });

    // Proves the navigator actually mounted the Home screen (not a blank
    // shell) and that the Zustand store reflects it via ActiveTabBanner —
    // not just that *something* rendered without crashing. JSX children are
    // separate array entries ("Active tab: ", "Home"), so join per-Text-node
    // rather than substring-matching the raw render tree.
    expect(renderedText(tree!)).toContain('Active tab: Home');
  });

  test('shows onboarding before a profile exists, and the tab shell after completing it', async () => {
    await act(async () => {
      tree = ReactTestRenderer.create(<App />);
    });

    expect(
      tree!.root.findAllByProps({ testID: 'onboarding-privacy' }).length,
    ).toBeGreaterThan(0);

    await act(async () => {
      tree!.root
        .findByProps({ testID: 'privacy-accept-button' })
        .props.onPress();
    });

    expect(
      tree!.root.findAllByProps({ testID: 'onboarding-profile' }).length,
    ).toBeGreaterThan(0);

    await act(async () => {
      tree!.root.findByProps({ testID: 'profile-save-button' }).props.onPress();
    });

    expect(renderedText(tree!)).toContain('Active tab: Home');
  });
});
